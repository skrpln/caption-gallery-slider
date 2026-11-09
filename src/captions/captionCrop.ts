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
/** One W/A/S/D press moves the media by this percent of its longer pannable distance. */
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

export interface CropSize {
  width: number;
  height: number;
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

/**
 * Distance in px that the crop can travel along each media box axis with
 * `object-fit: cover`. Crop `x` and `y` sweep this distance from 0 to 100,
 * so one percent moves the media by a hundredth of it. An unknown media size
 * counts as media that fills the box exactly.
 */
export function cropPanRange(box: CropSize, media: CropSize, zoom: number): CropDelta {
  const known = media.width > 0 && media.height > 0;
  const scale = known ? Math.max(box.width / media.width, box.height / media.height) : 1;
  const renderedWidth = known ? media.width * scale : box.width;
  const renderedHeight = known ? media.height * scale : box.height;

  return {
    x: Math.max(0, zoom * renderedWidth - box.width),
    y: Math.max(0, zoom * renderedHeight - box.height),
  };
}

/**
 * One W/A/S/D step. `direction` is a unit vector in screen axes. The media
 * moves the same number of screen pixels on both axes: `CROP_KEYBOARD_STEP`
 * percent of the longer pannable distance. A percent step on each axis would
 * move a wide viewport faster sideways than up and down.
 */
export function panCropByKeyboard(
  crop: CaptionCrop,
  direction: CropDelta,
  viewport: CropSize,
  media: CropSize,
  rotation = 0,
): CaptionCrop {
  const normalized = normalizeCrop(crop);
  // For quarter turns the media box is laid out as viewport height x width.
  const quarterTurn = normalizeRotation(rotation) % 180 !== 0;
  const box = quarterTurn ? { width: viewport.height, height: viewport.width } : viewport;
  const range = cropPanRange(box, media, normalized.zoom);
  const longest = Math.max(range.x, range.y);
  const delta = rotateCropDelta(direction, rotation);

  return panCrop(
    normalized,
    stepPercent(delta.x, longest, range.x),
    stepPercent(delta.y, longest, range.y),
  );
}

function stepPercent(direction: number, longest: number, range: number): number {
  return direction === 0 || range <= 0 ? 0 : direction * CROP_KEYBOARD_STEP * (longest / range);
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
