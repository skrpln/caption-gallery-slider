// Documentation: [[documentation/architecture]]

import type { GalleryConfig, GallerySort } from "../parser/galleryBlockParser";
import type { GalleryItem, GalleryMediaFile } from "./mediaTypes";
import { isPhaseOneMedia } from "./mediaTypes";

export interface VaultFolderLike {
  type: "folder";
  path: string;
  name: string;
  children: VaultEntryLike[];
}

export interface VaultFileLike extends GalleryMediaFile {
  type: "file";
}

export type VaultEntryLike = VaultFolderLike | VaultFileLike;

export interface VaultLike {
  getEntryByPath(path: string): VaultEntryLike | null;
}

export interface MediaResolveSuccess {
  ok: true;
  items: GalleryItem[];
}

export interface MediaResolveFailure {
  ok: false;
  errors: string[];
}

export type MediaResolveResult = MediaResolveSuccess | MediaResolveFailure;

export function resolveGalleryMedia(config: GalleryConfig, vault: VaultLike): MediaResolveResult {
  const errors: string[] = [];
  const files = new Map<string, VaultFileLike>();

  if (config.dir) {
    const root = vault.getEntryByPath(config.dir);
    if (!root) {
      errors.push(`Directory not found: ${config.dir}`);
    } else if (root.type !== "folder") {
      errors.push(`Path is not a directory: ${config.dir}`);
    } else {
      for (const file of collectFilesRecursive(root)) {
        files.set(file.path, file);
      }
    }
  }

  for (const path of config.list) {
    const entry = vault.getEntryByPath(path);
    if (!entry) {
      errors.push(`File not found: ${path}`);
      continue;
    }

    if (entry.type !== "file") {
      errors.push(`Path is not a file: ${path}`);
      continue;
    }

    files.set(entry.path, entry);
  }

  const items = Array.from(files.values())
    .filter((file) => isPhaseOneMedia(file.extension))
    .map(toGalleryItem)
    .sort((left, right) => compareItems(left, right, config.sort));

  if (items.length === 0 && errors.length === 0) {
    errors.push("No supported image files found.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, items };
}

function collectFilesRecursive(folder: VaultFolderLike): VaultFileLike[] {
  const files: VaultFileLike[] = [];

  for (const child of folder.children) {
    if (child.type === "file") {
      files.push(child);
    } else {
      files.push(...collectFilesRecursive(child));
    }
  }

  return files;
}

function toGalleryItem(file: VaultFileLike): GalleryItem {
  return {
    kind: "image",
    path: file.path,
    name: file.name,
    extension: file.extension.toLowerCase(),
    createdAt: file.stat.ctime,
    modifiedAt: file.stat.mtime,
  };
}

function compareItems(left: GalleryItem, right: GalleryItem, sort: GallerySort): number {
  if (sort === "created") {
    return compareNumber(left.createdAt, right.createdAt) || comparePath(left.path, right.path);
  }

  if (sort === "modified") {
    return compareNumber(left.modifiedAt, right.modifiedAt) || comparePath(left.path, right.path);
  }

  return left.name.localeCompare(right.name) || comparePath(left.path, right.path);
}

function compareNumber(left: number, right: number): number {
  return left - right;
}

function comparePath(left: string, right: string): number {
  return left.localeCompare(right);
}
