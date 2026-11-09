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
        viewHeight: 400,
        captionSize: 60,
        navigation: "plain",
        view: "crop",
        caption: "bottom",
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
view_height: 420
caption_height: 96
view: fit
caption: true
navigation: preview
`);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.list).toEqual(["Attachments/b.png", "Attachments/a.png"]);
      expect(result.config.sort).toBe("modified");
      expect(result.config.viewHeight).toBe(420);
      expect(result.config.captionSize).toBe(96);
      expect(result.config.view).toBe("fit");
      expect(result.config.caption).toBe("bottom");
      expect(result.config.navigation).toBe("preview");
    }
  });

  it("maps legacy height to view_height", () => {
    const result = parseGalleryBlock(`
gallery_id: legacy-height
list:
  - Attachments/a.png
height: 480
`);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.viewHeight).toBe(480);
      expect(result.config.captionSize).toBe(60);
    }
  });

  it("keeps old plane/fit values as temporary aliases", () => {
    const result = parseGalleryBlock(`
gallery_id: legacy
list:
  - Attachments/a.png
navigation: plane
fit: contain
`);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.navigation).toBe("plain");
      expect(result.config.view).toBe("fit");
    }
  });

  it("normalizes scalar option values", () => {
    const result = parseGalleryBlock(`
gallery_id: normalized
list:
  - Attachments/a.png
sort: "Modified"
view: FIT.
caption: TRUE
`);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.sort).toBe("modified");
      expect(result.config.view).toBe("fit");
      expect(result.config.caption).toBe("bottom");
    }
  });

  it("returns friendly validation errors", () => {
    const result = parseGalleryBlock(`
sort: random
view_height: -10
caption_height: nope
caption_size: 0
view: stretch
caption: maybe
`);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("`gallery_id` is required.");
      expect(result.errors).toContain("Provide at least one media source: `dir` or `list`.");
      expect(result.errors).toContain("`sort` must be one of: `name`, `created`, `modified`.");
      expect(result.errors).toContain("`view_height` must be a positive number.");
      expect(result.errors).toContain("`caption_height` must be a positive number.");
      expect(result.errors).toContain("`view` must be one of: `crop`, `fit`.");
      expect(result.errors).toContain("`caption_size` must be a positive number.");
      expect(result.errors).toContain("`caption` must be one of: `bottom`, `top`, `left`, `right`, `false`.");
    }
  });

  it("reads caption placement and keeps true as the bottom alias", () => {
    const placements = ["bottom", "top", "left", "right"] as const;
    for (const placement of placements) {
      const result = parseGalleryBlock(`gallery_id: p\nlist:\n  - a.png\ncaption: ${placement}`);
      expect(result.ok && result.config.caption).toBe(placement);
    }

    const shown = parseGalleryBlock("gallery_id: p\nlist:\n  - a.png\ncaption: true");
    const hidden = parseGalleryBlock("gallery_id: p\nlist:\n  - a.png\ncaption: false");
    const normalized = parseGalleryBlock("gallery_id: p\nlist:\n  - a.png\ncaption: Right.");
    expect(shown.ok && shown.config.caption).toBe("bottom");
    expect(hidden.ok).toBe(true);
    expect(hidden.ok && hidden.config.caption).toBe(false);
    expect(normalized.ok && normalized.config.caption).toBe("right");
  });

  it("defaults caption_size by placement axis", () => {
    const side = parseGalleryBlock("gallery_id: p\nlist:\n  - a.png\ncaption: left");
    const top = parseGalleryBlock("gallery_id: p\nlist:\n  - a.png\ncaption: top");
    expect(side.ok && side.config.captionSize).toBe(300);
    expect(top.ok && top.config.captionSize).toBe(60);
  });

  it("reads caption_size for every placement", () => {
    const side = parseGalleryBlock("gallery_id: p\nlist:\n  - a.png\ncaption: right\ncaption_size: 280");
    const bottom = parseGalleryBlock("gallery_id: p\nlist:\n  - a.png\ncaption_size: 84");
    expect(side.ok && side.config.captionSize).toBe(280);
    expect(bottom.ok && bottom.config.captionSize).toBe(84);
  });

  it("applies legacy caption_height only to top and bottom captions", () => {
    const top = parseGalleryBlock("gallery_id: p\nlist:\n  - a.png\ncaption: top\ncaption_height: 96");
    const side = parseGalleryBlock("gallery_id: p\nlist:\n  - a.png\ncaption: right\ncaption_height: 96");
    const both = parseGalleryBlock("gallery_id: p\nlist:\n  - a.png\ncaption_height: 96\ncaption_size: 72");
    expect(top.ok && top.config.captionSize).toBe(96);
    expect(side.ok && side.config.captionSize).toBe(300);
    expect(both.ok && both.config.captionSize).toBe(72);
  });

  it("rejects future-only grid options", () => {
    const result = parseGalleryBlock(`
gallery_id: grid
dir: Attachments
grid: 2,2
navigation: preview
`);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("Only `grid: 1,1` is supported before Phase 5.");
      expect(result.errors).not.toContain("Only `navigation: plain` is supported in Phase 1.");
    }
  });
});
