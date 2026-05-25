import { describe, expect, it } from "vitest";
import { parseGalleryBlock } from "./galleryBlockParser";

describe("parseGalleryBlock", () => {
  it("parses a minimal dir gallery", () => {
    const result = parseGalleryBlock(`
gallery_id: vacation
dir: Attachments/Vacation
`);

    expect(result).toEqual({
      ok: true,
      config: {
        galleryId: "vacation",
        dir: "Attachments/Vacation",
        list: [],
        sort: "name",
        grid: { rows: 1, columns: 1 },
        height: 360,
        navigation: "plane",
        fit: "cover",
        caption: false,
      },
    });
  });

  it("parses list items and explicit options", () => {
    const result = parseGalleryBlock(`
gallery_id: picks
list:
  - Attachments/b.png
  - Attachments/a.png
sort: modified
height: 420
fit: contain
caption: true
`);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.list).toEqual(["Attachments/b.png", "Attachments/a.png"]);
      expect(result.config.sort).toBe("modified");
      expect(result.config.height).toBe(420);
      expect(result.config.fit).toBe("contain");
      expect(result.config.caption).toBe(true);
    }
  });

  it("normalizes scalar option values", () => {
    const result = parseGalleryBlock(`
gallery_id: normalized
list:
  - Attachments/a.png
sort: "Modified"
fit: сontain.
caption: TRUE
`);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.sort).toBe("modified");
      expect(result.config.fit).toBe("contain");
      expect(result.config.caption).toBe(true);
    }
  });

  it("returns friendly validation errors", () => {
    const result = parseGalleryBlock(`
sort: random
height: -10
fit: stretch
caption: maybe
`);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("`gallery_id` is required.");
      expect(result.errors).toContain("Provide at least one media source: `dir` or `list`.");
      expect(result.errors).toContain("`sort` must be one of: `name`, `created`, `modified`.");
      expect(result.errors).toContain("`height` must be a positive number.");
      expect(result.errors).toContain("`fit` must be one of: `cover`, `contain`.");
      expect(result.errors).toContain("`caption` must be one of: `true`, `false`.");
    }
  });

  it("rejects future-only Phase 1 options", () => {
    const result = parseGalleryBlock(`
gallery_id: grid
dir: Attachments
grid: 2,2
navigation: preview
`);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("Only `grid: 1,1` is supported in Phase 1.");
      expect(result.errors).toContain("Only `navigation: plane` is supported in Phase 1.");
    }
  });
});
