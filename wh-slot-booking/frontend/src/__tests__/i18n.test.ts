import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { t, getLang, setLang, dict } from "../Helper/i18n";

describe("t() – translation function", () => {
  it("returns Polish text by default", () => {
    expect(t("username", "pl")).toBe("Użytkownik");
  });

  it("returns English text for 'en' lang", () => {
    expect(t("username", "en")).toBe("Username");
  });

  it("returns the key itself when key is missing from dict", () => {
    expect(t("nonexistent_key_xyz" as any, "pl")).toBe("nonexistent_key_xyz");
  });

  it("returns Polish for known keys - role", () => {
    expect(t("role", "pl")).toBe("Rola");
    expect(t("role", "en")).toBe("Role");
  });

  it("returns correct translation for status-related keys", () => {
    expect(t("status", "pl")).toBe("Status");
    expect(t("status", "en")).toBe("Status");
  });
});

describe("getLang / setLang", () => {
  const originalGetItem = localStorage.getItem.bind(localStorage);

  afterEach(() => {
    localStorage.removeItem("lang");
  });

  it("getLang returns 'pl' when nothing stored", () => {
    localStorage.removeItem("lang");
    expect(getLang()).toBe("pl");
  });

  it("setLang stores language and getLang reads it back", () => {
    setLang("en");
    expect(getLang()).toBe("en");
  });

  it("setLang stores 'pl' and getLang reads it back", () => {
    setLang("pl");
    expect(getLang()).toBe("pl");
  });

  it("getLang falls back to 'pl' for unknown stored value", () => {
    localStorage.setItem("lang", "de");
    expect(getLang()).toBe("pl");
  });
});

describe("dict structure", () => {
  it("every entry has both pl and en keys", () => {
    Object.entries(dict).forEach(([key, val]) => {
      expect(val.pl, `${key}.pl`).toBeTruthy();
      expect(val.en, `${key}.en`).toBeTruthy();
    });
  });
});
