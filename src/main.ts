// Documentation: [[documentation/architecture]], [[documentation/widget-size-controls]]

import { Notice, Plugin, TFile, type App, type Editor, type MarkdownPostProcessorContext, type MarkdownSectionInformation } from "obsidian";
import { createObsidianVaultAdapter, getObsidianResourcePath } from "./media/obsidianVaultAdapter";
import { resolveGalleryMedia } from "./media/mediaResolver";
import { parseGalleryBlock } from "./parser/galleryBlockParser";
import { updateGallerySizeOption, type GallerySizeOption } from "./parser/galleryBlockEditor";
import { GalleryRenderer } from "./render/GalleryRenderer";
import { renderCaptionMarkdown } from "./captions/captionMarkdownRenderer";
import { ObsidianCaptionService } from "./captions/obsidianCaptionService";
import { ObsidianGallerySettingTab } from "./settings/ObsidianGallerySettingTab";
import { DEFAULT_SETTINGS, type ObsidianGallerySettings } from "./settings/settings";

const HOVER_SOURCE_ID = "obsidian-gallery-caption";

export default class ObsidianGalleryPlugin extends Plugin {
  settings: ObsidianGallerySettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new ObsidianGallerySettingTab(this.app, this));
    this.registerCaptionHoverSource();
    const captionService = new ObsidianCaptionService(this.app, () => this.settings.gallerySaveDir);

    this.registerMarkdownCodeBlockProcessor("gallery", (source, el, ctx) => {
      let currentSource = source;
      const parseResult = parseGalleryBlock(currentSource);
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
        getCaption: (item) => captionService.readCaption(parseResult.config, item),
        saveCaption: (item, body) => captionService.saveCaption(parseResult.config, item, body),
        rotateCaption: (item, rotation) => captionService.rotateCaption(parseResult.config, item, rotation),
        saveVideoPlayback: (item, playback) => captionService.saveVideoPlayback(parseResult.config, item, playback),
        openCaption: (item) => captionService.openCaption(parseResult.config, item),
        saveSizeOption: async (option, value) => {
          try {
            currentSource = await updateGalleryBlockSizeOption(this.app, ctx, el, currentSource, option, value);
          } catch {
            new Notice("Obsidian Gallery: cannot update gallery size in the note.");
          }
        },
        renderCaptionMarkdown: (markdown, containerEl, sourcePath, component) =>
          renderCaptionMarkdown(this.app, markdown, containerEl, sourcePath, component, HOVER_SOURCE_ID),
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

async function updateGalleryBlockSizeOption(
  app: App,
  ctx: MarkdownPostProcessorContext,
  el: HTMLElement,
  source: string,
  option: GallerySizeOption,
  value: number,
): Promise<string> {
  const nextSource = updateGallerySizeOption(source, option, value);
  if (nextSource === source) {
    return source;
  }

  const sectionInfo = ctx.getSectionInfo(el);
  if (!sectionInfo) {
    throw new Error("Cannot locate gallery code block.");
  }

  const activeEditor = app.workspace.activeEditor;
  if (activeEditor?.file?.path === ctx.sourcePath && activeEditor.editor) {
    replaceEditorGallerySource(activeEditor.editor, sectionInfo, nextSource);
    return nextSource;
  }

  const file = app.vault.getAbstractFileByPath(ctx.sourcePath);
  if (!(file instanceof TFile)) {
    throw new Error("Cannot locate gallery source note.");
  }

  await app.vault.process(file, (content) => replaceVaultGallerySource(content, sectionInfo, nextSource));
  return nextSource;
}

function replaceEditorGallerySource(
  editor: Editor,
  sectionInfo: MarkdownSectionInformation,
  nextSource: string,
): void {
  const startLine = editor.getLine(sectionInfo.lineStart);
  const endLine = editor.getLine(sectionInfo.lineEnd);

  if (isGalleryFenceStart(startLine) && isFenceEnd(endLine)) {
    editor.replaceRange(ensureFinalLineEnding(nextSource), {
      line: sectionInfo.lineStart + 1,
      ch: 0,
    }, {
      line: sectionInfo.lineEnd,
      ch: 0,
    }, "obsidian-gallery-resize");
    return;
  }

  editor.replaceRange(nextSource, {
    line: sectionInfo.lineStart,
    ch: 0,
  }, {
    line: sectionInfo.lineEnd,
    ch: endLine.length,
  }, "obsidian-gallery-resize");
}

function replaceVaultGallerySource(
  content: string,
  sectionInfo: MarkdownSectionInformation,
  nextSource: string,
): string {
  const lineEnding = content.includes("\r\n") ? "\r\n" : "\n";
  const hadFinalLineEnding = /\r?\n$/.test(content);
  const lines = content.split(/\r?\n/);
  if (hadFinalLineEnding) {
    lines.pop();
  }

  const startLine = lines[sectionInfo.lineStart] ?? "";
  const endLine = lines[sectionInfo.lineEnd] ?? "";
  const nextLines = splitSourceLines(nextSource);

  if (isGalleryFenceStart(startLine) && isFenceEnd(endLine)) {
    lines.splice(sectionInfo.lineStart + 1, sectionInfo.lineEnd - sectionInfo.lineStart - 1, ...nextLines);
  } else {
    lines.splice(sectionInfo.lineStart, sectionInfo.lineEnd - sectionInfo.lineStart + 1, ...nextLines);
  }

  const joined = lines.join(lineEnding);
  return hadFinalLineEnding ? `${joined}${lineEnding}` : joined;
}

function splitSourceLines(source: string): string[] {
  const lines = source.split(/\r?\n/);
  if (/\r?\n$/.test(source)) {
    lines.pop();
  }
  return lines;
}

function ensureFinalLineEnding(source: string): string {
  return /\r?\n$/.test(source) ? source : `${source}\n`;
}

function isGalleryFenceStart(line: string): boolean {
  return /^\s*`{3,}\s*gallery\b/.test(line);
}

function isFenceEnd(line: string): boolean {
  return /^\s*`{3,}\s*$/.test(line);
}
