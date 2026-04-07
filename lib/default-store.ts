import { disciplinesCatalog } from "@/lib/catalog";
import type { AppStore } from "@/lib/types";

export function buildDefaultStore(): AppStore {
  return {
    disciplines: disciplinesCatalog,
    users: [],
    teams: [],
    tournaments: [],
  };
}
