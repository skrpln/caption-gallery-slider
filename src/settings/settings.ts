// Documentation: [[documentation/phase-2-captions]]

import type { SettingDefinitionItem } from "obsidian";

export interface ObsidianGallerySettings {
  gallerySaveDir: string;
}

export const DEFAULT_GALLERY_SAVE_DIR = "gallery_captions";

export const DEFAULT_SETTINGS: ObsidianGallerySettings = {
  gallerySaveDir: "",
};

/** Texts shared by the declarative setting and the imperative fallback tab. */
export const CAPTION_FOLDER_SETTING = {
  name: "Caption folder",
  desc: "Vault folder where gallery caption notes are stored.",
  placeholder: `Example: ${DEFAULT_GALLERY_SAVE_DIR}`,
} as const;

/** Setting definition rendered and indexed for search by Obsidian 1.13 and newer. */
export function captionFolderSettingDefinition(): SettingDefinitionItem<keyof ObsidianGallerySettings> {
  return {
    name: CAPTION_FOLDER_SETTING.name,
    desc: CAPTION_FOLDER_SETTING.desc,
    control: {
      type: "folder",
      key: "gallerySaveDir",
      placeholder: CAPTION_FOLDER_SETTING.placeholder,
    },
  };
}

export function normalizeGallerySaveDir(value: string): string {
  return value
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/{2,}/g, "/");
}

export function isGallerySaveDirConfigured(value: string): boolean {
  return normalizeGallerySaveDir(value).length > 0;
}
