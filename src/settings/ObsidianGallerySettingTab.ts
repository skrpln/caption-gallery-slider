// Documentation: [[documentation/phase-2-captions]]

import { AbstractInputSuggest, App, Notice, Plugin, PluginSettingTab, Setting, TFolder, type TextComponent } from "obsidian";
import { ensureFolderPath } from "../captions/obsidianCaptionService";
import {
  DEFAULT_GALLERY_SAVE_DIR,
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

  display(): void {
    this.containerEl.empty();

    new Setting(this.containerEl)
      .setName("Caption folder")
      .setDesc("Vault folder where gallery caption notes are stored.")
      .addText((text) => {
        new FolderSuggest(this.app, text, async (path) => {
          await this.persistCaptionFolder(path, text);
        });

        text
          .setPlaceholder(`Example: ${DEFAULT_GALLERY_SAVE_DIR}`)
          .setValue(this.plugin.settings.gallerySaveDir)
          .onChange(async (value) => {
            this.plugin.settings.gallerySaveDir = normalizeGallerySaveDir(value);
            await this.plugin.saveSettings();
          });

        text.inputEl.addEventListener("blur", () => {
          void this.persistCaptionFolder(text.getValue(), text);
        });

        text.inputEl.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            text.inputEl.blur();
          }
        });
      });
  }

  private async persistCaptionFolder(value: string, text: TextComponent): Promise<void> {
    const path = normalizeGallerySaveDir(value);
    text.setValue(path);
    this.plugin.settings.gallerySaveDir = path;
    await this.plugin.saveSettings();

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
