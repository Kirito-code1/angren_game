import {
  countryLabels,
  tournamentStatusLabels,
} from "@/lib/catalog";
import type { CountryCode, TournamentStatus } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tashkent",
});

const dateTimeLocalFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Tashkent",
});

export function formatDate(isoDate: string) {
  return dateFormatter.format(new Date(isoDate));
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

export function formatPrizePool(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCountry(code: CountryCode) {
  return countryLabels[code] ?? code;
}

export function formatTournamentStatus(status: TournamentStatus) {
  return tournamentStatusLabels[status] ?? status;
}
