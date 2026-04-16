"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { buildSingleEliminationBracket, pushWinnerToNextRound } from "@/lib/bracket";
import { resolveRegistrationRole } from "@/lib/auth-profile";
import { countryLabels } from "@/lib/catalog";
import { clearSession, getCurrentUser, setSession } from "@/lib/auth";
import { withMessage } from "@/lib/messages";
import { makeId, hashPassword, slugify, verifyPassword } from "@/lib/security";
import { readStore, resetStore, updateStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageTournament, getTeamById, getTournamentById } from "@/lib/selectors";
import type { AppStore, CountryCode, Team, Tournament, User, UserRole } from "@/lib/types";

const MAX_TOURNAMENT_TITLE_LENGTH = 80;
const MAX_TOURNAMENT_PRIZE_POOL_USD = 100_000;
const MAX_TOURNAMENT_TEAM_LIMIT = 64;
const MAX_RULES_COUNT = 10;
const MAX_RULE_LENGTH = 160;
const MIN_TOURNAMENT_DATE_OFFSET_DAYS = -30;
const MAX_TOURNAMENT_DATE_OFFSET_DAYS = 400;
const MAX_TOURNAMENT_CHAT_MESSAGE_LENGTH = 600;

type TournamentMutationInput = {
  title: string;
  disciplineSlug: string;
  startsAt: string;
  prizePoolUSD: number | null;
  format: string;
  teamLimit: number | null;
  rulesRaw: string;
};

function normalizeReturnTo(
  rawValue: FormDataEntryValue | null,
  fallback: string,
) {
  if (typeof rawValue !== "string") {
    return fallback;
  }

  return rawValue.startsWith("/") ? rawValue : fallback;
}

function requireText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function parseInteger(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseCountry(value: string): CountryCode | null {
  const country = value.toUpperCase() as CountryCode;
  return country in countryLabels ? country : null;
}

function normalizeDisciplines(rawValue: string, allowedDisciplines: string[]) {
  const allowed = new Set(allowedDisciplines);
  const normalized = rawValue
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => allowed.has(entry));

  return [...new Set(normalized)];
}

function normalizeDisciplineValues(values: FormDataEntryValue[], allowedDisciplines: string[]) {
  const allowed = new Set(allowedDisciplines);
  const normalized = values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => allowed.has(value));

  return [...new Set(normalized)];
}

function normalizeTournamentRules(rawValue: string) {
  return rawValue
    .split("\n")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .slice(0, MAX_RULES_COUNT);
}

function isTournamentDateAllowed(date: Date) {
  const now = new Date();
  const minDate = new Date(now);
  minDate.setDate(minDate.getDate() + MIN_TOURNAMENT_DATE_OFFSET_DAYS);

  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + MAX_TOURNAMENT_DATE_OFFSET_DAYS);

  return date >= minDate && date <= maxDate;
}

function validateTournamentFormat(format: string, supportedFormats: string[]) {
  const tokens = format
    .split(/[\/,|]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (tokens.length === 0) {
    return false;
  }

  const allowed = new Set(supportedFormats.map((entry) => entry.toLowerCase()));
  return tokens.every((token) => allowed.has(token));
}

function isSupabaseEmailConfirmationError(message: string | undefined) {
  return /email not confirmed/i.test(message ?? "");
}

function mapSupabaseLoginError(message: string | undefined) {
  if (!message) {
    return "Не удалось войти в аккаунт.";
  }

  if (/invalid login credentials/i.test(message)) {
    return "Неверный email или пароль.";
  }

  if (isSupabaseEmailConfirmationError(message)) {
    return "Аккаунт ещё не подтверждён. Попробуйте войти ещё раз.";
  }

  return "Не удалось войти в аккаунт. Попробуйте ещё раз.";
}

function mapSupabaseRegistrationError(message: string | undefined) {
  if (!message) {
    return "Не удалось создать аккаунт.";
  }

  if (/already been registered|user already registered/i.test(message)) {
    return "Пользователь с таким email уже существует.";
  }

  return "Не удалось создать аккаунт. Попробуйте ещё раз.";
}

function mapSupabaseOAuthError(message: string | undefined) {
  if (!message) {
    return "Не удалось начать вход через Google.";
  }

  if (/provider.*disabled|unsupported provider/i.test(message)) {
    return "Вход через Google сейчас недоступен.";
  }

  return "Не удалось начать вход через Google. Попробуйте ещё раз.";
}

function mapRegistrationPersistenceError(message: string | undefined) {
  if (!message) {
    return "Не удалось завершить регистрацию. Попробуйте ещё раз.";
  }

  if (/profiles.*nickname|profiles_nickname_key/i.test(message)) {
    return "Никнейм уже занят.";
  }

  if (/profiles.*email|profiles_email_key/i.test(message)) {
    return "Пользователь с таким email уже существует.";
  }

  if (/profiles.*auth_user_id|profiles_auth_user_id_key/i.test(message)) {
    return "Этот аккаунт уже привязан. Попробуйте войти через страницу входа.";
  }

  if (/Failed to list auth users|Failed to read|Failed to upsert|Failed to delete/i.test(message)) {
    return "Не удалось сохранить профиль. Попробуйте ещё раз.";
  }

  return "Не удалось завершить регистрацию. Попробуйте ещё раз.";
}

async function signInSupabaseUser(email: string, password: string) {
  const supabase = await createSupabaseServerClient();
  let result = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (result.error && isSupabaseEmailConfirmationError(result.error.message)) {
    try {
      const confirmed = await confirmSupabaseUserEmailByEmail(email);

      if (confirmed) {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }
    } catch {
      return {
        user: null,
        errorMessage: "Не удалось подтвердить аккаунт.",
      };
    }
  }

  if (result.error || !result.data.user) {
    return {
      user: null,
      errorMessage: mapSupabaseLoginError(result.error?.message),
    };
  }

  return {
    user: result.data.user,
    errorMessage: null,
  };
}

async function findSupabaseAuthUserByEmail(email: string) {
  const supabaseAdmin = createSupabaseServiceClient();
  const normalizedEmail = email.toLowerCase();
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw new Error(`Failed to list auth users: ${error.message}`);
    }

    const authUsers = data.users ?? [];
    const matchedUser =
      authUsers.find((entry) => entry.email?.toLowerCase() === normalizedEmail) ?? null;

    if (matchedUser) {
      return matchedUser;
    }

    if (authUsers.length < 200) {
      break;
    }

    page += 1;
  }

  return null;
}

