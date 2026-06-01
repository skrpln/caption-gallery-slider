// Documentation: [[documentation/keyboard-navigation-backlog]]

export interface GalleryKeyboardState {
  inputActive: boolean;
  pointerInside: boolean;
  fullscreen: boolean;
}

export type GalleryKeyboardDirection = "previous" | "next";

export interface GalleryKeyboardTarget {
  canHandleKeyboard(): boolean;
  nextFromKeyboard(): void;
  previousFromKeyboard(): void;
}

export interface GalleryKeyboardEventLike {
  key: string;
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

function hasKeyboardModifier(event: GalleryKeyboardEventLike): boolean {
  return Boolean(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey);
}
