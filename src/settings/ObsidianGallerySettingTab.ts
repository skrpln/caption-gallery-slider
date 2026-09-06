// Documentation: [[documentation/phase-2-captions]]

import {
  AbstractInputSuggest,
  App,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFolder,
  type SettingDefinitionItem,
  type TextComponent,
} from "obsidian";
import { ensureFolderPath } from "../captions/obsidianCaptionService";
import {
  CAPTION_FOLDER_SETTING,
  captionFolderSettingDefinition,
  normalizeGallerySaveDir,
  type ObsidianGallerySettings,
} from "./settings";

export interface ObsidianGallerySettingsOwner extends Plugin {
  settings: ObsidianGallerySettings;
  saveSettings(): Promise<void>;
}

export class ObsidianGallerySettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: ObsidianGallerySettingsOwner) {
    super(app, plugin);
  }

  /**
   * Obsidian 1.13 and newer render the tab from these definitions and list
   * them in the settings search. `display()` is not called on those versions.
   */
  getSettingDefinitions(): SettingDefinitionItem<keyof ObsidianGallerySettings>[] {
    return [captionFolderSettingDefinition()];
  }

  getControlValue(key: string): unknown {
    return key === "gallerySaveDir" ? this.plugin.settings.gallerySaveDir : undefined;
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    if (key !== "gallerySaveDir" || typeof value !== "string") {
      return;
    }

    // Missing folders are created by the caption service on the first write,
    // so a value saved on every keystroke leaves no partial folders behind.
    await this.saveCaptionFolder(value);
  }

  /** Imperative fallback for Obsidian older than 1.13, which has no declarative settings. */
  display(): void {
    this.containerEl.empty();

    new Setting(this.containerEl)
      .setName(CAPTION_FOLDER_SETTING.name)
      .setDesc(CAPTION_FOLDER_SETTING.desc)
      .addText((text) => {
        new FolderSuggest(this.app, text, async (path) => {
          await this.commitCaptionFolder(path, text);
        });

        text
          .setPlaceholder(CAPTION_FOLDER_SETTING.placeholder)
          .setValue(this.plugin.settings.gallerySaveDir)
          .onChange(async (value) => {
            await this.saveCaptionFolder(value);
          });

        text.inputEl.addEventListener("blur", () => {
          void this.commitCaptionFolder(text.getValue(), text);
        });

        text.inputEl.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            text.inputEl.blur();
          }
        });
      });
  }

  /** Normalizes and stores the folder path without touching the vault. */
  private async saveCaptionFolder(value: string): Promise<string> {
    const path = normalizeGallerySaveDir(value);
    this.plugin.settings.gallerySaveDir = path;
    await this.plugin.saveSettings();
    return path;
  }

  /** Stores the folder path and creates the missing folders right away. */
  private async commitCaptionFolder(value: string, text: TextComponent): Promise<void> {
    const path = await this.saveCaptionFolder(value);
    text.setValue(path);
    if (!path) {
      return;
    }

    try {
      await ensureFolderPath(this.app.vault, path);
    } catch (error) {
      new Notice(`Caption Gallery Slider: cannot create caption folder "${path}".`);
      console.error(error);
    }
  }
}

class FolderSuggest extends AbstractInputSuggest<TFolder> {
  constructor(
    app: App,
    private readonly text: TextComponent,
    private readonly onSelectPath: (path: string) => Promise<void>,
  ) {
    super(app, text.inputEl);
  }

  protected getSuggestions(query: string): TFolder[] {
    const normalizedQuery = normalizeGallerySaveDir(query).toLowerCase();

    return this.app.vault
      .getAllFolders(false)
      .filter((folder) => !normalizedQuery || folder.path.toLowerCase().includes(normalizedQuery))
      .sort((left, right) => left.path.localeCompare(right.path))
      .slice(0, 100);
  }

  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.textContent = folder.path;
  }

  selectSuggestion(folder: TFolder): void {
    this.setValue(folder.path);
    this.close();
    void this.onSelectPath(folder.path);
  }
}
