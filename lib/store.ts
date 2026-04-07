import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildDefaultStore } from "@/lib/default-store";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type {
  AppStore,
  BracketRound,
  Discipline,
  Team,
  Tournament,
  TournamentChatMessage,
  User,
} from "@/lib/types";

type DisciplineRow = {
  slug: string;
  title: string;
  short_title: string;
  icon: string;
  description: string;
  formats: string[] | null;
  featured: boolean | null;
};

type ProfileRow = {
  id: string;
  auth_user_id: string | null;
  email: string;
  password_hash: string | null;
  nickname: string;
  country: User["country"];
  role: User["role"];
  disciplines: string[] | null;
  team_id: string | null;
  tournament_history: string[] | null;
  created_at: string;
};

type TeamRow = {
  id: string;
  name: string;
  logo: string;
  country: Team["country"];
  captain_id: string;
  member_ids: string[] | null;
  rating: number;
  wins: number;
  losses: number;
  created_at: string;
};

type TournamentRow = {
  id: string;
  title: string;
  discipline_slug: string;
  starts_at: string;
  prize_pool_usd: number;
  format: string;
  team_limit: number;
  status: Tournament["status"];
  rules: string[] | null;
  applied_team_ids: string[] | null;
  approved_team_ids: string[] | null;
  bracket:
    | Tournament["bracket"]
    | {
        rounds?: BracketRound[] | null;
        messages?: TournamentChatMessage[] | null;
        creatorUserId?: string | null;
      }
    | null;
  created_at: string;
};

const storePath = path.join(process.cwd(), "data", "store.json");
let writeQueue = Promise.resolve();

function mapDisciplineRow(row: DisciplineRow): Discipline {
  return {
    slug: row.slug,
    title: row.title,
    shortTitle: row.short_title,
    icon: row.icon,
    description: row.description,
    formats: row.formats ?? [],
    featured: Boolean(row.featured),
  };
}

function mapUserRow(row: ProfileRow): User {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    email: row.email,
    passwordHash: row.password_hash ?? "",
    nickname: row.nickname,
    country: row.country,
    role: row.role,
    disciplines: row.disciplines ?? [],
    teamId: row.team_id,
    tournamentHistory: row.tournament_history ?? [],
    createdAt: row.created_at,
  };
}

function mapTeamRow(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    logo: row.logo,
    country: row.country,
    captainId: row.captain_id,
    memberIds: row.member_ids ?? [],
    rating: row.rating,
    wins: row.wins,
    losses: row.losses,
    createdAt: row.created_at,
  };
}

function mapTournamentRow(row: TournamentRow): Tournament {
  const bracketPayload = row.bracket;
  const isLegacyRounds = Array.isArray(bracketPayload);
  const normalizedRounds = isLegacyRounds
    ? bracketPayload
    : Array.isArray(bracketPayload?.rounds)
      ? bracketPayload.rounds
      : [];
  const normalizedMessages =
    !isLegacyRounds && Array.isArray(bracketPayload?.messages) ? bracketPayload.messages : [];
  const creatorUserId =
    !isLegacyRounds && typeof bracketPayload?.creatorUserId === "string"
      ? bracketPayload.creatorUserId
      : null;

  return {
    id: row.id,
    title: row.title,
    disciplineSlug: row.discipline_slug,
    startsAt: row.starts_at,
    prizePoolUSD: row.prize_pool_usd,
    format: row.format,
    teamLimit: row.team_limit,
    status: row.status,
    rules: row.rules ?? [],
    appliedTeamIds: row.applied_team_ids ?? [],
    approvedTeamIds: row.approved_team_ids ?? [],
    bracket: normalizedRounds,
    creatorUserId,
    chatMessages: normalizedMessages,
    createdAt: row.created_at,
  };
}

function mapDisciplineToRow(discipline: Discipline): DisciplineRow {
  return {
    slug: discipline.slug,
    title: discipline.title,
    short_title: discipline.shortTitle,
    icon: discipline.icon,
    description: discipline.description,
    formats: discipline.formats,
    featured: discipline.featured,
  };
}

function mapUserToRow(user: User): ProfileRow {
  return {
    id: user.id,
    auth_user_id: user.authUserId ?? null,
    email: user.email,
    password_hash: user.passwordHash,
    nickname: user.nickname,
    country: user.country,
    role: user.role,
    disciplines: user.disciplines,
    team_id: user.teamId,
    tournament_history: user.tournamentHistory,
    created_at: user.createdAt,
  };
}

function mapTeamToRow(team: Team): TeamRow {
  return {
    id: team.id,
    name: team.name,
    logo: team.logo,
    country: team.country,
    captain_id: team.captainId,
    member_ids: team.memberIds,
    rating: team.rating,
    wins: team.wins,
    losses: team.losses,
    created_at: team.createdAt,
  };
}

