// Documentation: [[documentation/phase-3-top-navigation]]

export const NAV_DOT_SIZE = 6;
export const NAV_DOT_GAP = 3;
export const NAV_THUMB_WIDTH = 15;
export const NAV_DOT_ITEM_LIMIT = 10;

export type PlainNavigationLayout = "dots" | "rail";
export type TopNavigationLayout = PlainNavigationLayout | "preview";
export type TopNavigationConfig = "plain" | "preview";

export function chooseTopNavigationLayout(
  navigation: TopNavigationConfig,
  itemCount: number,
  availableWidth: number,
): TopNavigationLayout {
  if (navigation === "preview") {
    return "preview";
  }

  return choosePlainNavigationLayout(itemCount, availableWidth);
}

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

export function navigationPointerToIndex(itemCount: number, offsetX: number, railWidth: number): number {
  if (itemCount <= 1 || railWidth <= 0) {
    return 0;
  }

  const clampedOffset = Math.min(Math.max(offsetX, 0), railWidth);
  const progress = clampedOffset / railWidth;
  return Math.round(progress * (itemCount - 1));
}