async function confirmSupabaseUserEmailByEmail(email: string) {
  const supabaseAdmin = createSupabaseServiceClient();
  const authUser = await findSupabaseAuthUserByEmail(email);

  if (!authUser || authUser.email_confirmed_at) {
    return false;
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
    email_confirm: true,
  });

  if (error) {
    throw new Error(`Failed to confirm auth user: ${error.message}`);
  }

  return true;
}

async function resolveSiteOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (origin) {
    return origin;
  }

  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const forwardedHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  if (forwardedHost) {
    return `http://${forwardedHost}`;
  }

  return "http://localhost:3000";
}

async function requireAuthOrRedirect() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(withMessage("/login", "error", "Сначала войдите в систему."));
  }

  return user;
}

async function requireOrganizerOrRedirect(returnTo: string) {
  const user = await requireAuthOrRedirect();

  if (user.role !== "organizer") {
    redirect(withMessage(returnTo, "error", "Недостаточно прав для этого действия."));
  }

  return user;
}

function canUserRegisterTeam(user: User, team: Team) {
  return team.captainId === user.id;
}

function touchPaths() {
  revalidatePath("/");
  revalidatePath("/games");
  revalidatePath("/tournaments");
  revalidatePath("/teams");
  revalidatePath("/profile");
  revalidatePath("/profile/tournaments");
  revalidatePath("/admin");
  revalidatePath("/login");
  revalidatePath("/register");
}

function touchTournamentPaths(tournamentId?: string) {
  touchPaths();

  if (tournamentId) {
    revalidatePath(`/tournaments/${tournamentId}`);
  }
}

function readTournamentMutationInput(formData: FormData): TournamentMutationInput {
  return {
    title: requireText(formData.get("title")),
    disciplineSlug: requireText(formData.get("disciplineSlug")),
    startsAt: requireText(formData.get("startsAt")),
    prizePoolUSD: parseInteger(requireText(formData.get("prizePoolUSD"))),
    format: requireText(formData.get("format")),
    teamLimit: parseInteger(requireText(formData.get("teamLimit"))),
    rulesRaw: requireText(formData.get("rules")),
  };
}

function validateTournamentMutationInput(
  store: AppStore,
  input: TournamentMutationInput,
  options?: {
    existingTournament?: Tournament | null;
  },
) {
  const existingTournament = options?.existingTournament ?? null;
  const { title, disciplineSlug, startsAt, prizePoolUSD, format, teamLimit, rulesRaw } = input;

  if (!title || !disciplineSlug || !startsAt || !format || !teamLimit) {
    return { ok: false as const, message: "Заполните обязательные поля турнира." };
  }

  const discipline = store.disciplines.find((entry) => entry.slug === disciplineSlug);
  if (!discipline) {
    return { ok: false as const, message: "Дисциплина не найдена." };
  }

  if (title.length < 4 || title.length > MAX_TOURNAMENT_TITLE_LENGTH) {
    return {
      ok: false as const,
      message: `Название турнира должно быть длиной от 4 до ${MAX_TOURNAMENT_TITLE_LENGTH} символов.`,
    };
  }

  const normalizedDate = new Date(startsAt);
  if (Number.isNaN(normalizedDate.getTime())) {
    return { ok: false as const, message: "Некорректная дата турнира." };
  }

  if (!isTournamentDateAllowed(normalizedDate)) {
    return {
      ok: false as const,
      message: "Дата турнира должна быть в пределах последних 30 дней или ближайших 400 дней.",
    };
  }

  if (prizePoolUSD === null || prizePoolUSD < 0 || prizePoolUSD > MAX_TOURNAMENT_PRIZE_POOL_USD) {
    return {
      ok: false as const,
      message: `Призовой фонд должен быть в диапазоне от 0 до ${MAX_TOURNAMENT_PRIZE_POOL_USD} USD.`,
    };
  }

  if (teamLimit === null || teamLimit < 2 || teamLimit > MAX_TOURNAMENT_TEAM_LIMIT) {
    return {
      ok: false as const,
      message: `Лимит команд должен быть от 2 до ${MAX_TOURNAMENT_TEAM_LIMIT}.`,
    };
  }

  if (format.length < 2 || format.length > 40) {
    return { ok: false as const, message: "Формат должен быть длиной от 2 до 40 символов." };
  }

  if (!validateTournamentFormat(format, discipline.formats)) {
    return {
      ok: false as const,
      message: `Формат должен использовать значения из дисциплины: ${discipline.formats.join(", ")}.`,
    };
  }

  const normalizedRules = normalizeTournamentRules(rulesRaw);
  if (normalizedRules.some((rule) => rule.length < 4 || rule.length > MAX_RULE_LENGTH)) {
    return {
      ok: false as const,
      message: `Каждое правило должно быть длиной от 4 до ${MAX_RULE_LENGTH} символов.`,
    };
  }

  if (existingTournament) {
    const registeredCount =
      existingTournament.appliedTeamIds.length + existingTournament.approvedTeamIds.length;

    if (disciplineSlug !== existingTournament.disciplineSlug && registeredCount > 0) {
      return {
        ok: false as const,
        message: "Нельзя менять игру турнира после появления заявок.",
      };
    }

    if (teamLimit < registeredCount) {
      return {
        ok: false as const,
        message: `Лимит команд не может быть меньше ${registeredCount}, потому что команды уже зарегистрированы.`,
      };
    }

    if (existingTournament.bracket.length > 0 && format !== existingTournament.format) {
      return {
        ok: false as const,
        message: "Нельзя менять формат после генерации турнирной сетки.",
      };
    }
  }

  return {
    ok: true as const,
    data: {
      title,
      disciplineSlug,
      startsAt: normalizedDate.toISOString(),
      prizePoolUSD,
      format,
      teamLimit,
      rules: normalizedRules.length > 0 ? normalizedRules : ["Стандартные правила турнира"],
    },
  };
}

