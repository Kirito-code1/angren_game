import { disciplinesCatalog } from "@/lib/catalog";
import type { AppStore, Discipline } from "@/lib/types";

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

function resolveDisciplines(disciplines: Discipline[]) {
  if (disciplines.length > 0) {
    return disciplines;
  }

  return disciplinesCatalog;
}

export function getDisplayStore(store: AppStore): AppStore {
  return {
    disciplines: resolveDisciplines(store.disciplines),
    users: store.users,
    teams: store.teams,
    tournaments: store.tournaments,
  };
}
