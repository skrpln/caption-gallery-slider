import { describe, expect, it } from "vitest";
import { formatVideoProgressTime, videoProgressPointerTime } from "./videoProgressTime";

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
});