export async function loginAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/profile");
  const email = requireText(formData.get("email")).toLowerCase();
  const password = requireText(formData.get("password"));

  if (!email || !password) {
    redirect(withMessage(returnTo, "error", "Введите email и пароль."));
  }

  if (isSupabaseConfigured()) {
    const signInResult = await signInSupabaseUser(email, password);

    if (!signInResult.user) {
      redirect(withMessage(returnTo, "error", signInResult.errorMessage ?? "Не удалось войти."));
    }

    const store = await readStore();
    const linkedProfile = store.users.find((entry) => entry.authUserId === signInResult.user.id);

    if (!linkedProfile) {
      const seedProfile = store.users.find(
        (entry) => entry.email === email && !entry.authUserId,
      );

      if (seedProfile) {
        await updateStore((draft) => {
          const profile = draft.users.find((entry) => entry.id === seedProfile.id);
          if (profile) {
            profile.authUserId = signInResult.user.id;
            profile.passwordHash = "";
          }
        });
        touchPaths();
      }
    }

    redirect(withMessage(returnTo, "success", "Вы успешно вошли."));
  }

  const store = await readStore();
  const user = store.users.find((entry) => entry.email === email) ?? null;

  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect(withMessage(returnTo, "error", "Неверный email или пароль."));
  }

  await setSession(user.id);
  redirect(withMessage(returnTo, "success", "Вы успешно вошли."));
}

export async function beginGoogleAuthAction(formData: FormData) {
  const sourcePath = normalizeReturnTo(formData.get("sourcePath"), "/login");
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/profile");
  const intent = requireText(formData.get("intent")) === "register" ? "register" : "login";

  if (!isSupabaseConfigured()) {
    redirect(
      withMessage(sourcePath, "error", "Google-вход сейчас недоступен."),
    );
  }

  try {
    const origin = await resolveSiteOrigin();
    const callbackUrl = new URL("/auth/callback", origin);
    callbackUrl.searchParams.set("next", returnTo);
    callbackUrl.searchParams.set("source", sourcePath);
    callbackUrl.searchParams.set("intent", intent);

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error || !data.url) {
      redirect(withMessage(sourcePath, "error", mapSupabaseOAuthError(error?.message)));
    }
    return redirect(data.url);
  } catch (error) {
    unstable_rethrow(error);
    const message = error instanceof Error ? error.message : undefined;
    redirect(withMessage(sourcePath, "error", mapSupabaseOAuthError(message)));
  }
}

