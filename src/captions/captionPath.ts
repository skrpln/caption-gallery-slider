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

/**
 * Resolves `path` against folders that already exist, matching every segment
 * case-insensitively. Obsidian's file index compares paths exactly, while the
 * file systems on macOS and Windows do not, so a gallery renamed from `малыш`
 * to `Малыш` must keep using the caption folder created under the old name
 * instead of failing on a folder that "already exists".
 *
 * `listChildren` returns the child names of an existing folder ("" is the
 * vault root) or `null` when nothing is there. Segments below the first
 * missing folder keep the requested spelling.
 */
export function resolveExistingPath(
  path: string,
  listChildren: (folderPath: string) => readonly string[] | null,
): string {
  const resolved: string[] = [];
  let folderPath: string | null = "";

  for (const segment of path.split("/").filter(Boolean)) {
    const children: readonly string[] | null = folderPath === null ? null : listChildren(folderPath);
    const match: string | null = children ? matchPathSegment(children, segment) : null;
    resolved.push(match ?? segment);
    folderPath = match === null || folderPath === null
      ? null
      : (folderPath ? `${folderPath}/${match}` : match);
  }

  return resolved.join("/");
}

/** Finds the child name equal to `segment`, preferring an exact match. */
export function matchPathSegment(children: readonly string[], segment: string): string | null {
  if (children.includes(segment)) {
    return segment;
  }

  const wanted = comparablePathSegment(segment);
  return children.find((child) => comparablePathSegment(child) === wanted) ?? null;
}

function comparablePathSegment(value: string): string {
  return value.normalize("NFC").toLowerCase();
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
