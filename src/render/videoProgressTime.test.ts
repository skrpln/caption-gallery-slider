import { describe, expect, it } from "vitest";
import {
  clampVideoRangeEdge,
  formatVideoProgressTime,
  normalizeVideoTimeRange,
  videoProgressPointerTime,
  videoTimeToProgress,
} from "./videoProgressTime";

describe("video progress time", () => {
  it("formats seconds as mm:ss", () => {
    expect(formatVideoProgressTime(0)).toBe("00:00");
    expect(formatVideoProgressTime(7.9)).toBe("00:07");
    expect(formatVideoProgressTime(65)).toBe("01:05");
    expect(formatVideoProgressTime(3723)).toBe("62:03");
  });

  it("falls back to zero for invalid time", () => {
    expect(formatVideoProgressTime(Number.NaN)).toBe("00:00");
    expect(formatVideoProgressTime(-4)).toBe("00:00");
  });

  it("maps pointer x to a clamped video time", () => {
    expect(videoProgressPointerTime(150, 100, 200, 120)).toBe(30);
    expect(videoProgressPointerTime(40, 100, 200, 120)).toBe(0);
    expect(videoProgressPointerTime(360, 100, 200, 120)).toBe(120);
  });

  it("returns zero when duration or rail width is unavailable", () => {
    expect(videoProgressPointerTime(150, 100, 0, 120)).toBe(0);
    expect(videoProgressPointerTime(150, 100, 200, Number.NaN)).toBe(0);
  });

  it("normalizes optional playback range values", () => {
    expect(normalizeVideoTimeRange(120, null, null)).toEqual({ start: 0, end: 120 });
    expect(normalizeVideoTimeRange(120, 10, 40)).toEqual({ start: 10, end: 40 });
    expect(normalizeVideoTimeRange(120, -10, 200)).toEqual({ start: 0, end: 120 });
  });

  it("keeps range edges from crossing", () => {
    const range = { start: 10, end: 20 };

    expect(clampVideoRangeEdge("start", 30, range, 120)).toBe(19.75);
    expect(clampVideoRangeEdge("end", 5, range, 120)).toBe(10.25);
  });

  it("maps absolute time to rail progress", () => {
    expect(videoTimeToProgress(30, 120)).toBe(0.25);
    expect(videoTimeToProgress(-10, 120)).toBe(0);
    expect(videoTimeToProgress(140, 120)).toBe(1);
  });
});