export async function registerAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/profile");
  const email = requireText(formData.get("email")).toLowerCase();
  const password = requireText(formData.get("password"));
  const passwordConfirm = requireText(formData.get("passwordConfirm"));
  const nickname = requireText(formData.get("nickname"));
  const rawCountry = requireText(formData.get("country"));
  const parsedCountry = rawCountry ? parseCountry(rawCountry) : null;
  const disciplinesRaw = requireText(formData.get("disciplines"));
  const disciplineValues = formData.getAll("disciplines");
  const store = await readStore();
  const allowedDisciplineSlugs = store.disciplines.map((discipline) => discipline.slug);
  const existingUserByEmail =
    store.users.find((entry) => entry.email.toLowerCase() === email) ?? null;

  if (!email || !password || !nickname) {
    redirect(withMessage(returnTo, "error", "Заполните обязательные поля регистрации."));
  }

  if (rawCountry && !parsedCountry) {
    redirect(withMessage(returnTo, "error", "Выберите страну из списка."));
  }

  const country = parsedCountry ?? "UZ";
  const role: UserRole = resolveRegistrationRole(store);

  if (password.length < 6) {
    redirect(withMessage(returnTo, "error", "Пароль должен быть не короче 6 символов."));
  }

  if (!passwordConfirm || password !== passwordConfirm) {
    redirect(withMessage(returnTo, "error", "Пароли не совпадают."));
  }

  if (nickname.length < 3 || nickname.length > 24) {
    redirect(withMessage(returnTo, "error", "Никнейм должен быть длиной от 3 до 24 символов."));
  }

  const disciplinesFromValues = normalizeDisciplineValues(disciplineValues, allowedDisciplineSlugs);
  const disciplinesFromText = disciplinesRaw
    ? normalizeDisciplines(disciplinesRaw, allowedDisciplineSlugs)
    : [];
  const disciplines =
    disciplinesFromValues.length > 0 ? disciplinesFromValues : disciplinesFromText;

  if ((disciplineValues.length > 0 || disciplinesRaw) && disciplines.length === 0) {
    redirect(
      withMessage(
        returnTo,
        "error",
        "Выберите игры только из доступного списка.",
      ),
    );
  }

  if (
    store.users.some(
      (entry) =>
        entry.nickname.toLowerCase() === nickname.toLowerCase() &&
        entry.email.toLowerCase() !== email,
    )
  ) {
    redirect(withMessage(returnTo, "error", "Никнейм уже занят."));
  }

  if (isSupabaseConfigured()) {
    try {
      const existingAuthUser = await findSupabaseAuthUserByEmail(email);
      const hasLegacyPassword =
        Boolean(existingUserByEmail?.passwordHash) && existingUserByEmail!.passwordHash.length > 0;
      const canUpgradeLegacyProfile =
        Boolean(existingUserByEmail) &&
        !existingUserByEmail!.authUserId &&
        !existingAuthUser &&
        hasLegacyPassword &&
        verifyPassword(password, existingUserByEmail!.passwordHash);

      if (existingUserByEmail || existingAuthUser) {
        if (canUpgradeLegacyProfile) {
          const supabaseAdmin = createSupabaseServiceClient();
          const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
          });

          if (error || !data.user) {
            redirect(withMessage(returnTo, "error", mapSupabaseRegistrationError(error?.message)));
          }

          await updateStore((draft) => {
            const profile = draft.users.find((entry) => entry.id === existingUserByEmail!.id);
            if (profile) {
              profile.authUserId = data.user.id;
              profile.passwordHash = "";
            }
          });

          const signInResult = await signInSupabaseUser(email, password);

          if (!signInResult.user) {
            redirect(withMessage("/login", "error", "Аккаунт обновлён, но войти сразу не удалось."));
          }

          touchPaths();
          redirect(withMessage("/profile", "success", "Аккаунт обновлён. Вы вошли в систему."));
        }

        const signInResult = await signInSupabaseUser(email, password);

        if (!signInResult.user) {
          redirect(
            withMessage(
              returnTo,
              "error",
              "Пользователь с таким email уже существует. Введите пароль от этого аккаунта или войдите через страницу входа.",
            ),
          );
        }

        if (existingUserByEmail && !existingUserByEmail.authUserId) {
          await updateStore((draft) => {
            const profile = draft.users.find((entry) => entry.id === existingUserByEmail.id);
            if (profile) {
              profile.authUserId = signInResult.user.id;
              profile.passwordHash = "";
            }
          });
        }

        if (!existingUserByEmail && existingAuthUser) {
          await updateStore((draft) => {
            draft.users.push({
              id: makeId("user"),
              authUserId: signInResult.user.id,
              email,
              passwordHash: "",
              nickname,
              country,
              role,
              disciplines,
              teamId: null,
              tournamentHistory: [],
              createdAt: new Date().toISOString(),
            });
          });
        }

        touchPaths();
        redirect(withMessage("/profile", "success", "Аккаунт уже существовал. Вы вошли в систему."));
      }

      const supabaseAdmin = createSupabaseServiceClient();
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error || !data.user) {
        redirect(withMessage(returnTo, "error", mapSupabaseRegistrationError(error?.message)));
      }
      const authUserId = data.user.id;

      await updateStore((draft) => {
        const nextUser = {
          id: makeId("user"),
          authUserId,
          email,
          passwordHash: "",
          nickname,
          country,
          role,
          disciplines,
          teamId: null,
          tournamentHistory: [],
          createdAt: new Date().toISOString(),
        };

        draft.users.push(nextUser);
        return nextUser;
      });

      const signInResult = await signInSupabaseUser(email, password);

      if (!signInResult.user) {
        redirect(withMessage("/login", "error", "Аккаунт создан, но войти сразу не удалось."));
      }

      touchPaths();
      redirect(
        withMessage(
          "/profile",
          "success",
          role === "organizer"
            ? "Аккаунт создан. Вы получили доступ организатора."
            : "Аккаунт создан.",
        ),
      );
    } catch (error) {
      unstable_rethrow(error);
      const message = error instanceof Error ? error.message : undefined;
      redirect(withMessage(returnTo, "error", mapRegistrationPersistenceError(message)));
    }
  }

  if (existingUserByEmail) {
    if (verifyPassword(password, existingUserByEmail.passwordHash)) {
      await setSession(existingUserByEmail.id);
      touchPaths();
      redirect(withMessage("/profile", "success", "Аккаунт уже существовал. Вы вошли в систему."));
    }

    redirect(
      withMessage(
        returnTo,
        "error",
        "Пользователь с таким email уже существует. Введите пароль от этого аккаунта или войдите через страницу входа.",
      ),
    );
  }

  const user = await updateStore((store) => {
    const existing = store.users.find((entry) => entry.email === email);
    if (existing) {
      return null;
    }

    const nextUser = {
      id: makeId("user"),
      email,
      passwordHash: hashPassword(password),
      nickname,
      country,
      role,
      disciplines,
      teamId: null,
      tournamentHistory: [],
      createdAt: new Date().toISOString(),
    };

    store.users.push(nextUser);
    return nextUser;
  });

  if (!user) {
    redirect(withMessage(returnTo, "error", "Пользователь с таким email уже существует."));
  }

  await setSession(user.id);
  touchPaths();
  redirect(withMessage("/profile", "success", "Аккаунт создан."));
}

