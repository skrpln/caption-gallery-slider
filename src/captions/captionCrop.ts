// Documentation: [[documentation/crop-controls]]

import { normalizeRotation } from "../media/mediaRotation";

export interface CaptionCrop {
  x: number;
  y: number;
  zoom: number;
}

export const DEFAULT_CROP: CaptionCrop = {
  x: 50,
  y: 50,
  zoom: 1,
};

export const MIN_CROP_ZOOM = 1;
export const MAX_CROP_ZOOM = 4;
export const CROP_KEYBOARD_STEP = 5;
export const CROP_ZOOM_STEP = 0.15;

export function normalizeCrop(input: Partial<CaptionCrop> | null | undefined): CaptionCrop {
  return {
    x: clampFinite(input?.x, 0, 100, DEFAULT_CROP.x),
    y: clampFinite(input?.y, 0, 100, DEFAULT_CROP.y),
    zoom: clampFinite(input?.zoom, MIN_CROP_ZOOM, MAX_CROP_ZOOM, DEFAULT_CROP.zoom),
  };
}

export function panCrop(crop: CaptionCrop, deltaX: number, deltaY: number): CaptionCrop {
  const normalized = normalizeCrop(crop);
  return normalizeCrop({
    ...normalized,
    x: normalized.x + deltaX,
    y: normalized.y + deltaY,
  });
}

export interface CropDelta {
  x: number;
  y: number;
}

/**
 * Converts a movement expressed in screen axes into the media element's own
 * axes. A quarter-turned media box lies sideways on screen, so a horizontal
 * drag over it has to move the crop along the element's vertical axis.
 */
export function rotateCropDelta(delta: CropDelta, rotation: number): CropDelta {
  switch (normalizeRotation(rotation)) {
    case 90:
      return { x: delta.y, y: negate(delta.x) };
    case 180:
      return { x: negate(delta.x), y: negate(delta.y) };
    case 270:
      return { x: negate(delta.y), y: delta.x };
    default:
      return { x: delta.x, y: delta.y };
  }
}

export function panCropByPixels(
  crop: CaptionCrop,
  deltaClientX: number,
  deltaClientY: number,
  viewportWidth: number,
  viewportHeight: number,
  rotation = 0,
): CaptionCrop {
  const normalized = normalizeCrop(crop);
  const delta = rotateCropDelta({ x: deltaClientX, y: deltaClientY }, rotation);
  // For quarter turns the media box is laid out as viewport height x width.
  const quarterTurn = normalizeRotation(rotation) % 180 !== 0;
  const boxWidth = quarterTurn ? viewportHeight : viewportWidth;
  const boxHeight = quarterTurn ? viewportWidth : viewportHeight;
  const safeWidth = boxWidth > 0 ? boxWidth : 1;
  const safeHeight = boxHeight > 0 ? boxHeight : 1;

  return panCrop(
    normalized,
    -(delta.x / safeWidth) * 100 / normalized.zoom,
    -(delta.y / safeHeight) * 100 / normalized.zoom,
  );
}

export function zoomCrop(crop: CaptionCrop, zoomDelta: number): CaptionCrop {
  const normalized = normalizeCrop(crop);
  return normalizeCrop({
    ...normalized,
    zoom: normalized.zoom + zoomDelta,
  });
}

export function scaleCropZoom(crop: CaptionCrop, factor: number): CaptionCrop {
  const normalized = normalizeCrop(crop);
  if (!Number.isFinite(factor) || factor <= 0) {
    return normalized;
  }

  return normalizeCrop({
    ...normalized,
    zoom: normalized.zoom * factor,
  });
}

function negate(value: number): number {
  return value === 0 ? 0 : -value;
}

function clampFinite(value: number | null | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}
