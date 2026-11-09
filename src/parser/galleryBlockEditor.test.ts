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

  it("inserts caption_size after view_height", () => {
    expect(updateGallerySizeOption("gallery_id: demo\nview_height: 400\nlist:\n  - a.png", "caption_size", 72))
      .toBe("gallery_id: demo\nview_height: 400\ncaption_size: 72\nlist:\n  - a.png");
  });

  it("updates an existing caption_size option", () => {
    expect(updateGallerySizeOption("gallery_id: demo\ncaption: right\ncaption_size: 300\n", "caption_size", 340))
      .toBe("gallery_id: demo\ncaption: right\ncaption_size: 340\n");
  });

  it("renames legacy caption_height when the caption size changes", () => {
    expect(updateGallerySizeOption("gallery_id: demo\ncaption_height: 96\n", "caption_size", 280)).toBe(
      "gallery_id: demo\ncaption_size: 280\n",
    );
  });

  it("prefers caption_size over a leftover caption_height line", () => {
    expect(updateGallerySizeOption("gallery_id: demo\ncaption_height: 96\ncaption_size: 72", "caption_size", 80))
      .toBe("gallery_id: demo\ncaption_height: 96\ncaption_size: 80");
  });

  it("keeps indentation and clamps rounded positive values", () => {
    expect(updateGallerySizeOption("gallery_id: demo\n  caption_size: 60", "caption_size", 0.4)).toBe(
      "gallery_id: demo\n  caption_size: 1",
    );
  });

  it("preserves CRLF line endings", () => {
    expect(updateGallerySizeOption("gallery_id: demo\r\nlist:\r\n  - a.png\r\n", "view_height", 256)).toBe(
      "gallery_id: demo\r\nview_height: 256\r\nlist:\r\n  - a.png\r\n",
    );
  });
});
