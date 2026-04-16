import { makeId, slugify } from "@/lib/security";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateStore } from "@/lib/store";
import type { AppStore, CountryCode, User, UserRole } from "@/lib/types";

type SyncSupabaseProfileInput = {
  authUserId: string;
  email: string;
  nicknameHint?: string | null;
  country?: CountryCode;
  disciplines?: string[];
};

type SyncSupabaseProfileResult = {
  status: "existing" | "linked" | "created";
  user: User;
};

export function resolveRegistrationRole(store: AppStore): UserRole {
  return store.users.some(
    (entry) => entry.role === "organizer" && (!isSupabaseConfigured() || Boolean(entry.authUserId)),
  )
    ? "player"
    : "organizer";
}

function normalizeNicknameCandidate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = slugify(value).replace(/-/g, "_").slice(0, 24);
  return normalized.length >= 3 ? normalized : null;
}

function buildUniqueNickname(users: User[], hint?: string | null, email?: string | null) {
  const emailLocalPart = email?.split("@")[0] ?? null;
  const base =
    normalizeNicknameCandidate(hint) ??
    normalizeNicknameCandidate(emailLocalPart) ??
    `player_${makeId("id").slice(-4)}`;
  const existingNicknames = new Set(users.map((entry) => entry.nickname.toLowerCase()));

  if (!existingNicknames.has(base.toLowerCase())) {
    return base;
  }

  for (let counter = 2; counter < 1000; counter += 1) {
    const suffix = `_${counter}`;
    const candidate = `${base.slice(0, Math.max(3, 24 - suffix.length))}${suffix}`;

    if (!existingNicknames.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  return `player_${makeId("id").slice(-4)}`;
}

export async function syncSupabaseProfileFromAuthUser({
  authUserId,
  email,
  nicknameHint,
  country = "UZ",
  disciplines = [],
}: SyncSupabaseProfileInput): Promise<SyncSupabaseProfileResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("У аккаунта Google отсутствует email.");
  }

  return updateStore((store) => {
    const existingByAuthUserId =
      store.users.find((entry) => entry.authUserId === authUserId) ?? null;

    if (existingByAuthUserId) {
      return {
        status: "existing" as const,
        user: existingByAuthUserId,
      };
    }

    const existingByEmail =
      store.users.find((entry) => entry.email.toLowerCase() === normalizedEmail) ?? null;

    if (existingByEmail?.authUserId && existingByEmail.authUserId !== authUserId) {
      throw new Error("Профиль с этим email уже привязан к другому аккаунту.");
    }

    if (existingByEmail) {
      existingByEmail.authUserId = authUserId;
      existingByEmail.passwordHash = "";

      return {
        status: "linked" as const,
        user: existingByEmail,
      };
    }

    const nextUser = {
      id: makeId("user"),
      authUserId,
      email: normalizedEmail,
      passwordHash: "",
      nickname: buildUniqueNickname(store.users, nicknameHint, normalizedEmail),
      country,
      role: resolveRegistrationRole(store),
      disciplines,
      teamId: null,
      tournamentHistory: [],
      createdAt: new Date().toISOString(),
    };

    store.users.push(nextUser);

    return {
      status: "created" as const,
      user: nextUser,
    };
  });
}
