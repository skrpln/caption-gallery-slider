// Documentation: [[documentation/phase-2-captions]], [[documentation/phase-4-video]]

import { App, TFile, TFolder, type Vault } from "obsidian";
import type { GalleryItem } from "../media/mediaTypes";
import type { GalleryConfig } from "../parser/galleryBlockParser";
import { buildCaptionPath } from "./captionPath";
import {
  createCaptionMarkdown,
  DEFAULT_VIDEO_PLAYBACK,
  normalizeRotation,
  readFrontmatterNumber,
  readVideoPlayback,
  splitCaptionMarkdown,
  type CaptionVideoPlayback,
  upsertFrontmatterNumber,
  upsertVideoPlayback,
} from "./captionMarkdown";

export type CaptionState =
  | {
      status: "unconfigured";
      path: null;
      body: "";
      exists: false;
      rotation: 0;
      playback: CaptionVideoPlayback;
    }
  | {
      status: "missing";
      path: string;
      body: "";
      exists: false;
      rotation: 0;
      playback: CaptionVideoPlayback;
    }
  | {
      status: "ready";
      path: string;
      body: string;
      exists: true;
      rotation: number;
      playback: CaptionVideoPlayback;
    };

export class ObsidianCaptionService {
  constructor(
    private readonly app: App,
    private readonly getGallerySaveDir: () => string,
  ) {}

  async readCaption(config: GalleryConfig, item: GalleryItem): Promise<CaptionState> {
    const path = this.getCaptionPath(config, item);
    if (!path) {
      return unconfiguredCaption();
    }

    const file = this.app.vault.getFileByPath(path);
    if (!file) {
      return {
        status: "missing",
        path,
        body: "",
        exists: false,
        rotation: 0,
        playback: DEFAULT_VIDEO_PLAYBACK,
      };
    }

    const markdown = await this.app.vault.cachedRead(file);
    const { frontmatter, body } = splitCaptionMarkdown(markdown);

    return {
      status: "ready",
      path,
      body,
      exists: true,
      rotation: normalizeRotation(readFrontmatterNumber(frontmatter, "rotation", 0)),
      playback: readVideoPlayback(frontmatter),
    };
  }

  async saveCaption(config: GalleryConfig, item: GalleryItem, body: string): Promise<CaptionState> {
    const path = this.getCaptionPath(config, item);
    if (!path) {
      return unconfiguredCaption();
    }

    await ensureFolderPath(this.app.vault, parentPath(path));

    let file = this.app.vault.getFileByPath(path);
    let rotation = 0;
    let playback = DEFAULT_VIDEO_PLAYBACK;
    if (!file) {
      try {
        await this.app.vault.create(path, createCaptionMarkdown({
          galleryId: config.galleryId,
          target: item.kind === "video" ? "vid" : "img",
          sourcePath: item.path,
          body,
          rotation: 0,
          playback: item.kind === "video" ? DEFAULT_VIDEO_PLAYBACK : undefined,
        }));
      } catch {
        file = this.app.vault.getFileByPath(path);
        if (!file) {
          throw new Error(`Cannot create caption note: ${path}`);
        }
      }
    }

    if (file) {
      const markdown = await this.app.vault.read(file);
      const { frontmatter } = splitCaptionMarkdown(markdown);
      rotation = normalizeRotation(readFrontmatterNumber(frontmatter, "rotation", 0));
      playback = readVideoPlayback(frontmatter);
      const nextMarkdown = frontmatter === null
        ? body
        : `---\n${frontmatter}\n---\n${body}`;
      await this.app.vault.modify(file, nextMarkdown);
    }

    return {
      status: "ready",
      path,
      body,
      exists: true,
      rotation,
      playback,
    };
  }