export async function logoutAction() {
  await clearSession();
  redirect(withMessage("/", "success", "Вы вышли из аккаунта."));
}

export async function updateProfileDisciplinesAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/profile");
  const user = await requireAuthOrRedirect();
  const store = await readStore();
  const allowedDisciplineSlugs = store.disciplines.map((discipline) => discipline.slug);
  const selectedValues = formData.getAll("disciplines");
  const selectedCandidates = selectedValues.filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  const disciplines = normalizeDisciplineValues(selectedValues, allowedDisciplineSlugs);

  if (disciplines.length === 0) {
    redirect(withMessage(returnTo, "error", "Выберите хотя бы одну игру."));
  }

  if (selectedCandidates.length !== disciplines.length) {
    redirect(withMessage(returnTo, "error", "Выберите игры только из доступного списка."));
  }

  const updated = await updateStore((draft) => {
    const profile = draft.users.find((entry) => entry.id === user.id);

    if (!profile) {
      return false;
    }

    profile.disciplines = disciplines;
    return true;
  });

  if (!updated) {
    redirect(withMessage(returnTo, "error", "Не удалось обновить игры профиля."));
  }

  touchPaths();
  redirect(withMessage(returnTo, "success", "Игры профиля обновлены."));
}

export async function createTeamAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/teams");
  const user = await requireAuthOrRedirect();
  const name = requireText(formData.get("name"));
  const logo = requireText(formData.get("logo"));
  const country = parseCountry(requireText(formData.get("country")));

  if (!name || !country) {
    redirect(withMessage(returnTo, "error", "Укажите название команды и страну."));
  }

  if (user.teamId) {
    redirect(withMessage(returnTo, "error", "Вы уже состоите в команде."));
  }

  const team = await updateStore((store) => {
    const currentUser = store.users.find((entry) => entry.id === user.id);
    if (!currentUser || currentUser.teamId) {
      return null;
    }

    const existsByName = store.teams.some(
      (entry) => entry.name.toLowerCase() === name.toLowerCase(),
    );

    if (existsByName) {
      return null;
    }

    const nextTeam = {
      id: `team_${slugify(name)}_${makeId("id").slice(-4)}`,
      name,
      logo: logo || name.slice(0, 2).toUpperCase(),
      country,
      captainId: currentUser.id,
      memberIds: [currentUser.id],
      rating: 1500,
      wins: 0,
      losses: 0,
      createdAt: new Date().toISOString(),
    };

    currentUser.teamId = nextTeam.id;
    currentUser.role = currentUser.role === "organizer" ? "organizer" : "captain";
    store.teams.push(nextTeam);
    return nextTeam;
  });

  if (!team) {
    redirect(withMessage(returnTo, "error", "Не удалось создать команду (название занято?)."));
  }

  touchPaths();
  redirect(withMessage(`/teams/${team.id}`, "success", "Команда создана."));
}

export async function joinTeamAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/teams");
  const teamId = requireText(formData.get("teamId"));
  const user = await requireAuthOrRedirect();

  if (!teamId) {
    redirect(withMessage(returnTo, "error", "Команда не выбрана."));
  }

  if (user.teamId) {
    redirect(withMessage(returnTo, "error", "Сначала выйдите из текущей команды."));
  }

  const joinedTeam = await updateStore((store) => {
    const currentUser = store.users.find((entry) => entry.id === user.id);
    const team = store.teams.find((entry) => entry.id === teamId);

    if (!currentUser || !team || currentUser.teamId) {
      return null;
    }

    if (!team.memberIds.includes(currentUser.id)) {
      team.memberIds.push(currentUser.id);
    }

    currentUser.teamId = team.id;
    currentUser.role = currentUser.role === "organizer" ? "organizer" : "player";
    return team;
  });

  if (!joinedTeam) {
    redirect(withMessage(returnTo, "error", "Не удалось вступить в команду."));
  }

  touchPaths();
  redirect(withMessage(`/teams/${joinedTeam.id}`, "success", "Вы вступили в команду."));
}

