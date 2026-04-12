import { disciplinesCatalog } from "@/lib/catalog";
import type { AppStore, BracketRound, Discipline, Team, Tournament, User } from "@/lib/types";

const promoUsers: User[] = [
  {
    id: "promo-user-clutchmaster",
    email: "clutchmaster@example.com",
    passwordHash: "",
    nickname: "ClutchMaster",
    country: "UZ",
    role: "captain",
    disciplines: ["pubg-mobile", "mobile-legends"],
    teamId: "promo-team-angren-elite",
    tournamentHistory: [
      "promo-pubg-weekly-cup",
      "promo-mlbb-challenger-series",
      "promo-mlbb-community-cup",
    ],
    createdAt: "2026-03-01T09:00:00+05:00",
  },
  {
    id: "promo-user-dawnbreaker",
    email: "dawnbreaker@example.com",
    passwordHash: "",
    nickname: "DawnBreaker",
    country: "KZ",
    role: "captain",
    disciplines: ["mobile-legends"],
    teamId: "promo-team-dawnbreakers",
    tournamentHistory: ["promo-mlbb-challenger-series", "promo-mlbb-community-cup"],
    createdAt: "2026-03-03T10:00:00+05:00",
  },
  {
    id: "promo-user-deva",
    email: "deva@example.com",
    passwordHash: "",
    nickname: "DevaStyle",
    country: "KG",
    role: "captain",
    disciplines: ["pubg-mobile"],
    teamId: "promo-team-deva-squad",
    tournamentHistory: ["promo-pubg-weekly-cup", "promo-pubg-solo-showdown"],
    createdAt: "2026-03-04T11:00:00+05:00",
  },
  {
    id: "promo-user-riftborn",
    email: "riftborn@example.com",
    passwordHash: "",
    nickname: "Riftborn",
    country: "TJ",
    role: "captain",
    disciplines: ["mobile-legends"],
    teamId: "promo-team-riftborn",
    tournamentHistory: ["promo-mlbb-challenger-series"],
    createdAt: "2026-03-05T12:00:00+05:00",
  },
  {
    id: "promo-user-operator",
    email: "operator@example.com",
    passwordHash: "",
    nickname: "ZoneAdmin",
    country: "UZ",
    role: "organizer",
    disciplines: ["pubg-mobile", "mobile-legends"],
    teamId: null,
    tournamentHistory: [],
    createdAt: "2026-02-20T08:00:00+05:00",
  },
  {
    id: "promo-user-scout",
    email: "scout@example.com",
    passwordHash: "",
    nickname: "Scout77",
    country: "TM",
    role: "player",
    disciplines: ["pubg-mobile"],
    teamId: "promo-team-angren-elite",
    tournamentHistory: ["promo-pubg-weekly-cup"],
    createdAt: "2026-03-07T13:00:00+05:00",
  },
  {
    id: "promo-user-nimbus",
    email: "nimbus@example.com",
    passwordHash: "",
    nickname: "Nimbus",
    country: "KZ",
    role: "player",
    disciplines: ["mobile-legends"],
    teamId: "promo-team-dawnbreakers",
    tournamentHistory: ["promo-mlbb-challenger-series"],
    createdAt: "2026-03-09T15:00:00+05:00",
  },
];

const promoTeams: Team[] = [
  {
    id: "promo-team-angren-elite",
    name: "Angren Elite",
    logo: "AE",
    country: "UZ",
    captainId: "promo-user-clutchmaster",
    memberIds: ["promo-user-clutchmaster", "promo-user-scout"],
    rating: 1250,
    wins: 24,
    losses: 7,
    createdAt: "2026-03-02T10:00:00+05:00",
  },
  {
    id: "promo-team-dawnbreakers",
    name: "DawnBreakers",
    logo: "DB",
    country: "KZ",
    captainId: "promo-user-dawnbreaker",
    memberIds: ["promo-user-dawnbreaker", "promo-user-nimbus"],
    rating: 1178,
    wins: 18,
    losses: 6,
    createdAt: "2026-03-04T10:00:00+05:00",
  },
  {
    id: "promo-team-deva-squad",
    name: "DevaSquad",
    logo: "DS",
    country: "KG",
    captainId: "promo-user-deva",
    memberIds: ["promo-user-deva"],
    rating: 1098,
    wins: 15,
    losses: 8,
    createdAt: "2026-03-06T10:00:00+05:00",
  },
  {
    id: "promo-team-riftborn",
    name: "Riftborn",
    logo: "RF",
    country: "TJ",
    captainId: "promo-user-riftborn",
    memberIds: ["promo-user-riftborn"],
    rating: 1016,
    wins: 12,
    losses: 9,
    createdAt: "2026-03-07T10:00:00+05:00",
  },
];

