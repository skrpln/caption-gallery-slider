import { describe, expect, it } from "vitest";
import { getGalleryKeyboardDirection, shouldCaptureGalleryKeyboard, type GalleryKeyboardState } from "./keyboardNavigation";

const inactiveState: GalleryKeyboardState = {
  inputActive: false,
  pointerInside: false,
  fullscreen: false,
};

describe("gallery keyboard navigation", () => {
  it("captures arrows when the widget is active", () => {
    expect(getGalleryKeyboardDirection(
      { key: "ArrowRight" },
      { ...inactiveState, inputActive: true },
      false,
    )).toBe("next");
  });

  it("captures arrows while the pointer is inside the widget", () => {
    expect(getGalleryKeyboardDirection(
      { key: "ArrowLeft" },
      { ...inactiveState, pointerInside: true },
      false,
    )).toBe("previous");
  });

  it("captures arrows in fullscreen even without prior activation", () => {
    expect(shouldCaptureGalleryKeyboard({ ...inactiveState, fullscreen: true })).toBe(true);
    expect(getGalleryKeyboardDirection(
      { key: "ArrowRight" },
      { ...inactiveState, fullscreen: true },
      false,
    )).toBe("next");
  });

  it("does not capture modified arrows", () => {
    expect(getGalleryKeyboardDirection(
      { key: "ArrowRight", metaKey: true },
      { ...inactiveState, inputActive: true },
      false,
    )).toBeNull();
  });

  it("leaves arrows alone while text is being edited", () => {
    expect(getGalleryKeyboardDirection(
      { key: "ArrowLeft" },
      { ...inactiveState, inputActive: true },
      true,
    )).toBeNull();
  });
});
