import { describe, expect, it } from "vitest";
import { createGalleryState, goToIndex, nextIndex, previousIndex } from "./galleryState";

describe("gallery state", () => {
  it("wraps next and previous navigation", () => {
    expect(nextIndex(createGalleryState(3, 2))).toBe(0);
    expect(previousIndex(createGalleryState(3, 0))).toBe(2);
  });

  it("clamps direct navigation", () => {
    const state = createGalleryState(3);

    expect(goToIndex(state, -10)).toBe(0);
    expect(goToIndex(state, 10)).toBe(2);
  });

  it("handles empty galleries", () => {
    const state = createGalleryState(0);

    expect(state.currentIndex).toBe(0);
    expect(nextIndex(state)).toBe(0);
    expect(previousIndex(state)).toBe(0);
  });
});