const promoBracket: BracketRound[] = [
  {
    id: "promo-round-quarterfinals",
    title: "Quarter Finals",
    matches: [
      {
        id: "promo-match-1",
        teamAId: "promo-team-angren-elite",
        teamBId: "promo-team-riftborn",
        score: "2 : 0",
        status: "finished",
        winnerTeamId: "promo-team-angren-elite",
      },
      {
        id: "promo-match-2",
        teamAId: "promo-team-deva-squad",
        teamBId: "promo-team-dawnbreakers",
        score: "1 : 2",
        status: "finished",
        winnerTeamId: "promo-team-dawnbreakers",
      },
    ],
  },
  {
    id: "promo-round-semifinals",
    title: "Semi Finals",
    matches: [
      {
        id: "promo-match-3",
        teamAId: "promo-team-angren-elite",
        teamBId: "promo-team-dawnbreakers",
        score: "1 : 0",
        status: "scheduled",
        winnerTeamId: null,
      },
    ],
  },
  {
    id: "promo-round-finals",
    title: "Grand Final",
    matches: [
      {
        id: "promo-match-4",
        teamAId: null,
        teamBId: null,
        score: "TBD",
        status: "scheduled",
        winnerTeamId: null,
      },
    ],
  },
];

const promoTournaments: Tournament[] = [
  {
    id: "promo-pubg-weekly-cup",
    title: "PUBG Weekly Cup",
    disciplineSlug: "pubg-mobile",
    startsAt: "2026-04-19T20:00:00+05:00",
    prizePoolUSD: 1000,
    format: "Squad",
    teamLimit: 16,
    status: "ongoing",
    rules: [
      "Check-in за 30 минут до старта.",
      "Все игроки должны быть в подтвержденном составе.",
      "Сетка играется до двух побед.",
    ],
    appliedTeamIds: [],
    approvedTeamIds: [
      "promo-team-angren-elite",
      "promo-team-dawnbreakers",
      "promo-team-deva-squad",
      "promo-team-riftborn",
    ],
    bracket: promoBracket,
    creatorUserId: "promo-user-operator",
    chatMessages: [
      {
        id: "promo-message-1",
        authorUserId: "promo-user-operator",
        body: "Лобби открывается за 20 минут. Проверьте готовность составов заранее.",
        createdAt: "2026-04-18T18:00:00+05:00",
      },
      {
        id: "promo-message-2",
        authorUserId: "promo-user-clutchmaster",
        body: "Подтверждаем участие. Состав на месте.",
        createdAt: "2026-04-18T18:20:00+05:00",
      },
    ],
    createdAt: "2026-04-01T10:00:00+05:00",
  },
  {
    id: "promo-mlbb-challenger-series",
    title: "MLBB Challenger Series",
    disciplineSlug: "mobile-legends",
    startsAt: "2026-04-24T19:30:00+05:00",
    prizePoolUSD: 2400,
    format: "BO3",
    teamLimit: 16,
    status: "registration_open",
    rules: [
      "Драфт обязателен на всех стадиях турнира.",
      "Один запасной игрок разрешен.",
      "Спорные ситуации решает организатор матча.",
    ],
    appliedTeamIds: ["promo-team-riftborn"],
    approvedTeamIds: ["promo-team-dawnbreakers"],
    bracket: [],
    creatorUserId: "promo-user-operator",
    chatMessages: [],
    createdAt: "2026-04-02T10:00:00+05:00",
  },
  {
    id: "promo-pubg-solo-showdown",
    title: "PUBG Solo Showdown",
    disciplineSlug: "pubg-mobile",
    startsAt: "2026-04-27T18:00:00+05:00",
    prizePoolUSD: 800,
    format: "Solo",
    teamLimit: 24,
    status: "registration_open",
    rules: [
      "Один аккаунт на участника.",
      "Переподключение допускается только по согласованию с админом лобби.",
    ],
    appliedTeamIds: ["promo-team-deva-squad"],
    approvedTeamIds: ["promo-team-angren-elite"],
    bracket: [],
    creatorUserId: "promo-user-operator",
    chatMessages: [],
    createdAt: "2026-04-03T10:00:00+05:00",
  },
  {
    id: "promo-mlbb-community-cup",
    title: "MLBB Community Cup",
    disciplineSlug: "mobile-legends",
    startsAt: "2026-03-20T19:00:00+05:00",
    prizePoolUSD: 1200,
    format: "BO1",
    teamLimit: 8,
    status: "completed",
    rules: [
      "Матчи играются в формате BO1 до финала.",
      "Финал проводится в формате BO3.",
    ],
    appliedTeamIds: [],
    approvedTeamIds: ["promo-team-dawnbreakers", "promo-team-riftborn"],
    bracket: [],
    creatorUserId: "promo-user-operator",
    chatMessages: [],
    createdAt: "2026-03-01T10:00:00+05:00",
  },
];

