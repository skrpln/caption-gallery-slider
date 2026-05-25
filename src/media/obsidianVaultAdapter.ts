// Documentation: [[documentation/architecture]]

import { TFile, TFolder, type TAbstractFile, type Vault } from "obsidian";
import type { VaultEntryLike, VaultFileLike, VaultFolderLike, VaultLike } from "./mediaResolver";

export function createObsidianVaultAdapter(vault: Vault): VaultLike {
  return {
    getEntryByPath(path: string): VaultEntryLike | null {
      return toVaultEntry(vault.getAbstractFileByPath(path));
    },
  };
}

export function getObsidianResourcePath(vault: Vault, path: string): string | null {
  const file = vault.getAbstractFileByPath(path);

  if (!(file instanceof TFile)) {
    return null;
  }

  return vault.getResourcePath(file);
}

function toVaultEntry(entry: TAbstractFile | null): VaultEntryLike | null {
  if (entry instanceof TFile) {
    return toVaultFile(entry);
  }

  if (entry instanceof TFolder) {
    return toVaultFolder(entry);
  }

  return null;
}

function toVaultFile(file: TFile): VaultFileLike {
  return {
    type: "file",
    path: file.path,
    name: file.name,
    extension: file.extension,
    stat: {
      ctime: file.stat.ctime,
      mtime: file.stat.mtime,
    },
  };
}

function toVaultFolder(folder: TFolder): VaultFolderLike {
  return {
    type: "folder",
    path: folder.path,
    name: folder.name,
    children: folder.children.flatMap((child) => {
      const entry = toVaultEntry(child);
      return entry ? [entry] : [];
    }),
  };
}
