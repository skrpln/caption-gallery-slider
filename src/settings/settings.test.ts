import { describe, expect, it } from "vitest";
import {
  CAPTION_FOLDER_SETTING,
  DEFAULT_SETTINGS,
  captionFolderSettingDefinition,
  isGallerySaveDirConfigured,
  normalizeGallerySaveDir,
} from "./settings";

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

describe("captionFolderSettingDefinition", () => {
  it("binds a folder control to the stored caption folder setting", () => {
    const definition = captionFolderSettingDefinition();
    if (!("control" in definition) || !definition.control) {
      throw new Error("Expected a control definition.");
    }

    expect(definition.name).toBe(CAPTION_FOLDER_SETTING.name);
    expect(definition.desc).toBe(CAPTION_FOLDER_SETTING.desc);
    expect(definition.control.type).toBe("folder");
    expect(definition.control.key).toBe("gallerySaveDir");
    expect(Object.keys(DEFAULT_SETTINGS)).toContain(definition.control.key);
  });
});
