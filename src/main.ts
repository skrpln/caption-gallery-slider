// Documentation: [[documentation/architecture]]

import { Plugin } from "obsidian";
import { createObsidianVaultAdapter, getObsidianResourcePath } from "./media/obsidianVaultAdapter";
import { resolveGalleryMedia } from "./media/mediaResolver";
import { parseGalleryBlock } from "./parser/galleryBlockParser";
import { GalleryRenderer } from "./render/GalleryRenderer";
import { DEFAULT_SETTINGS, type ObsidianGallerySettings } from "./settings/settings";

const HOVER_SOURCE_ID = "obsidian-gallery-caption";

export default class ObsidianGalleryPlugin extends Plugin {
  settings: ObsidianGallerySettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.registerCaptionHoverSource();

    this.registerMarkdownCodeBlockProcessor("gallery", (source, el, ctx) => {
      const parseResult = parseGalleryBlock(source);
      if (!parseResult.ok) {
        renderInlineMessage(el, parseResult.errors);
        return;
      }

      const vault = createObsidianVaultAdapter(this.app.vault);
      const mediaResult = resolveGalleryMedia(parseResult.config, vault);
      if (!mediaResult.ok) {
        renderInlineMessage(el, mediaResult.errors);
        return;
      }

      el.empty();
      const renderer = new GalleryRenderer(el, {
        config: parseResult.config,
        items: mediaResult.items,
        getResourcePath: (path) => getObsidianResourcePath(this.app.vault, path),
      });

      ctx.addChild(renderer);
    });
  }

  async loadSettings(): Promise<void> {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(await this.loadData()),
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private registerCaptionHoverSource(): void {
    const pluginWithHoverSource = this as Plugin & {
      registerHoverLinkSource?: (
        source: string,
        info: { display: string; defaultMod: boolean },
      ) => void;
    };

    pluginWithHoverSource.registerHoverLinkSource?.(HOVER_SOURCE_ID, {
      display: "Obsidian Gallery Caption",
      defaultMod: true,
    });
  }
}

function renderInlineMessage(containerEl: HTMLElement, messages: string[]): void {
  containerEl.empty();

  const root = document.createElement("div");
  root.className = "og-gallery";

  const messageEl = document.createElement("div");
  messageEl.className = "og-gallery__message";
  messageEl.textContent = messages.join(" ");

  root.appendChild(messageEl);
  containerEl.appendChild(root);
}
