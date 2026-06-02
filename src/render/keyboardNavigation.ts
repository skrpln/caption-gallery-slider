// Documentation: [[documentation/keyboard-navigation-backlog]]

export interface GalleryKeyboardState {
  inputActive: boolean;
  pointerInside: boolean;
  fullscreen: boolean;
}

export type GalleryKeyboardDirection = "previous" | "next";
export type GalleryCropKeyboardDirection = "up" | "left" | "down" | "right";
export type GalleryCropZoomDirection = "in" | "out";

export interface GalleryKeyboardTarget {
  canHandleKeyboard(): boolean;
  nextFromKeyboard(): void;
  previousFromKeyboard(): void;
  panCropFromKeyboard?(direction: GalleryCropKeyboardDirection): boolean;
  zoomCropFromKeyboard?(direction: GalleryCropZoomDirection): boolean;
}

export interface GalleryKeyboardEventLike {
  key: string;
  code?: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}

export function shouldCaptureGalleryKeyboard(state: GalleryKeyboardState): boolean {
  return state.inputActive || state.pointerInside || state.fullscreen;
}

export function getGalleryKeyboardDirection(
  event: GalleryKeyboardEventLike,
  state: GalleryKeyboardState,
  textEditingActive: boolean,
): GalleryKeyboardDirection | null {
  if (!shouldCaptureGalleryKeyboard(state) || textEditingActive || hasKeyboardModifier(event)) {
    return null;
  }

  if (event.key === "ArrowLeft") {
    return "previous";
  }

  if (event.key === "ArrowRight") {
    return "next";
  }

  return null;
}

export function getGalleryCropKeyboardDirection(
  event: GalleryKeyboardEventLike,
  state: GalleryKeyboardState,
  textEditingActive: boolean,
): GalleryCropKeyboardDirection | null {
  if (!shouldCaptureGalleryKeyboard(state) || textEditingActive || hasKeyboardModifier(event)) {
    return null;
  }

  switch (event.code || event.key.toLowerCase()) {
    case "KeyW":
    case "w":
      return "up";
    case "KeyA":
    case "a":
      return "left";
    case "KeyS":
    case "s":
      return "down";
    case "KeyD":
    case "d":
      return "right";
    default:
      return null;
  }
}

export function getGalleryCropZoomDirection(
  event: GalleryKeyboardEventLike,
  state: GalleryKeyboardState,
  textEditingActive: boolean,
): GalleryCropZoomDirection | null {
  if (!shouldCaptureGalleryKeyboard(state) || textEditingActive || hasKeyboardModifier(event)) {
    return null;
  }

  if (event.key === "ArrowUp") {
    return "in";
  }

  if (event.key === "ArrowDown") {
    return "out";
  }

  return null;
}

function hasKeyboardModifier(event: GalleryKeyboardEventLike): boolean {
  return Boolean(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey);
}
