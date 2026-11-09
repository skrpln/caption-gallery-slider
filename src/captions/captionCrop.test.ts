import { describe, expect, it } from "vitest";
import {
  CROP_KEYBOARD_STEP,
  MAX_CROP_ZOOM,
  MIN_CROP_ZOOM,
  cropPanRange,
  normalizeCrop,
  panCrop,
  panCropByKeyboard,
  panCropByPixels,
  rotateCropDelta,
  scaleCropZoom,
  zoomCrop,
} from "./captionCrop";

describe("caption crop state", () => {
  it("normalizes crop coordinates and zoom", () => {
    expect(normalizeCrop({ x: -20, y: 120, zoom: 99 })).toEqual({
      x: 0,
      y: 100,
      zoom: MAX_CROP_ZOOM,
    });

    expect(normalizeCrop({ x: Number.NaN, y: Number.POSITIVE_INFINITY, zoom: 0 })).toEqual({
      x: 50,
      y: 50,
      zoom: MIN_CROP_ZOOM,
    });
  });

  it("pans crop by normalized percentage steps", () => {
    expect(panCrop({ x: 50, y: 50, zoom: 1 }, -5, 10)).toEqual({
      x: 45,
      y: 60,
      zoom: 1,
    });
  });

  it("maps drag pixels to crop movement opposite to image movement", () => {
    expect(panCropByPixels({ x: 50, y: 50, zoom: 1 }, 100, -50, 500, 250)).toEqual({
      x: 30,
      y: 70,
      zoom: 1,
    });
  });

  it("turns screen movement into media axes for each rotation", () => {
    const right = { x: 10, y: 0 };
    expect(rotateCropDelta(right, 0)).toEqual({ x: 10, y: 0 });
    expect(rotateCropDelta(right, 90)).toEqual({ x: 0, y: -10 });
    expect(rotateCropDelta(right, 180)).toEqual({ x: -10, y: 0 });
    expect(rotateCropDelta(right, 270)).toEqual({ x: 0, y: 10 });
    expect(rotateCropDelta({ x: 0, y: 4 }, 90)).toEqual({ x: 4, y: 0 });
    expect(rotateCropDelta(right, 450)).toEqual(rotateCropDelta(right, 90));
    expect(rotateCropDelta(right, -90)).toEqual(rotateCropDelta(right, 270));
  });

  it("pans a quarter-turned media box along its own axes", () => {
    // Dragging right over a 90 degree turn moves the crop along the element's
    // vertical axis, measured against the swapped box height.
    expect(panCropByPixels({ x: 50, y: 50, zoom: 1 }, 100, 0, 500, 250, 90)).toEqual({
      x: 50,
      y: 70,
      zoom: 1,
    });
    expect(panCropByPixels({ x: 50, y: 50, zoom: 1 }, 100, -50, 500, 250, 180)).toEqual({
      x: 70,
      y: 30,
      zoom: 1,
    });
  });

  it("zooms by fixed and scaled deltas", () => {
    expect(zoomCrop({ x: 50, y: 50, zoom: 1 }, 0.25).zoom).toBe(1.25);
    expect(scaleCropZoom({ x: 50, y: 50, zoom: 2 }, 1.5).zoom).toBe(3);
    expect(scaleCropZoom({ x: 50, y: 50, zoom: 2 }, -1).zoom).toBe(2);
  });
});

describe("keyboard crop pan", () => {
  const viewport = { width: 700, height: 400 };
  const landscape = { width: 1600, height: 900 };

  it("measures the pannable distance of a covered media box", () => {
    const zoomed = cropPanRange(viewport, landscape, 2);
    expect(zoomed.x).toBeCloseTo(2 * 1600 * (400 / 900) - 700);
    expect(zoomed.y).toBeCloseTo(400);

    const fitted = cropPanRange(viewport, landscape, 1);
    expect(fitted.y).toBe(0);
  });

  it("falls back to the box size while the media size is unknown", () => {
    expect(cropPanRange(viewport, { width: 0, height: 0 }, 2)).toEqual({ x: 700, y: 400 });
  });

  it("moves the media the same screen distance on both axes", () => {
    const crop = { x: 50, y: 50, zoom: 2 };
    const range = cropPanRange(viewport, landscape, 2);
    const right = panCropByKeyboard(crop, { x: 1, y: 0 }, viewport, landscape);
    const down = panCropByKeyboard(crop, { x: 0, y: 1 }, viewport, landscape);

    const rightPixels = ((right.x - crop.x) / 100) * range.x;
    const downPixels = ((down.y - crop.y) / 100) * range.y;
    expect(rightPixels).toBeCloseTo(downPixels);
    expect(rightPixels).toBeCloseTo((CROP_KEYBOARD_STEP / 100) * Math.max(range.x, range.y));
    expect(right.y).toBe(50);
    expect(down.x).toBe(50);
  });

  it("keeps the old step along the only axis that can move", () => {
    const portrait = { width: 900, height: 1200 };
    const crop = { x: 50, y: 50, zoom: 1 };
    expect(panCropByKeyboard(crop, { x: 0, y: -1 }, viewport, portrait)).toEqual({
      x: 50,
      y: 50 - CROP_KEYBOARD_STEP,
      zoom: 1,
    });
    expect(panCropByKeyboard(crop, { x: 1, y: 0 }, viewport, portrait)).toEqual(crop);
  });

  it("follows the screen after a quarter turn", () => {
    const crop = { x: 50, y: 50, zoom: 2 };
    const turned = panCropByKeyboard(crop, { x: 1, y: 0 }, viewport, landscape, 90);
    expect(turned.x).toBe(50);
    expect(turned.y).toBeLessThan(50);
  });
});
