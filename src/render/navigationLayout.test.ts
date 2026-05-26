import { describe, expect, it } from "vitest";
import {
  choosePlainNavigationLayout,
  NAV_DOT_GAP,
  NAV_DOT_ITEM_LIMIT,
  NAV_DOT_SIZE,
  NAV_THUMB_WIDTH,
} from "./navigationLayout";

describe("choosePlainNavigationLayout", () => {
  it("uses dots when every marker fits with the minimum gap", () => {
    const width = NAV_THUMB_WIDTH + 7 * NAV_DOT_SIZE + 7 * NAV_DOT_GAP;
    expect(choosePlainNavigationLayout(8, width)).toBe("dots");
  });

  it("uses the rail before dots can overlap or shrink", () => {
    const width = NAV_THUMB_WIDTH + 7 * NAV_DOT_SIZE + 7 * NAV_DOT_GAP - 1;
    expect(choosePlainNavigationLayout(8, width)).toBe("rail");
  });

  it("uses the rail when there are more than fifteen items", () => {
    const veryWideContainer = 1000;
    expect(choosePlainNavigationLayout(NAV_DOT_ITEM_LIMIT + 1, veryWideContainer)).toBe("rail");
  });

  it("keeps a single item as a dot layout", () => {
    expect(choosePlainNavigationLayout(1, 0)).toBe("dots");
  });
});
