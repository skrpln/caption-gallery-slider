import { describe, expect, it } from "vitest";
import type { GalleryConfig } from "../parser/galleryBlockParser";
import { resolveGalleryMedia, type VaultEntryLike, type VaultLike } from "./mediaResolver";

describe("resolveGalleryMedia", () => {
  it("recursively resolves dir files and sorts the unified set", () => {
    const vault = createVault([
      folder("Attachments", [
        file("Attachments/c.png", 3),
        folder("Attachments/Nested", [
          file("Attachments/Nested/a.jpg", 1),
          file("Attachments/Nested/skip.pdf", 2),
        ]),
      ]),
      file("Other/b.webp", 2),
    ]);

    const result = resolveGalleryMedia(
      config({ dir: "Attachments", list: ["Other/b.webp"], sort: "name" }),
      vault,
    );

    expect(result).toEqual({
      ok: true,
      items: [
        expect.objectContaining({ path: "Attachments/Nested/a.jpg" }),
        expect.objectContaining({ path: "Other/b.webp" }),
        expect.objectContaining({ path: "Attachments/c.png" }),
      ],
    });
  });

  it("deduplicates dir and list entries before sorting", () => {
    const vault = createVault([
      folder("Attachments", [file("Attachments/a.png", 1)]),
    ]);

    const result = resolveGalleryMedia(
      config({ dir: "Attachments", list: ["Attachments/a.png"] }),
      vault,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.items).toHaveLength(1);
      expect(result.items[0].path).toBe("Attachments/a.png");
    }
  });

  it("sorts the whole media set by modified time", () => {
    const vault = createVault([
      folder("Attachments", [file("Attachments/a.png", 30)]),
      file("Other/b.png", 10),
    ]);

    const result = resolveGalleryMedia(
      config({ dir: "Attachments", list: ["Other/b.png"], sort: "modified" }),
      vault,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.items.map((item) => item.path)).toEqual(["Other/b.png", "Attachments/a.png"]);
    }
  });

  it("reports missing paths", () => {
    const result = resolveGalleryMedia(
      config({ dir: "Missing", list: ["Nope.png"] }),
      createVault([]),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(["Directory not found: Missing", "File not found: Nope.png"]);
    }
  });
});

function config(overrides: Partial<GalleryConfig>): GalleryConfig {
  return {
    galleryId: "test",
    list: [],
    sort: "name",
    grid: { rows: 1, columns: 1 },
    height: 360,
    navigation: "plane",
    ...overrides,
  };
}

function createVault(entries: VaultEntryLike[]): VaultLike {
  const byPath = new Map<string, VaultEntryLike>();

  function visit(entry: VaultEntryLike): void {
    byPath.set(entry.path, entry);
    if (entry.type === "folder") {
      entry.children.forEach(visit);
    }
  }

  entries.forEach(visit);

  return {
    getEntryByPath(path: string) {
      return byPath.get(path) ?? null;
    },
  };
}

function folder(path: string, children: VaultEntryLike[]): VaultEntryLike {
  return {
    type: "folder",
    path,
    name: path.split("/").at(-1) ?? path,
    children,
  };
}

function file(path: string, time: number): VaultEntryLike {
  const name = path.split("/").at(-1) ?? path;
  const extension = name.split(".").at(-1) ?? "";

  return {
    type: "file",
    path,
    name,
    extension,
    stat: {
      ctime: time,
      mtime: time,
    },
  };
}
