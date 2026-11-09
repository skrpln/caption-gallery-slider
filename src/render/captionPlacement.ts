// Documentation: [[documentation/caption-placement]]

import { DEFAULT_CAPTION_HEIGHT, type GalleryCaptionPlacement } from "../parser/galleryBlockParser";
import type { GallerySizeOption } from "../parser/galleryBlockEditor";

export const MIN_CAPTION_HEIGHT = 28;
export const MIN_CAPTION_WIDTH = 180;
/** A side caption never squeezes the media below this width. */
export const MIN_SIDE_VIEW_WIDTH = 260;
export const MAX_CAPTION_SIZE = 1400;

export interface CaptionLayout {
  /** Placement actually rendered; a side caption falls back to `bottom` in a narrow widget. */
  placement: GalleryCaptionPlacement;
  /** Rendered panel thickness in px: height for top/bottom, width for left/right. */
  size: number;
  /** `true` when a requested side caption was moved to the bottom. */
  fallback: boolean;
}

export function isSideCaption(placement: GalleryCaptionPlacement): boolean {
  return placement === "left" || placement === "right";
}

/**
 * Resolves the rendered caption layout for the current widget width.
 * A width of `0` means the widget is not measured yet; the requested side is kept.
 */
export function resolveCaptionLayout(
  requested: GalleryCaptionPlacement,
  size: number,
  widgetWidth: number,
): CaptionLayout {
  if (!isSideCaption(requested)) {
    return { placement: requested, size: clamp(size, MIN_CAPTION_HEIGHT, MAX_CAPTION_SIZE), fallback: false };
  }

  const width = clamp(size, MIN_CAPTION_WIDTH, MAX_CAPTION_SIZE);
  if (widgetWidth <= 0) {
    return { placement: requested, size: width, fallback: false };
  }

  const available = widgetWidth - MIN_SIDE_VIEW_WIDTH;
  if (available < MIN_CAPTION_WIDTH) {
    return { placement: "bottom", size: DEFAULT_CAPTION_HEIGHT, fallback: true };
  }

  return { placement: requested, size: Math.min(width, available), fallback: false };
}

/**
 * Size change produced by dragging a resize handle. The viewport handle sits on
 * the viewport edge away from the caption; the caption handle sits on the outer
 * edge of a top/bottom caption and on the inner edge of a side caption.
 */
export function resizeHandleDelta(
  option: GallerySizeOption,
  placement: GalleryCaptionPlacement,
  deltaX: number,
  deltaY: number,
): number {
  if (option === "view_height") {
    return placement === "top" ? deltaY : 0 - deltaY;
  }

  switch (placement) {
    case "bottom":
      return deltaY;
    case "top":
      return 0 - deltaY;
    case "left":
      return deltaX;
    case "right":
      return 0 - deltaX;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.round(Math.min(max, Math.max(min, value)));
}
