import { describe, expect, it } from "vitest";
import {
  getGalleryCropKeyboardDirection,
  getGalleryCropZoomDirection,
  getGalleryKeyboardDirection,
  shouldCaptureGalleryKeyboard,
  type GalleryKeyboardState,
} from "./keyboardNavigation";

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

describe("gallery crop keyboard navigation", () => {
  it("maps WASD to crop directions when the widget is active", () => {
    const state = { ...inactiveState, inputActive: true };

    expect(getGalleryCropKeyboardDirection({ key: "w" }, state, false)).toBe("up");
    expect(getGalleryCropKeyboardDirection({ key: "A" }, state, false)).toBe("left");
    expect(getGalleryCropKeyboardDirection({ key: "s" }, state, false)).toBe("down");
    expect(getGalleryCropKeyboardDirection({ key: "D" }, state, false)).toBe("right");
  });

  it("maps physical WASD key codes across keyboard layouts", () => {
    const state = { ...inactiveState, inputActive: true };

    expect(getGalleryCropKeyboardDirection({ key: "ц", code: "KeyW" }, state, false)).toBe("up");
    expect(getGalleryCropKeyboardDirection({ key: "ф", code: "KeyA" }, state, false)).toBe("left");
    expect(getGalleryCropKeyboardDirection({ key: "ы", code: "KeyS" }, state, false)).toBe("down");
    expect(getGalleryCropKeyboardDirection({ key: "в", code: "KeyD" }, state, false)).toBe("right");
  });

  it("does not capture crop keys while text is being edited or modifiers are active", () => {
    const state = { ...inactiveState, inputActive: true };

    expect(getGalleryCropKeyboardDirection({ key: "w" }, state, true)).toBeNull();
    expect(getGalleryCropKeyboardDirection({ key: "w", ctrlKey: true }, state, false)).toBeNull();
  });
});

describe("gallery crop zoom keyboard navigation", () => {
  it("maps vertical arrows to crop zoom", () => {
    const state = { ...inactiveState, inputActive: true };

    expect(getGalleryCropZoomDirection({ key: "ArrowUp" }, state, false)).toBe("in");
    expect(getGalleryCropZoomDirection({ key: "ArrowDown" }, state, false)).toBe("out");
  });

  it("does not capture crop zoom while editing or modifiers are active", () => {
    const state = { ...inactiveState, inputActive: true };

    expect(getGalleryCropZoomDirection({ key: "ArrowUp" }, state, true)).toBeNull();
    expect(getGalleryCropZoomDirection({ key: "ArrowDown", metaKey: true }, state, false)).toBeNull();
  });
});
