// Documentation: [[documentation/phase-4-video]]

export interface VideoTimeRange {
  start: number;
  end: number;
}

const MIN_VIDEO_RANGE_SECONDS = 0.25;

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

export function normalizeVideoTimeRange(
  duration: number,
  start: number | null,
  end: number | null,
): VideoTimeRange {
  if (!Number.isFinite(duration) || duration <= 0) {
    return { start: 0, end: 0 };
  }

  const minRange = getMinVideoRange(duration);
  const normalizedStart = Number.isFinite(start)
    ? clamp(start ?? 0, 0, Math.max(0, duration - minRange))
    : 0;
  const normalizedEnd = Number.isFinite(end)
    ? clamp(end ?? duration, minRange, duration)
    : duration;

  if (normalizedEnd - normalizedStart >= minRange) {
    return { start: normalizedStart, end: normalizedEnd };
  }

  if (end !== null && start === null) {
    return {
      start: clamp(normalizedEnd - minRange, 0, duration - minRange),
      end: normalizedEnd,
    };
  }

  return {
    start: normalizedStart,
    end: clamp(normalizedStart + minRange, minRange, duration),
  };
}

export function clampVideoRangeEdge(
  edge: "start" | "end",
  nextTime: number,
  range: VideoTimeRange,
  duration: number,
): number {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  const minRange = getMinVideoRange(duration);
  if (edge === "start") {
    return clamp(nextTime, 0, Math.max(0, range.end - minRange));
  }

  return clamp(nextTime, Math.min(duration, range.start + minRange), duration);
}

export function videoTimeToProgress(time: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  return clamp(time / duration, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getMinVideoRange(duration: number): number {
  return Math.min(MIN_VIDEO_RANGE_SECONDS, duration);
}
