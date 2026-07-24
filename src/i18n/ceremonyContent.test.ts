import { describe, expect, it } from "vitest";
import { ceremonyContent } from "@/i18n/ceremonyContent";
import { locales } from "@/i18n/locales";

describe("ceremony localization", () => {
  it("contains complete state, lifecycle and proof content for every locale", () => {
    for (const locale of locales) {
      const content = ceremonyContent[locale];
      expect(Object.keys(content.core.status)).toHaveLength(10);
      expect(Object.keys(content.core.message)).toHaveLength(10);
      expect(content.lifecycle.stages).toHaveLength(5);
      expect(content.proof.stages).toHaveLength(8);
      expect(content.security.seedWarning.length).toBeGreaterThan(10);
      expect(content.security.transferWarning.length).toBeGreaterThan(10);
    }
  });

  it("uses the required Russian ceremony copy", () => {
    expect(ceremonyContent.ru.core.status.finalized).toContain("финализирован");
    expect(ceremonyContent.ru.proof.intro).toContain("проверить самостоятельно");
    expect(ceremonyContent.ru.security.seedWarning).toContain("seed-фразу");
  });
});
