import { describe, expect, it } from "vitest";
import { experienceContent } from "@/i18n/experienceContent";
import { locales } from "@/i18n/locales";
import { siteContent } from "@/i18n/siteContent";

describe("experience localization", () => {
  it("provides complete Oracle and product labels for all eight locales", () => {
    expect(Object.keys(experienceContent)).toEqual([...locales]);
    for (const locale of locales) {
      const content = experienceContent[locale];
      expect(content.oracle.messages).toHaveLength(10);
      expect(content.oracle.symbols).toHaveLength(5);
      expect(content.oracle.disclaimer.length).toBeGreaterThan(20);
      expect(content.securityWarning.length).toBeGreaterThan(10);
      expect(siteContent[locale].trust).toHaveLength(6);
      expect(Object.values(content.pool).every((value) => value.length > 0)).toBe(true);
    }
  });

  it("does not expose the interface examples as live content", () => {
    expect(JSON.stringify(experienceContent)).not.toContain("12 480 POL");
    expect(JSON.stringify(experienceContent)).not.toContain("987 520 POL");
  });
});
