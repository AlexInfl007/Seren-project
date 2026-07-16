import { beforeEach, describe, expect, it } from "vitest";
import { detectInitialLanguage } from "@/i18n/translations";

describe("initial site language", () => {
  beforeEach(() => window.localStorage.clear());

  it("opens in English before the user selects a language", () => {
    Object.defineProperty(window.navigator, "languages", {
      configurable: true,
      value: ["ru-RU", "ru"],
    });

    expect(detectInitialLanguage()).toBe("en");
  });

  it("restores a language explicitly selected by the user", () => {
    window.localStorage.setItem("seren.lang", "fr");
    expect(detectInitialLanguage()).toBe("fr");
  });

  it("falls back to English for an invalid saved value", () => {
    window.localStorage.setItem("seren.lang", "unknown");
    expect(detectInitialLanguage()).toBe("en");
  });
});
