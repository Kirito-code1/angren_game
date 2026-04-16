import { cookies } from "next/headers";
import {
  LOCALE_COOKIE_NAME,
  THEME_COOKIE_NAME,
  supportedLocales,
  supportedThemes,
  type Locale,
  type Theme,
} from "@/lib/ui-preferences";

export async function getTheme(): Promise<Theme> {
  const cookieStore = await cookies();
  const theme = cookieStore.get(THEME_COOKIE_NAME)?.value;

  return supportedThemes.includes(theme as Theme) ? (theme as Theme) : "light";
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  return supportedLocales.includes(locale as Locale) ? (locale as Locale) : "ru";
}

export async function getUiPreferences() {
  const [theme, locale] = await Promise.all([getTheme(), getLocale()]);

  return {
    theme,
    locale,
  };
}
