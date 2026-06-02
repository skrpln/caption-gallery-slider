// Documentation: [[documentation/crop-controls]]

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

export function panCropByPixels(
  crop: CaptionCrop,
  deltaClientX: number,
  deltaClientY: number,
  viewportWidth: number,
  viewportHeight: number,
): CaptionCrop {
  const normalized = normalizeCrop(crop);
  const safeWidth = viewportWidth > 0 ? viewportWidth : 1;
  const safeHeight = viewportHeight > 0 ? viewportHeight : 1;

  return panCrop(
    normalized,
    -(deltaClientX / safeWidth) * 100 / normalized.zoom,
    -(deltaClientY / safeHeight) * 100 / normalized.zoom,
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

function clampFinite(value: number | null | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}
