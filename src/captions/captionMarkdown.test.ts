import { describe, expect, it } from "vitest";
import {
  createCaptionMarkdown,
  normalizeRotation,
  readFrontmatterNumber,
  splitCaptionMarkdown,
  upsertFrontmatterNumber,
} from "./captionMarkdown";

describe("splitCaptionMarkdown", () => {
  it("separates frontmatter from the editable caption body", () => {
    expect(splitCaptionMarkdown("---\ngallery_id: vacation\nsource_path: image.png\n---\nA [[caption]].")).toEqual({
      frontmatter: "gallery_id: vacation\nsource_path: image.png",
      body: "A [[caption]].",
    });
  });

  it("keeps markdown without frontmatter as body", () => {
    expect(splitCaptionMarkdown("Plain caption")).toEqual({
      frontmatter: null,
      body: "Plain caption",
    });
  });
});

describe("createCaptionMarkdown", () => {
  it("creates minimal frontmatter plus markdown body", () => {
    expect(
      createCaptionMarkdown({
        galleryId: "vacation",
        target: "img",
        sourcePath: "Attachments/photo.png",
        body: "Caption body",
      }),
    ).toBe('---\ngallery_id: "vacation"\ntarget: "img"\nsource_path: "Attachments/photo.png"\nrotation: 0\n---\nCaption body');
  });
});

describe("caption frontmatter numbers", () => {
  it("reads and updates rotation", () => {
    expect(readFrontmatterNumber("rotation: 90", "rotation", 0)).toBe(90);
    expect(upsertFrontmatterNumber("gallery_id: test", "rotation", 180)).toBe("gallery_id: test\nrotation: 180");
    expect(upsertFrontmatterNumber("rotation: 90", "rotation", 180)).toBe("rotation: 180");
  });

  it("normalizes rotation to one clockwise circle", () => {
    expect(normalizeRotation(450)).toBe(90);
    expect(normalizeRotation(-90)).toBe(270);
  });
});