export async function leaveTeamAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/teams");
  const user = await requireAuthOrRedirect();

  if (!user.teamId) {
    redirect(withMessage(returnTo, "error", "Вы не состоите в команде."));
  }

  const result = await updateStore((store) => {
    const currentUser = store.users.find((entry) => entry.id === user.id);
    if (!currentUser || !currentUser.teamId) {
      return { ok: false, message: "Команда не найдена." };
    }

    const team = store.teams.find((entry) => entry.id === currentUser.teamId);
    if (!team) {
      currentUser.teamId = null;
      currentUser.role = currentUser.role === "organizer" ? "organizer" : "player";
      return { ok: true, message: "Вы вышли из команды." };
    }

    if (team.captainId === currentUser.id && team.memberIds.length > 1) {
      return {
        ok: false,
        message: "Нельзя покинуть команду, пока в составе есть другие участники.",
      };
    }

    team.memberIds = team.memberIds.filter((memberId) => memberId !== currentUser.id);
    currentUser.teamId = null;
    currentUser.role = currentUser.role === "organizer" ? "organizer" : "player";

    if (team.memberIds.length === 0) {
      store.teams = store.teams.filter((entry) => entry.id !== team.id);
    }

    store.tournaments.forEach((tournament) => {
      tournament.appliedTeamIds = tournament.appliedTeamIds.filter(
        (entry) => entry !== team.id,
      );
      tournament.approvedTeamIds = tournament.approvedTeamIds.filter(
        (entry) => entry !== team.id,
      );
    });

    return { ok: true, message: "Вы вышли из команды." };
  });

  if (!result.ok) {
    redirect(withMessage(returnTo, "error", result.message));
  }

  touchPaths();
  redirect(withMessage(returnTo, "success", result.message));
}

export async function removeTeamMemberAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/teams");
  const teamId = requireText(formData.get("teamId"));
  const memberId = requireText(formData.get("memberId"));
  const user = await requireAuthOrRedirect();

  const result = await updateStore((store) => {
    const team = getTeamById(store, teamId);
    if (!team) {
      return { ok: false, message: "Команда не найдена." };
    }

    if (team.captainId !== user.id) {
      return { ok: false, message: "Удалять из состава может только управляющий аккаунт команды." };
    }

    if (memberId === user.id) {
      return { ok: false, message: "Нельзя удалить из состава собственный аккаунт." };
    }

    if (!team.memberIds.includes(memberId)) {
      return { ok: false, message: "Этот аккаунт не состоит в выбранной команде." };
    }

    team.memberIds = team.memberIds.filter((entry) => entry !== memberId);

    const member = store.users.find((entry) => entry.id === memberId);
    if (member) {
      member.teamId = null;
      member.role = member.role === "organizer" ? "organizer" : "player";
    }

    return { ok: true, message: "Аккаунт удалён из состава." };
  });

  if (!result.ok) {
    redirect(withMessage(returnTo, "error", result.message));
  }

  touchPaths();
  redirect(withMessage(returnTo, "success", result.message));
}

export async function registerTeamToTournamentAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/tournaments");
  const tournamentId = requireText(formData.get("tournamentId"));
  const teamId = requireText(formData.get("teamId"));
  const user = await requireAuthOrRedirect();

  const result = await updateStore((store) => {
    const tournament = getTournamentById(store, tournamentId);
    const team = getTeamById(store, teamId);

    if (!tournament || !team) {
      return { ok: false, message: "Турнир или команда не найдены." };
    }

    if (!canUserRegisterTeam(user, team)) {
      return { ok: false, message: "Подать заявку можно только с управляющего аккаунта команды." };
    }

    if (tournament.status !== "registration_open") {
      return { ok: false, message: "Регистрация в этот турнир закрыта." };
    }

    if (
      tournament.appliedTeamIds.includes(team.id) ||
      tournament.approvedTeamIds.includes(team.id)
    ) {
      return { ok: false, message: "Команда уже подала заявку." };
    }

    const registeredCount =
      tournament.appliedTeamIds.length + tournament.approvedTeamIds.length;

    if (registeredCount >= tournament.teamLimit) {
      return { ok: false, message: "Лимит команд уже достигнут." };
    }

    tournament.appliedTeamIds.push(team.id);
    return { ok: true, message: "Заявка отправлена на подтверждение." };
  });

  if (!result.ok) {
    redirect(withMessage(returnTo, "error", result.message));
  }

  touchTournamentPaths(tournamentId);
  redirect(withMessage(returnTo, "success", result.message));
}

export async function createTournamentAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/admin");
  const user = await requireAuthOrRedirect();
  const input = readTournamentMutationInput(formData);

  const result = await updateStore((store) => {
    const validation = validateTournamentMutationInput(store, input);
    if (!validation.ok) {
      return validation;
    }

    const id = `${slugify(validation.data.title).slice(0, 28)}_${makeId("tour").slice(-5)}`;

    store.tournaments.push({
      id,
      title: validation.data.title,
      disciplineSlug: validation.data.disciplineSlug,
      startsAt: validation.data.startsAt,
      prizePoolUSD: validation.data.prizePoolUSD,
      format: validation.data.format,
      teamLimit: validation.data.teamLimit,
      status: "registration_open",
      rules: validation.data.rules,
      appliedTeamIds: [],
      approvedTeamIds: [],
      bracket: [],
      creatorUserId: user.id,
      chatMessages: [],
      createdAt: new Date().toISOString(),
    });

    return { ok: true, message: "Турнир создан." };
  });

  if (!result.ok) {
    redirect(withMessage(returnTo, "error", result.message));
  }

  touchPaths();
  redirect(withMessage(returnTo, "success", result.message));
}

