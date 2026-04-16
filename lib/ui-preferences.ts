export const THEME_COOKIE_NAME = "clutch_theme";
export const LOCALE_COOKIE_NAME = "clutch_locale";

export const supportedThemes = ["light", "dark"] as const;
export const supportedLocales = ["ru", "en"] as const;

export type Theme = (typeof supportedThemes)[number];
export type Locale = (typeof supportedLocales)[number];
