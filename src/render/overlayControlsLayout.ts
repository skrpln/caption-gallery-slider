// Documentation: [[documentation/overlay-controls-layout]]

export type OverlayControlsLayout = "normal" | "compact" | "ultra" | "hidden";

export interface OverlayControlsMetrics {
  viewportWidth: number;
  viewportHeight: number;
  videoButtonCount: number;
  mediaActionCount: number;
}

const SIDE_PADDING = 14 * 2;
const CONTROL_SIZE = 24;
const CONTROL_GAP = 6;
const MIN_PROGRESS_WIDTH = 180;
const MIN_COMPACT_PROGRESS_WIDTH = 120;
const MAX_OVERLAY_RATIO = 0.6;

export function chooseOverlayControlsLayout(metrics: OverlayControlsMetrics): OverlayControlsLayout {
  const videoButtonsWidth = groupWidth(metrics.videoButtonCount);
  const mediaActionsWidth = groupWidth(metrics.mediaActionCount);
  const viewportWidth = Math.max(0, metrics.viewportWidth);
  const viewportHeight = Math.max(0, metrics.viewportHeight);

  if (viewportWidth <= 0 || viewportHeight <= 0 || videoButtonsWidth <= 0) {
    return "hidden";
  }

  const normalWidth = SIDE_PADDING + videoButtonsWidth + CONTROL_GAP + MIN_PROGRESS_WIDTH + CONTROL_GAP + mediaActionsWidth;
  if (viewportWidth >= normalWidth && overlayFits(viewportHeight, rowHeight(1))) {
    return "normal";
  }

  const compactWidth = SIDE_PADDING + videoButtonsWidth + CONTROL_GAP + mediaActionsWidth;
  const progressWidth = SIDE_PADDING + MIN_COMPACT_PROGRESS_WIDTH;
  if (
    viewportWidth >= Math.max(compactWidth, progressWidth)
    && overlayFits(viewportHeight, rowHeight(2))
  ) {
    return "compact";
  }

  const ultraWidth = SIDE_PADDING + Math.max(videoButtonsWidth, mediaActionsWidth, MIN_COMPACT_PROGRESS_WIDTH);
  if (viewportWidth >= ultraWidth && overlayFits(viewportHeight, rowHeight(3))) {
    return "ultra";
  }

  return "hidden";
}

function groupWidth(count: number): number {
  if (count <= 0) {
    return 0;
  }

  return count * CONTROL_SIZE + (count - 1) * CONTROL_GAP;
}

function rowHeight(rows: number): number {
  return rows * CONTROL_SIZE + Math.max(0, rows - 1) * CONTROL_GAP;
}

function overlayFits(viewportHeight: number, overlayHeight: number): boolean {
  return overlayHeight / viewportHeight <= MAX_OVERLAY_RATIO;
}
