// Documentation: [[documentation/phase-4-video]]

export function formatVideoProgressTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function videoProgressPointerTime(
  clientX: number,
  railLeft: number,
  railWidth: number,
  duration: number,
): number {
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(railWidth) || railWidth <= 0) {
    return 0;
  }

  const ratio = clamp((clientX - railLeft) / railWidth, 0, 1);
  return ratio * duration;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