function mapTournamentToRow(tournament: Tournament): TournamentRow {
  return {
    id: tournament.id,
    title: tournament.title,
    discipline_slug: tournament.disciplineSlug,
    starts_at: tournament.startsAt,
    prize_pool_usd: tournament.prizePoolUSD,
    format: tournament.format,
    team_limit: tournament.teamLimit,
    status: tournament.status,
    rules: tournament.rules,
    applied_team_ids: tournament.appliedTeamIds,
    approved_team_ids: tournament.approvedTeamIds,
    bracket: {
      rounds: tournament.bracket,
      messages: tournament.chatMessages,
      creatorUserId: tournament.creatorUserId,
    },
    created_at: tournament.createdAt,
  };
}

async function ensureStoreFile() {
  const dir = path.dirname(storePath);
  await mkdir(dir, { recursive: true });

  try {
    await access(storePath);
  } catch {
    const initial = buildDefaultStore();
    await writeFile(storePath, JSON.stringify(initial, null, 2), "utf-8");
  }
}

async function persistLocalStore(store: AppStore) {
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf-8");
}

async function readLocalStore() {
  await ensureStoreFile();
  const raw = await readFile(storePath, "utf-8");
  return JSON.parse(raw) as AppStore;
}

async function syncSupabaseTable(
  table: string,
  idColumn: string,
  rows: Record<string, unknown>[],
) {
  const supabase = createSupabaseServiceClient();
  const { data: existingRows, error: selectError } = await supabase.from(table).select(idColumn);

  if (selectError) {
    throw new Error(`Failed to read ${table}: ${selectError.message}`);
  }

  if (rows.length > 0) {
    const { error: upsertError } = await supabase.from(table).upsert(rows, {
      onConflict: idColumn,
    });

    if (upsertError) {
      throw new Error(`Failed to upsert ${table}: ${upsertError.message}`);
    }
  }

  const nextIds = new Set(rows.map((row) => String(row[idColumn])));
  const normalizedExistingRows = ((existingRows ?? []) as unknown[]) as Record<string, unknown>[];
  const idsToDelete = normalizedExistingRows
    .map((row) => String(row[idColumn]))
    .filter((id) => !nextIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase.from(table).delete().in(idColumn, idsToDelete);

    if (deleteError) {
      throw new Error(`Failed to delete stale rows from ${table}: ${deleteError.message}`);
    }
  }
}

async function persistSupabaseStore(store: AppStore) {
  await syncSupabaseTable(
    "disciplines",
    "slug",
    store.disciplines.map((discipline) => mapDisciplineToRow(discipline)),
  );
  await syncSupabaseTable("profiles", "id", store.users.map((user) => mapUserToRow(user)));
  await syncSupabaseTable("teams", "id", store.teams.map((team) => mapTeamToRow(team)));
  await syncSupabaseTable(
    "tournaments",
    "id",
    store.tournaments.map((tournament) => mapTournamentToRow(tournament)),
  );
}

async function readSupabaseStore() {
  const supabase = createSupabaseServiceClient();
  const { data: disciplinesRows, error: disciplinesError } = await supabase
    .from("disciplines")
    .select("*");

  if (disciplinesError) {
    throw new Error(`Failed to read disciplines: ${disciplinesError.message}`);
  }

  if (!disciplinesRows || disciplinesRows.length === 0) {
    const initial = buildDefaultStore();
    await persistSupabaseStore(initial);
    return initial;
  }

  const [profilesResult, teamsResult, tournamentsResult] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("teams").select("*"),
    supabase.from("tournaments").select("*"),
  ]);

  if (profilesResult.error) {
    throw new Error(`Failed to read profiles: ${profilesResult.error.message}`);
  }

  if (teamsResult.error) {
    throw new Error(`Failed to read teams: ${teamsResult.error.message}`);
  }

  if (tournamentsResult.error) {
    throw new Error(`Failed to read tournaments: ${tournamentsResult.error.message}`);
  }

  return {
    disciplines: (disciplinesRows as DisciplineRow[]).map((row) => mapDisciplineRow(row)),
    users: ((profilesResult.data ?? []) as ProfileRow[]).map((row) => mapUserRow(row)),
    teams: ((teamsResult.data ?? []) as TeamRow[]).map((row) => mapTeamRow(row)),
    tournaments: ((tournamentsResult.data ?? []) as TournamentRow[]).map((row) =>
      mapTournamentRow(row),
    ),
  } satisfies AppStore;
}

export async function readStore() {
  if (isSupabaseConfigured()) {
    return readSupabaseStore();
  }

  return readLocalStore();
}

export async function updateStore<T>(
  updater: (store: AppStore) => T | Promise<T>,
): Promise<T> {
  let result: T | undefined;

  writeQueue = writeQueue.then(async () => {
    const store = await readStore();
    result = await updater(store);

    if (isSupabaseConfigured()) {
      await persistSupabaseStore(store);
      return;
    }

    await persistLocalStore(store);
  });

  await writeQueue;
  return result as T;
}

export async function resetStore() {
  const initial = buildDefaultStore();

  if (isSupabaseConfigured()) {
    await persistSupabaseStore(initial);
    return initial;
  }

  await ensureStoreFile();
  await persistLocalStore(initial);
  return initial;
}
