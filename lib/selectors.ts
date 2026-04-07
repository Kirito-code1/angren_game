import type { AppStore, Team, Tournament, User } from "@/lib/types";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function safeEncode(value: string) {
  try {
    return encodeURIComponent(value);
  } catch {
    return value;
  }
}

function getRouteVariants(value: string) {
  const decoded = safeDecode(value).normalize("NFC");
  const encoded = safeEncode(value);

  return new Set([value, value.normalize("NFC"), decoded, safeEncode(decoded), encoded]);
}

export function getUserById(store: AppStore, userId: string) {
  return store.users.find((user) => user.id === userId || user.authUserId === userId) ?? null;
}

export function getTeamById(store: AppStore, teamId: string) {
  return store.teams.find((team) => team.id === teamId) ?? null;
}

export function getTournamentById(store: AppStore, tournamentId: string) {
  const requestedIds = getRouteVariants(tournamentId);

  return (
    store.tournaments.find((tournament) => {
      const tournamentIds = getRouteVariants(tournament.id);

      for (const candidate of requestedIds) {
        if (tournamentIds.has(candidate)) {
          return true;
        }
      }

      return false;
    }) ?? null
  );
}

export function getDisciplineBySlug(store: AppStore, slug: string) {
  return store.disciplines.find((discipline) => discipline.slug === slug) ?? null;
}

export function getTeamMembers(store: AppStore, team: Team) {
  return team.memberIds
    .map((memberId) => getUserById(store, memberId))
    .filter((member): member is User => member !== null);
}

export function getTeamCaptain(store: AppStore, team: Team) {
  return getUserById(store, team.captainId);
}

export function getTopTeams(store: AppStore, limit = 3) {
  return [...store.teams].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

export function getTournamentsByStatus(store: AppStore, status: Tournament["status"]) {
  return store.tournaments.filter((tournament) => tournament.status === status);
}

export function getTournamentsByDiscipline(store: AppStore, disciplineSlug: string) {
  return store.tournaments.filter(
    (tournament) => tournament.disciplineSlug === disciplineSlug,
  );
}

export function isCaptainOfTeam(user: User, team: Team) {
  return user.id === team.captainId;
}

export function matchesUserIdentifier(user: User, candidateId: string | null | undefined) {
  if (!candidateId) {
    return false;
  }

  return user.id === candidateId || user.authUserId === candidateId;
}

export function canManageTournament(user: User, tournament: Tournament) {
  return user.role === "organizer" || matchesUserIdentifier(user, tournament.creatorUserId);
}
