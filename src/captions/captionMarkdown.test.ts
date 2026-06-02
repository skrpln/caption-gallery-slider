import { describe, expect, it } from "vitest";
import {
  createCaptionMarkdown,
  normalizeRotation,
  readFrontmatterBoolean,
  readFrontmatterNumber,
  readVideoPlayback,
  splitCaptionMarkdown,
  upsertFrontmatterBoolean,
  upsertFrontmatterNumber,
  upsertVideoPlayback,
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

  it("can include video playback frontmatter", () => {
    expect(
      createCaptionMarkdown({
        galleryId: "vacation",
        target: "vid",
        sourcePath: "Attachments/clip.mp4",
        body: "",
        playback: { autoplay: false, muted: true, loop: true, start: 12, end: 42.5 },
      }),
    ).toBe('---\ngallery_id: "vacation"\ntarget: "vid"\nsource_path: "Attachments/clip.mp4"\nrotation: 0\nautoplay: false\nmuted: true\nloop: true\nstart: 12\nend: 42.5\n---\n');
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

describe("caption frontmatter booleans", () => {
  it("reads and updates playback flags", () => {
    const frontmatter = "autoplay: true\nmuted: false\nloop: true\nstart: 12.5\nend: 42";

    expect(readFrontmatterBoolean(frontmatter, "autoplay", false)).toBe(true);
    expect(readVideoPlayback(frontmatter)).toEqual({
      autoplay: true,
      muted: false,
      loop: true,
      start: 12.5,
      end: 42,
    });
    expect(upsertFrontmatterBoolean("muted: false", "muted", true)).toBe("muted: true");
    expect(upsertFrontmatterBoolean("gallery_id: test", "loop", true)).toBe("gallery_id: test\nloop: true");
  });

  it("upserts all video playback flags", () => {
    expect(upsertVideoPlayback("gallery_id: test", {
      autoplay: true,
      muted: true,
      loop: false,
      start: 3.25,
      end: 8,
    })).toBe("gallery_id: test\nautoplay: true\nmuted: true\nloop: false\nstart: 3.25\nend: 8");
  });
});
