import { describe, expect, it } from "vitest";
import { updateGallerySizeOption } from "./galleryBlockEditor";

describe("updateGallerySizeOption", () => {
  it("updates an existing view_height option", () => {
    expect(updateGallerySizeOption("gallery_id: demo\nview_height: 400\n", "view_height", 512)).toBe(
      "gallery_id: demo\nview_height: 512\n",
    );
  });

  it("renames legacy height when the viewport size changes", () => {
    expect(updateGallerySizeOption("gallery_id: demo\nheight: 420\n", "view_height", 360)).toBe(
      "gallery_id: demo\nview_height: 360\n",
    );
  });

  it("inserts caption_height after view_height", () => {
    expect(updateGallerySizeOption("gallery_id: demo\nview_height: 400\nlist:\n  - a.png", "caption_height", 72))
      .toBe("gallery_id: demo\nview_height: 400\ncaption_height: 72\nlist:\n  - a.png");
  });

  it("keeps indentation and clamps rounded positive values", () => {
    expect(updateGallerySizeOption("gallery_id: demo\n  caption_height: 60", "caption_height", 0.4)).toBe(
      "gallery_id: demo\n  caption_height: 1",
    );
  });

  it("preserves CRLF line endings", () => {
    expect(updateGallerySizeOption("gallery_id: demo\r\nlist:\r\n  - a.png\r\n", "view_height", 256)).toBe(
      "gallery_id: demo\r\nview_height: 256\r\nlist:\r\n  - a.png\r\n",
    );
  });
});
