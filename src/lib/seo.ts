import { locales, type Locale } from "@/i18n/locales";

const FALLBACK_ORIGIN = "https://serenlotterychain.com";

export function isProductionSeo() {
  return process.env.VERCEL_ENV === "production";
}
export function getCanonicalOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return FALLBACK_ORIGIN;
  try {
    const url = new URL(configured);
    return url.origin;
  } catch {
    return FALLBACK_ORIGIN;
  }
}

export function localeUrl(locale: Locale) {
  return `${getCanonicalOrigin()}/${locale}`;
}

export function languageAlternates() {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, localeUrl(locale)])),
    "x-default": localeUrl("en"),
  };
}
