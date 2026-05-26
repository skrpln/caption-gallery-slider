import { describe, expect, it } from "vitest";
import { buildCaptionPath, createShortHash } from "./captionPath";

describe("buildCaptionPath", () => {
  it("requires an explicit caption storage folder", () => {
    expect(() =>
      buildCaptionPath({
        gallerySaveDir: "",
        galleryId: "vacation",
        item: {
          kind: "image",
          path: "Attachments/Vacation/photo.png",
        },
      }),
    ).toThrow("Caption folder is not configured.");
  });

  it("creates a stable caption path for the same vault path", () => {
    const input = {
      gallerySaveDir: "gallery_captions",
      galleryId: "vacation",
      item: {
        kind: "image" as const,
        path: "Attachments/Vacation/photo.png",
      },
    };

    expect(buildCaptionPath(input)).toBe(buildCaptionPath(input));
    expect(buildCaptionPath(input)).toMatch(/^gallery_captions\/vacation\/img-[a-z0-9]{7}\.md$/);
  });

  it("uses gallery_id as a separate namespace", () => {
    const item = {
      kind: "image" as const,
      path: "Attachments/photo.png",
    };

    expect(buildCaptionPath({ gallerySaveDir: "gallery_captions", galleryId: "first", item }))
      .not.toBe(buildCaptionPath({ gallerySaveDir: "gallery_captions", galleryId: "second", item }));
  });

  it("uses video target prefixes for future video captions", () => {
    const path = buildCaptionPath({
      gallerySaveDir: "gallery_captions",
      galleryId: "clips",
      item: {
        kind: "video",
        path: "Attachments/clip.mp4",
      },
    });

    expect(path).toContain("/vid-");
  });
});

describe("createShortHash", () => {
  it("changes when the vault path changes", () => {
    expect(createShortHash("Attachments/a.png")).not.toBe(createShortHash("Attachments/b.png"));
  });
});
