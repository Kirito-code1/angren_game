import {
  countryLabelsByLocale,
  tournamentStatusLabelsByLocale,
  userRoleLabelsByLocale,
} from "@/lib/i18n";
import type { CountryCode, TournamentStatus, UserRole } from "@/lib/types";
import type { Locale } from "@/lib/ui-preferences";

const dateTimeLocalFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Tashkent",
});

function getIntlLocale(locale: Locale) {
  return locale === "en" ? "en-US" : "ru-RU";
}

export function formatDate(isoDate: string, locale: Locale = "ru") {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  }).format(new Date(isoDate));
}

export function formatDateTimeLocalValue(isoDate: string) {
  const parts = dateTimeLocalFormatter.formatToParts(new Date(isoDate));
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function formatPrizePool(value: number, locale: Locale = "ru") {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCountry(code: CountryCode, locale: Locale = "ru") {
  return countryLabelsByLocale[locale][code] ?? code;
}

export function formatTournamentStatus(status: TournamentStatus, locale: Locale = "ru") {
  return tournamentStatusLabelsByLocale[locale][status] ?? status;
}

export function formatUserRole(role: UserRole, locale: Locale = "ru") {
  return userRoleLabelsByLocale[locale][role] ?? role;
}
