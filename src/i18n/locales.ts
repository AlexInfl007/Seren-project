export const locales = ["en", "ru", "es", "zh", "hi", "ar", "fr", "pt"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  es: "Español",
  zh: "中文",
  hi: "हिन्दी",
  ar: "العربية",
  fr: "Français",
  pt: "Português",
};

export const localeShortLabels: Record<Locale, string> = {
  en: "EN", ru: "RU", es: "ES", zh: "中文", hi: "HI", ar: "AR", fr: "FR", pt: "PT",
};

export const localeToDashboardLanguage = {
  en: "en",
  ru: "ru",
  es: "es",
  zh: "zh-CN",
  hi: "hi",
  ar: "ar",
  fr: "fr",
  pt: "pt",
} as const;

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localeDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
