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
        captionHeight: 60,
        navigation: "plain",
        view: "crop",
        caption: true,
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
`);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.list).toEqual(["Attachments/b.png", "Attachments/a.png"]);
      expect(result.config.sort).toBe("modified");
      expect(result.config.viewHeight).toBe(420);
      expect(result.config.captionHeight).toBe(96);
      expect(result.config.view).toBe("fit");
      expect(result.config.caption).toBe(true);
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
      expect(result.config.captionHeight).toBe(60);
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
      expect(result.config.caption).toBe(true);
    }
  });

  it("returns friendly validation errors", () => {
    const result = parseGalleryBlock(`
sort: random
view_height: -10
caption_height: nope
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
      expect(result.errors).toContain("Only `navigation: plain` is supported in Phase 1.");
    }
  });
});
