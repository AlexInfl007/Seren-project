import type { MetadataRoute } from "next";
import { locales } from "@/i18n/locales";
import { getCanonicalOrigin, languageAlternates } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getCanonicalOrigin();
  const languages = languageAlternates();
  return locales.map((locale) => ({
    url: `${base}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: locale === "en" ? 1 : 0.9,
    alternates: { languages },
  }));
}
