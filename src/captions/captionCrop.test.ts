import { describe, expect, it } from "vitest";
import {
  MAX_CROP_ZOOM,
  MIN_CROP_ZOOM,
  normalizeCrop,
  panCrop,
  panCropByPixels,
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

  it("zooms by fixed and scaled deltas", () => {
    expect(zoomCrop({ x: 50, y: 50, zoom: 1 }, 0.25).zoom).toBe(1.25);
    expect(scaleCropZoom({ x: 50, y: 50, zoom: 2 }, 1.5).zoom).toBe(3);
    expect(scaleCropZoom({ x: 50, y: 50, zoom: 2 }, -1).zoom).toBe(2);
  });
});
