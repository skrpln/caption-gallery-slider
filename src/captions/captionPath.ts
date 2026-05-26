// Documentation: [[documentation/phase-2-captions]]

import type { GalleryItem } from "../media/mediaTypes";
import { normalizeGallerySaveDir } from "../settings/settings";

export interface CaptionPathInput {
  gallerySaveDir: string;
  galleryId: string;
  item: Pick<GalleryItem, "kind" | "path">;
}

export function buildCaptionPath(input: CaptionPathInput): string {
  const root = normalizeGallerySaveDir(input.gallerySaveDir);
  if (!root) {
    throw new Error("Caption folder is not configured.");
  }

  const gallerySegment = sanitizePathSegment(input.galleryId);
  const targetType = input.item.kind === "video" ? "vid" : "img";
  const hash = createShortHash(input.item.path);

  return `${root}/${gallerySegment}/${targetType}-${hash}.md`;
}

export function createShortHash(value: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36).padStart(7, "0").slice(0, 7);
}

function sanitizePathSegment(value: string): string {
  return value
    .trim()
    .replace(/[\\/]+/g, "-")
    .replace(/[:*?"<>|]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "gallery";
}