export async function updateTournamentAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/admin");
  const user = await requireAuthOrRedirect();
  const tournamentId = requireText(formData.get("tournamentId"));
  const input = readTournamentMutationInput(formData);

  if (!tournamentId) {
    redirect(withMessage(returnTo, "error", "Турнир не найден."));
  }

  const result = await updateStore((store) => {
    const tournament = getTournamentById(store, tournamentId);

    if (!tournament) {
      return { ok: false, message: "Турнир не найден." };
    }

    if (!canManageTournament(user, tournament)) {
      return { ok: false, message: "У вас нет доступа к управлению этим турниром." };
    }

    const validation = validateTournamentMutationInput(store, input, {
      existingTournament: tournament,
    });
    if (!validation.ok) {
      return validation;
    }

    tournament.title = validation.data.title;
    tournament.disciplineSlug = validation.data.disciplineSlug;
    tournament.startsAt = validation.data.startsAt;
    tournament.prizePoolUSD = validation.data.prizePoolUSD;
    tournament.format = validation.data.format;
    tournament.teamLimit = validation.data.teamLimit;
    tournament.rules = validation.data.rules;

    return { ok: true, message: "Турнир обновлён." };
  });

  if (!result.ok) {
    redirect(withMessage(returnTo, "error", result.message));
  }

  touchTournamentPaths(tournamentId);
  redirect(withMessage(returnTo, "success", result.message));
}

export async function claimTournamentAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/tournaments");
  const user = await requireAuthOrRedirect();
  const tournamentId = requireText(formData.get("tournamentId"));

  if (!tournamentId) {
    redirect(withMessage(returnTo, "error", "Турнир не найден."));
  }

  const result = await updateStore((store) => {
    const tournament = getTournamentById(store, tournamentId);

    if (!tournament) {
      return { ok: false, message: "Турнир не найден." };
    }

    if (tournament.creatorUserId) {
      if (canManageTournament(user, tournament)) {
        return { ok: true, message: "Этот турнир уже привязан к вашему аккаунту." };
      }

      return { ok: false, message: "У этого турнира уже указан создатель." };
    }

    tournament.creatorUserId = user.id;
    return { ok: true, message: "Турнир привязан к вашему аккаунту." };
  });

  if (!result.ok) {
    redirect(withMessage(returnTo, "error", result.message));
  }

  touchTournamentPaths(tournamentId);
  redirect(withMessage(returnTo, "success", result.message));
}

export async function reviewTeamRegistrationAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/admin");
  const user = await requireAuthOrRedirect();

  const tournamentId = requireText(formData.get("tournamentId"));
  const teamId = requireText(formData.get("teamId"));
  const decision = requireText(formData.get("decision"));

  const result = await updateStore((store) => {
    const tournament = getTournamentById(store, tournamentId);

    if (!tournament) {
      return { ok: false, message: "Турнир не найден." };
    }

    if (!canManageTournament(user, tournament)) {
      return { ok: false, message: "У вас нет доступа к управлению этим турниром." };
    }

    const hasApplication = tournament.appliedTeamIds.includes(teamId);
    if (!hasApplication) {
      return { ok: false, message: "Заявка не найдена." };
    }

    tournament.appliedTeamIds = tournament.appliedTeamIds.filter(
      (entry) => entry !== teamId,
    );

    if (decision === "approve") {
      if (tournament.approvedTeamIds.length >= tournament.teamLimit) {
        return { ok: false, message: "Лимит участников уже достигнут." };
      }

      tournament.approvedTeamIds.push(teamId);
      return { ok: true, message: "Команда подтверждена." };
    }

    return { ok: true, message: "Заявка отклонена." };
  });

  if (!result.ok) {
    redirect(withMessage(returnTo, "error", result.message));
  }

  touchTournamentPaths(tournamentId);
  redirect(withMessage(returnTo, "success", result.message));
}

export async function generateBracketAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/admin");
  const user = await requireAuthOrRedirect();

  const tournamentId = requireText(formData.get("tournamentId"));

  const result = await updateStore((store) => {
    const tournament = getTournamentById(store, tournamentId);

    if (!tournament) {
      return { ok: false, message: "Турнир не найден." };
    }

    if (!canManageTournament(user, tournament)) {
      return { ok: false, message: "У вас нет доступа к управлению этим турниром." };
    }

    if (tournament.approvedTeamIds.length < 2) {
      return {
        ok: false,
        message: "Для генерации сетки нужно минимум 2 подтвержденные команды.",
      };
    }

    tournament.bracket = buildSingleEliminationBracket(tournament.approvedTeamIds);
    tournament.status = "ongoing";

    return { ok: true, message: "Сетка успешно сгенерирована." };
  });

  if (!result.ok) {
    redirect(withMessage(returnTo, "error", result.message));
  }

  touchTournamentPaths(tournamentId);
  redirect(withMessage(returnTo, "success", result.message));
}

export async function deleteTournamentAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/admin");
  const successTo = normalizeReturnTo(formData.get("successTo"), "/admin");
  const user = await requireAuthOrRedirect();
  const tournamentId = requireText(formData.get("tournamentId"));

  if (!tournamentId) {
    redirect(withMessage(returnTo, "error", "Турнир не найден."));
  }

  const result = await updateStore((store) => {
    const tournament = getTournamentById(store, tournamentId);

    if (!tournament) {
      return { ok: false, message: "Турнир не найден." };
    }

    if (!canManageTournament(user, tournament)) {
      return { ok: false, message: "У вас нет доступа к управлению этим турниром." };
    }

    store.tournaments = store.tournaments.filter((entry) => entry.id !== tournament.id);
    store.users.forEach((entry) => {
      entry.tournamentHistory = entry.tournamentHistory.filter((item) => item !== tournament.id);
    });

    return { ok: true, message: "Турнир удалён." };
  });

  if (!result.ok) {
    redirect(withMessage(returnTo, "error", result.message));
  }

  touchPaths();
  redirect(withMessage(successTo, "success", result.message));
}

