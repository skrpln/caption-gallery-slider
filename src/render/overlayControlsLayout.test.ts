import { describe, expect, it } from "vitest";
import { chooseOverlayControlsLayout } from "./overlayControlsLayout";

const baseMetrics = {
  viewportWidth: 480,
  viewportHeight: 240,
  videoButtonCount: 3,
  mediaActionCount: 3,
};

describe("overlay controls layout", () => {
  it("keeps all controls in one row when the viewport is wide enough", () => {
    expect(chooseOverlayControlsLayout(baseMetrics)).toBe("normal");
  });

  it("moves buttons to one row and progress below in compact viewports", () => {
    expect(chooseOverlayControlsLayout({
      ...baseMetrics,
      viewportWidth: 260,
    })).toBe("compact");
  });

  it("uses three rows when only one control group fits per row", () => {
    expect(chooseOverlayControlsLayout({
      ...baseMetrics,
      viewportWidth: 170,
      viewportHeight: 180,
    })).toBe("ultra");
  });

  it("hides overlay controls when they would cover more than 60 percent of the viewport", () => {
    expect(chooseOverlayControlsLayout({
      ...baseMetrics,
      viewportWidth: 170,
      viewportHeight: 120,
    })).toBe("hidden");
  });

  it("hides overlay controls when even one compact row cannot fit horizontally", () => {
    expect(chooseOverlayControlsLayout({
      ...baseMetrics,
      viewportWidth: 100,
    })).toBe("hidden");
  });
});
