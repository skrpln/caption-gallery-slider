// Documentation: [[documentation/phase-2-captions]]

export const NAV_DOT_SIZE = 6;
export const NAV_DOT_GAP = 3;
export const NAV_THUMB_WIDTH = 15;
export const NAV_DOT_ITEM_LIMIT = 15;

export type PlainNavigationLayout = "dots" | "rail";

export function choosePlainNavigationLayout(itemCount: number, availableWidth: number): PlainNavigationLayout {
  if (itemCount <= 1) {
    return "dots";
  }

  if (itemCount > NAV_DOT_ITEM_LIMIT) {
    return "rail";
  }

  if (availableWidth <= 0) {
    return "rail";
  }

  const requiredWidth = NAV_THUMB_WIDTH + (itemCount - 1) * NAV_DOT_SIZE + (itemCount - 1) * NAV_DOT_GAP;
  return requiredWidth <= availableWidth ? "dots" : "rail";
}
