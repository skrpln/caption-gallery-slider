import { describe, expect, it } from "vitest";
import {
  choosePlainNavigationLayout,
  chooseTopNavigationLayout,
  navigationPointerToIndex,
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

  it("uses the rail when there are more than ten items", () => {
    const veryWideContainer = 1000;
    expect(choosePlainNavigationLayout(NAV_DOT_ITEM_LIMIT + 1, veryWideContainer)).toBe("rail");
  });

  it("keeps a single item as a dot layout", () => {
    expect(choosePlainNavigationLayout(1, 0)).toBe("dots");
  });
});

describe("chooseTopNavigationLayout", () => {
  it("keeps preview navigation in thumbnail mode", () => {
    expect(chooseTopNavigationLayout("preview", 24, 0)).toBe("preview");
  });

  it("delegates plain navigation to dots or rail", () => {
    expect(chooseTopNavigationLayout("plain", NAV_DOT_ITEM_LIMIT + 1, 1000)).toBe("rail");
  });
});

describe("navigationPointerToIndex", () => {
  it("maps the rail midpoint to the nearest item index", () => {
    expect(navigationPointerToIndex(5, 50, 100)).toBe(2);
  });

  it("clamps pointer positions outside the rail", () => {
    expect(navigationPointerToIndex(5, -20, 100)).toBe(0);
    expect(navigationPointerToIndex(5, 140, 100)).toBe(4);
  });

  it("keeps empty and single-item rails at the first index", () => {
    expect(navigationPointerToIndex(0, 50, 100)).toBe(0);
    expect(navigationPointerToIndex(1, 50, 100)).toBe(0);
  });
});