  async rotateCaption(config: GalleryConfig, item: GalleryItem, rotation: number): Promise<CaptionState> {
    const path = this.getCaptionPath(config, item);
    if (!path) {
      return unconfiguredCaption();
    }

    const normalizedRotation = normalizeRotation(rotation);
    await ensureFolderPath(this.app.vault, parentPath(path));

    let file = this.app.vault.getFileByPath(path);
    if (!file) {
      await this.app.vault.create(path, createCaptionMarkdown({
        galleryId: config.galleryId,
        target: item.kind === "video" ? "vid" : "img",
        sourcePath: item.path,
        body: "",
        rotation: normalizedRotation,
        playback: item.kind === "video" ? DEFAULT_VIDEO_PLAYBACK : undefined,
      }));
      file = this.app.vault.getFileByPath(path);
    }

    let body = "";
    let playback = DEFAULT_VIDEO_PLAYBACK;
    if (file) {
      const markdown = await this.app.vault.read(file);
      const parts = splitCaptionMarkdown(markdown);
      body = parts.body;
      const { frontmatter } = parts;
      playback = readVideoPlayback(frontmatter);
      const nextFrontmatter = upsertFrontmatterNumber(frontmatter, "rotation", normalizedRotation);
      await this.app.vault.modify(file, `---\n${nextFrontmatter}\n---\n${body}`);
    }

    return {
      status: "ready",
      path,
      body,
      exists: true,
      rotation: normalizedRotation,
      playback,
    };
  }

  async saveVideoPlayback(
    config: GalleryConfig,
    item: GalleryItem,
    playback: CaptionVideoPlayback,
  ): Promise<CaptionState> {
    const path = this.getCaptionPath(config, item);
    if (!path) {
      return unconfiguredCaption();
    }

    await ensureFolderPath(this.app.vault, parentPath(path));

    let file = this.app.vault.getFileByPath(path);
    if (!file) {
      await this.app.vault.create(path, createCaptionMarkdown({
        galleryId: config.galleryId,
        target: item.kind === "video" ? "vid" : "img",
        sourcePath: item.path,
        body: "",
        rotation: 0,
        playback,
      }));
      file = this.app.vault.getFileByPath(path);
    }

    let body = "";
    let rotation = 0;
    if (file) {
      const markdown = await this.app.vault.read(file);
      const parts = splitCaptionMarkdown(markdown);
      body = parts.body;
      rotation = normalizeRotation(readFrontmatterNumber(parts.frontmatter, "rotation", 0));
      const nextFrontmatter = upsertVideoPlayback(parts.frontmatter, playback);
      await this.app.vault.modify(file, `---\n${nextFrontmatter}\n---\n${body}`);
    }

    return {
      status: "ready",
      path,
      body,
      exists: true,
      rotation,
      playback,
    };
  }

  async openCaption(config: GalleryConfig, item: GalleryItem): Promise<void> {
    const path = this.getCaptionPath(config, item);
    if (!path) {
      return;
    }

    let file = this.app.vault.getFileByPath(path);
    if (!file) {
      await this.saveCaption(config, item, "");
      file = this.app.vault.getFileByPath(path);
    }

    if (file instanceof TFile) {
      await this.app.workspace.getLeaf(false).openFile(file, { active: true });
    }
  }

  private getCaptionPath(config: GalleryConfig, item: GalleryItem): string | null {
    const gallerySaveDir = this.getGallerySaveDir();
    if (!gallerySaveDir) {
      return null;
    }

    return buildCaptionPath({
      gallerySaveDir,
      galleryId: config.galleryId,
      item,
    });
  }
}

export async function ensureFolderPath(vault: Vault, path: string): Promise<void> {
  const normalized = path.replace(/^\/+|\/+$/g, "");
  if (!normalized) {
    return;
  }

  const segments = normalized.split("/").filter(Boolean);
  let current = "";

  for (const segment of segments) {
    current = current ? `${current}/${segment}` : segment;
    const existing = vault.getAbstractFileByPath(current);

    if (existing instanceof TFolder) {
      continue;
    }

    if (existing) {
      throw new Error(`Caption folder path conflicts with a file: ${current}`);
    }

    await vault.createFolder(current);
  }
}

function parentPath(path: string): string {
  return path.split("/").slice(0, -1).join("/");
}

function unconfiguredCaption(): CaptionState {
  return {
    status: "unconfigured",
    path: null,
    body: "",
    exists: false,
    rotation: 0,
    playback: DEFAULT_VIDEO_PLAYBACK,
  };
}
