// Documentation: [[documentation/caption-placement]]

import { DEFAULT_CAPTION_HEIGHT, type GalleryCaptionPlacement } from "../parser/galleryBlockParser";
import type { GallerySizeOption } from "../parser/galleryBlockEditor";

export const MIN_CAPTION_HEIGHT = 28;
export const MIN_CAPTION_WIDTH = 180;
/** A side caption never squeezes the media below this width. */
export const MIN_SIDE_VIEW_WIDTH = 260;
export const MAX_CAPTION_SIZE = 1400;

/**
 * Where the rendered caption size comes from:
 * - `stored`: `caption_size`, clamped; the caption handle resizes it;
 * - `fallback`: a side caption moved to the bottom of a narrow widget, default height;
 * - `popover`: a side caption in a hover popover, half of the widget width.
 * Only `stored` captions can be resized: in the other modes the size is not
 * `caption_size`, so a dragged value would be saved for a layout it does not describe.
 */
export type CaptionLayoutMode = "stored" | "fallback" | "popover";

export interface CaptionLayout {
  /** Placement actually rendered; a side caption falls back to `bottom` in a narrow widget. */
  placement: GalleryCaptionPlacement;
  /** Rendered panel thickness in px: height for top/bottom, width for left/right. */
  size: number;
  mode: CaptionLayoutMode;
}

export function isSideCaption(placement: GalleryCaptionPlacement): boolean {
  return placement === "left" || placement === "right";
}

/**
 * Resolves the rendered caption layout for the current widget width.
 * A width of `0` means the widget is not measured yet; the requested side is kept.
 * In a hover popover a side caption always keeps its side and takes half of
 * the widget, so a preview shows the gallery as the note lays it out.
 */
export function resolveCaptionLayout(
  requested: GalleryCaptionPlacement,
  size: number,
  widgetWidth: number,
  inPopover = false,
): CaptionLayout {
  if (!isSideCaption(requested)) {
    return { placement: requested, size: clamp(size, MIN_CAPTION_HEIGHT, MAX_CAPTION_SIZE), mode: "stored" };
  }

  const width = clamp(size, MIN_CAPTION_WIDTH, MAX_CAPTION_SIZE);
  if (widgetWidth <= 0) {
    return { placement: requested, size: width, mode: "stored" };
  }

  if (inPopover) {
    return { placement: requested, size: Math.round(widgetWidth / 2), mode: "popover" };
  }

  const available = widgetWidth - MIN_SIDE_VIEW_WIDTH;
  if (available < MIN_CAPTION_WIDTH) {
    return { placement: "bottom", size: DEFAULT_CAPTION_HEIGHT, mode: "fallback" };
  }

  return { placement: requested, size: Math.min(width, available), mode: "stored" };
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
