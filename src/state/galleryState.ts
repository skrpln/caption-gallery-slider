// Documentation: [[documentation/architecture]]

export interface GalleryState {
  currentIndex: number;
  total: number;
}

export function createGalleryState(total: number, initialIndex = 0): GalleryState {
  return {
    total: Math.max(0, total),
    currentIndex: clampIndex(initialIndex, total),
  };
}

export function nextIndex(state: GalleryState): number {
  if (state.total === 0) {
    return 0;
  }

  return (state.currentIndex + 1) % state.total;
}

export function previousIndex(state: GalleryState): number {
  if (state.total === 0) {
    return 0;
  }

  return (state.currentIndex - 1 + state.total) % state.total;
}

export function goToIndex(state: GalleryState, index: number): number {
  return clampIndex(index, state.total);
}

function clampIndex(index: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), total - 1);
}
