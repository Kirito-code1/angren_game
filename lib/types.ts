export type CountryCode = "UZ" | "KZ" | "KG" | "TJ" | "TM";

export type UserRole = "player" | "captain" | "organizer";

export type TournamentStatus =
  | "registration_open"
  | "ongoing"
  | "completed";

export type MatchStatus = "scheduled" | "finished";

export interface Discipline {
  slug: string;
  title: string;
  shortTitle: string;
  icon: string;
  description: string;
  formats: string[];
  featured: boolean;
}

export interface User {
  id: string;
  authUserId?: string | null;
  email: string;
  passwordHash: string;
  nickname: string;
  country: CountryCode;
  role: UserRole;
  disciplines: string[];
  teamId: string | null;
  tournamentHistory: string[];
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  country: CountryCode;
  captainId: string;
  memberIds: string[];
  rating: number;
  wins: number;
  losses: number;
  createdAt: string;
}

export interface BracketMatch {
  id: string;
  teamAId: string | null;
  teamBId: string | null;
  score: string;
  status: MatchStatus;
  winnerTeamId: string | null;
}

export interface BracketRound {
  id: string;
  title: string;
  matches: BracketMatch[];
}

export interface TournamentChatMessage {
  id: string;
  authorUserId: string;
  body: string;
  createdAt: string;
}

export interface Tournament {
  id: string;
  title: string;
  disciplineSlug: string;
  startsAt: string;
  prizePoolUSD: number;
  format: string;
  teamLimit: number;
  status: TournamentStatus;
  rules: string[];
  appliedTeamIds: string[];
  approvedTeamIds: string[];
  bracket: BracketRound[];
  creatorUserId: string | null;
  chatMessages: TournamentChatMessage[];
  createdAt: string;
}

export interface AppStore {
  users: User[];
  teams: Team[];
  tournaments: Tournament[];
  disciplines: Discipline[];
}
