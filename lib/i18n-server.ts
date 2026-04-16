import { getLocale } from "@/lib/preferences";
import { getDictionary } from "@/lib/i18n";

export async function getI18n() {
  const locale = await getLocale();

  return {
    locale,
    dict: getDictionary(locale),
  };
}