export async function saveMatchResultAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/admin");
  const user = await requireAuthOrRedirect();

  const tournamentId = requireText(formData.get("tournamentId"));
  const roundId = requireText(formData.get("roundId"));
  const matchId = requireText(formData.get("matchId"));
  const scoreA = Number(requireText(formData.get("scoreA")));
  const scoreB = Number(requireText(formData.get("scoreB")));

  if (!Number.isFinite(scoreA) || !Number.isFinite(scoreB)) {
    redirect(withMessage(returnTo, "error", "Введите корректный счет."));
  }

  if (scoreA === scoreB) {
    redirect(withMessage(returnTo, "error", "Ничья не поддерживается."));
  }

  const result = await updateStore((store) => {
    const tournament = getTournamentById(store, tournamentId);

    if (!tournament) {
      return { ok: false, message: "Турнир не найден." };
    }

    if (!canManageTournament(user, tournament)) {
      return { ok: false, message: "У вас нет доступа к управлению этим турниром." };
    }

    const round = tournament.bracket.find((entry) => entry.id === roundId);
    if (!round) {
      return { ok: false, message: "Раунд не найден." };
    }

    const match = round.matches.find((entry) => entry.id === matchId);
    if (!match) {
      return { ok: false, message: "Матч не найден." };
    }

    if (!match.teamAId || !match.teamBId) {
      return { ok: false, message: "Матч еще не укомплектован командами." };
    }

    if (match.status === "finished") {
      return { ok: false, message: "Результат для этого матча уже сохранен." };
    }

    const winnerTeamId = scoreA > scoreB ? match.teamAId : match.teamBId;
    const loserTeamId = scoreA > scoreB ? match.teamBId : match.teamAId;

    match.score = `${scoreA}:${scoreB}`;
    match.status = "finished";
    match.winnerTeamId = winnerTeamId;

    const winnerTeam = getTeamById(store, winnerTeamId);
    const loserTeam = getTeamById(store, loserTeamId);

    if (winnerTeam) {
      winnerTeam.wins += 1;
      winnerTeam.rating += 10;
    }

    if (loserTeam) {
      loserTeam.losses += 1;
      loserTeam.rating = Math.max(1000, loserTeam.rating - 8);
    }

    pushWinnerToNextRound(tournament.bracket, roundId, matchId, winnerTeamId);

    const finalRound = tournament.bracket[tournament.bracket.length - 1];
    const finalMatch = finalRound?.matches[0];

    if (finalMatch && finalMatch.status === "finished") {
      tournament.status = "completed";

      tournament.approvedTeamIds.forEach((teamId) => {
        const team = getTeamById(store, teamId);
        if (!team) {
          return;
        }

        team.memberIds.forEach((memberId) => {
          const member = store.users.find((entry) => entry.id === memberId);
          if (!member) {
            return;
          }

          if (!member.tournamentHistory.includes(tournament.id)) {
            member.tournamentHistory.push(tournament.id);
          }
        });
      });

      return { ok: true, message: "Результат сохранен. Турнир завершен." };
    }

    tournament.status = "ongoing";
    return { ok: true, message: "Результат матча сохранен." };
  });

  if (!result.ok) {
    redirect(withMessage(returnTo, "error", result.message));
  }

  touchTournamentPaths(tournamentId);
  redirect(withMessage(returnTo, "success", result.message));
}

export async function sendTournamentChatMessageAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/tournaments");
  const user = await requireAuthOrRedirect();
  const tournamentId = requireText(formData.get("tournamentId"));
  const body = requireText(formData.get("body"));

  if (!tournamentId || !body) {
    redirect(withMessage(returnTo, "error", "Введите сообщение."));
  }

  if (body.length < 2 || body.length > MAX_TOURNAMENT_CHAT_MESSAGE_LENGTH) {
    redirect(
      withMessage(
        returnTo,
        "error",
        `Сообщение должно быть длиной от 2 до ${MAX_TOURNAMENT_CHAT_MESSAGE_LENGTH} символов.`,
      ),
    );
  }

  const result = await updateStore((store) => {
    const tournament = getTournamentById(store, tournamentId);

    if (!tournament) {
      return { ok: false, message: "Турнир не найден." };
    }

    tournament.chatMessages.push({
      id: makeId("msg"),
      authorUserId: user.id,
      body,
      createdAt: new Date().toISOString(),
    });

    return { ok: true, message: "Сообщение отправлено." };
  });

  if (!result.ok) {
    redirect(withMessage(returnTo, "error", result.message));
  }

  touchTournamentPaths(tournamentId);
  redirect(withMessage(returnTo, "success", result.message));
}

export async function resetDemoDataAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"), "/admin");
  await requireOrganizerOrRedirect(returnTo);

  await resetStore();
  touchPaths();
  redirect(withMessage(returnTo, "success", "Демо-данные сброшены."));
}
