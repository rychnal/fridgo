import { cookies } from "next/headers";
import { translations, type Locale } from "./translations";

export const DEFAULT_LOCALE: Locale = "cs";
export const LOCALE_COOKIE = "fridgo_locale";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return value === "en" || value === "cs" ? value : DEFAULT_LOCALE;
}

export function getT(locale: Locale): Translations {
  return translations[locale] as Translations;
}

export { type Locale, type Translations } from "./translations";
