import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { locales } from "@/i18n/locales";
import { getCanonicalOrigin, languageAlternates } from "@/lib/seo";

afterEach(() => vi.unstubAllEnvs());

describe("international SEO", () => {
  it("uses the configured production origin and never a random preview URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://seren.example/path");
    expect(getCanonicalOrigin()).toBe("https://seren.example");
    expect(languageAlternates()["x-default"]).toBe("https://seren.example/en");
  });

  it("includes all locale routes and alternates in the sitemap", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://seren.example");
    const entries = sitemap();
    expect(entries).toHaveLength(locales.length);
    expect(entries.map((entry) => entry.url)).toEqual(locales.map((locale) => `https://seren.example/${locale}`));
    expect(entries[0].alternates?.languages).toHaveProperty("ar", "https://seren.example/ar");
  });

  it("disallows indexing outside production", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(robots().rules).toEqual({ userAgent: "*", disallow: "/" });
  });

  it("allows indexing and emits sitemap in production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://seren.example");
    expect(robots()).toMatchObject({ rules: { userAgent: "*", allow: "/" }, sitemap: "https://seren.example/sitemap.xml" });
  });
});
