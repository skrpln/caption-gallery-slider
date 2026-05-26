import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, isGallerySaveDirConfigured, normalizeGallerySaveDir } from "./settings";

describe("normalizeGallerySaveDir", () => {
  it("keeps the setting empty until the user chooses a folder", () => {
    expect(DEFAULT_SETTINGS.gallerySaveDir).toBe("");
    expect(normalizeGallerySaveDir("   ")).toBe("");
    expect(isGallerySaveDirConfigured("   ")).toBe(false);
  });

  it("normalizes slashes without changing folder names", () => {
    expect(normalizeGallerySaveDir("\\Captions//Gallery/")).toBe("Captions/Gallery");
    expect(isGallerySaveDirConfigured("\\Captions//Gallery/")).toBe(true);
  });
});
