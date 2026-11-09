import { describe, expect, it } from "vitest";
import {
  MIN_CAPTION_HEIGHT,
  MIN_CAPTION_WIDTH,
  MIN_SIDE_VIEW_WIDTH,
  resizeHandleDelta,
  resolveCaptionLayout,
} from "./captionPlacement";

describe("resolveCaptionLayout", () => {
  it("keeps top and bottom captions and clamps their height", () => {
    expect(resolveCaptionLayout("bottom", 96, 700)).toEqual({ placement: "bottom", size: 96, mode: "stored" });
    expect(resolveCaptionLayout("top", 4, 700)).toEqual({ placement: "top", size: MIN_CAPTION_HEIGHT, mode: "stored" });
    expect(resolveCaptionLayout("top", 5000, 700)).toEqual({ placement: "top", size: 1400, mode: "stored" });
  });

  it("keeps a side caption when the widget leaves room for the media", () => {
    expect(resolveCaptionLayout("right", 300, 700)).toEqual({ placement: "right", size: 300, mode: "stored" });
    expect(resolveCaptionLayout("left", 300, 700)).toEqual({ placement: "left", size: 300, mode: "stored" });
  });

  it("raises a side caption that is too narrow to its minimum width", () => {
    expect(resolveCaptionLayout("right", 60, 700)).toEqual({
      placement: "right",
      size: MIN_CAPTION_WIDTH,
      mode: "stored",
    });
  });

  it("shrinks a side caption so the media keeps its minimum width", () => {
    expect(resolveCaptionLayout("left", 900, 700)).toEqual({
      placement: "left",
      size: 700 - MIN_SIDE_VIEW_WIDTH,
      mode: "stored",
    });
  });

  it("moves a side caption to the bottom when the widget is too narrow", () => {
    const threshold = MIN_CAPTION_WIDTH + MIN_SIDE_VIEW_WIDTH;

    expect(resolveCaptionLayout("right", 300, threshold)).toEqual({
      placement: "right",
      size: MIN_CAPTION_WIDTH,
      mode: "stored",
    });
    expect(resolveCaptionLayout("right", 300, threshold - 1)).toEqual({ placement: "bottom", size: 60, mode: "fallback" });
    expect(resolveCaptionLayout("left", 300, 420)).toEqual({ placement: "bottom", size: 60, mode: "fallback" });
  });

  it("keeps the requested side while the widget is not measured yet", () => {
    expect(resolveCaptionLayout("right", 300, 0)).toEqual({ placement: "right", size: 300, mode: "stored" });
  });

  it("splits a hover popover in half between a side caption and the media", () => {
    expect(resolveCaptionLayout("right", 300, 420, true)).toEqual({ placement: "right", size: 210, mode: "popover" });
    expect(resolveCaptionLayout("left", 120, 301, true)).toEqual({ placement: "left", size: 151, mode: "popover" });
    expect(resolveCaptionLayout("left", 300, 900, true)).toEqual({ placement: "left", size: 450, mode: "popover" });
  });

  it("leaves top and bottom captions in a hover popover as they are", () => {
    expect(resolveCaptionLayout("bottom", 96, 420, true)).toEqual({ placement: "bottom", size: 96, mode: "stored" });
    expect(resolveCaptionLayout("top", 80, 420, true)).toEqual({ placement: "top", size: 80, mode: "stored" });
  });
});

describe("resizeHandleDelta", () => {
  it("grows the viewport from its outer edge", () => {
    expect(resizeHandleDelta("view_height", "bottom", 0, -20)).toBe(20);
    expect(resizeHandleDelta("view_height", "left", 0, -20)).toBe(20);
    expect(resizeHandleDelta("view_height", "right", 0, -20)).toBe(20);
    expect(resizeHandleDelta("view_height", "top", 0, 20)).toBe(20);
  });

  it("grows the caption from the edge facing away from or toward the media", () => {
    expect(resizeHandleDelta("caption_size", "bottom", 0, 20)).toBe(20);
    expect(resizeHandleDelta("caption_size", "top", 0, -20)).toBe(20);
    expect(resizeHandleDelta("caption_size", "left", 20, 0)).toBe(20);
    expect(resizeHandleDelta("caption_size", "right", -20, 0)).toBe(20);
  });

  it("ignores movement across the resize axis", () => {
    expect(resizeHandleDelta("caption_size", "right", 0, 50)).toBe(0);
    expect(resizeHandleDelta("caption_size", "bottom", 50, 0)).toBe(0);
  });
});