export const promoCurrentUserId = "promo-user-clutchmaster";

export const promoRecentActivity = [
  { title: "PUBG Weekly Cup", date: "19 Apr, 2026", status: "Match lobby opened" },
  { title: "MLBB Challenger Series", date: "24 Apr, 2026", status: "Registration approved" },
  { title: "Solo Showdown", date: "27 Apr, 2026", status: "Roster submitted" },
];

export const promoNews = [
  {
    title: "New Tournament Rules",
    date: "Apr 12, 2026",
    tag: "Update",
  },
  {
    title: "Weekly Cup schedule confirmed",
    date: "Apr 14, 2026",
    tag: "News",
  },
];

export const disciplineDesigns: Record<
  string,
  {
    art: string;
    label: string;
    accentClass: string;
    badgeClass: string;
  }
> = {
  "pubg-mobile": {
    art: "/game_img/pubg.webp",
    label: "PUBG",
    accentClass: "clutch-accent--gold",
    badgeClass: "landing-chip--gold",
  },
  "mobile-legends": {
    art: "/game_img/Mobile_Legends_Bang_Bang_ML.webp",
    label: "MLBB",
    accentClass: "clutch-accent--violet",
    badgeClass: "landing-chip--violet",
  },
};

export function isStoreInPromoMode(store: AppStore) {
  return store.users.length === 0 && store.teams.length === 0 && store.tournaments.length === 0;
}

export function getDisplayStore(store: AppStore): AppStore {
  if (!isStoreInPromoMode(store)) {
    return {
      disciplines: resolveDisciplines(store.disciplines),
      users: mergeById(store.users, promoUsers, 4),
      teams: mergeById(store.teams, promoTeams, 4),
      tournaments: mergeById(store.tournaments, promoTournaments, 4),
    };
  }

  return getPromoStore(store.disciplines);
}

export function getPromoStore(baseDisciplines: Discipline[] = []): AppStore {
  return {
    disciplines: resolveDisciplines(baseDisciplines),
    users: promoUsers,
    teams: promoTeams,
    tournaments: promoTournaments,
  };
}

function resolveDisciplines(disciplines: Discipline[]) {
  if (disciplines.length > 0) {
    return disciplines;
  }

  return disciplinesCatalog;
}

function mergeById<T extends { id: string }>(primary: T[], fallback: T[], minimum: number) {
  if (primary.length >= minimum) {
    return primary;
  }

  const existingIds = new Set(primary.map((item) => item.id));

  return [
    ...primary,
    ...fallback.filter((item) => !existingIds.has(item.id)),
  ];
}
