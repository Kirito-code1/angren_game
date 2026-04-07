import type { CountryCode, Discipline, TournamentStatus } from "@/lib/types";

export const countryLabels: Record<CountryCode, string> = {
  UZ: "Узбекистан",
  KZ: "Казахстан",
  KG: "Кыргызстан",
  TJ: "Таджикистан",
  TM: "Туркменистан",
};

export const tournamentStatusLabels: Record<TournamentStatus, string> = {
  registration_open: "Регистрация открыта",
  ongoing: "Турнир идет",
  completed: "Завершен",
};

export const disciplinesCatalog: Discipline[] = [
  {
    slug: "mobile-legends",
    title: "Mobile Legends: Bang Bang",
    shortTitle: "Mobile Legends",
    icon: "ML",
    description:
      "Командные 5v5-сражения на мобильной арене. Быстрый темп, драфты и координация.",
    formats: ["5v5", "BO1", "BO3"],
    featured: true,
  },
  {
    slug: "pubg-mobile",
    title: "PUBG Mobile",
    shortTitle: "PUBG Mobile",
    icon: "PM",
    description:
      "Тактический battle royale для squad-составов с акцентом на ротации и позиционку.",
    formats: ["squad", "duo", "solo"],
    featured: true,
  },
];
