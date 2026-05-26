// Documentation: [[documentation/phase-2-captions]]

export interface ObsidianGallerySettings {
  gallerySaveDir: string;
}

export const DEFAULT_GALLERY_SAVE_DIR = "gallery_captions";

export const DEFAULT_SETTINGS: ObsidianGallerySettings = {
  gallerySaveDir: "",
};

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
