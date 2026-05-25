// Documentation: [[documentation/architecture]]

export type MediaKind = "image" | "video";

export interface GalleryMediaFile {
  path: string;
  name: string;
  extension: string;
  stat: {
    ctime: number;
    mtime: number;
  };
}

export interface GalleryItem {
  kind: MediaKind;
  path: string;
  name: string;
  extension: string;
  createdAt: number;
  modifiedAt: number;
}

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "avi", "mov", "webm"]);

export function getMediaKind(extension: string): MediaKind | null {
  const normalized = extension.toLowerCase().replace(/^\./, "");

  if (IMAGE_EXTENSIONS.has(normalized)) {
    return "image";
  }

  if (VIDEO_EXTENSIONS.has(normalized)) {
    return "video";
  }

  return null;
}

export function isPhaseOneMedia(extension: string): boolean {
  return getMediaKind(extension) === "image";
}
