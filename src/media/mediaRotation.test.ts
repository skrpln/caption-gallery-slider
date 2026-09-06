import { describe, expect, it } from "vitest";
import { clockwiseRotationAngle, counterclockwiseRotationAngle, normalizeRotation } from "./mediaRotation";

describe("media rotation", () => {
  it("normalizes any angle to a quarter turn", () => {
    expect(normalizeRotation(0)).toBe(0);
    expect(normalizeRotation(270)).toBe(270);
    expect(normalizeRotation(360)).toBe(0);
    expect(normalizeRotation(450)).toBe(90);
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(Number.NaN)).toBe(0);
  });

  it("keeps turning clockwise across the 270 to 0 wrap", () => {
    expect(clockwiseRotationAngle(0, 90)).toBe(90);
    expect(clockwiseRotationAngle(180, 270)).toBe(270);
    expect(clockwiseRotationAngle(270, 0)).toBe(360);
    expect(clockwiseRotationAngle(360, 90)).toBe(450);
    expect(clockwiseRotationAngle(450, 0)).toBe(720);
  });

  it("leaves the angle alone when the rotation is already shown", () => {
    expect(clockwiseRotationAngle(90, 90)).toBe(90);
    expect(clockwiseRotationAngle(450, 90)).toBe(450);
    expect(clockwiseRotationAngle(0, 0)).toBe(0);
  });

  it("turns forward to a stored rotation on load", () => {
    expect(clockwiseRotationAngle(0, 270)).toBe(270);
  });

  it("turns back counter-clockwise to undo an unsaved quarter", () => {
    expect(counterclockwiseRotationAngle(90, 0)).toBe(0);
    expect(counterclockwiseRotationAngle(360, 270)).toBe(270);
    expect(counterclockwiseRotationAngle(450, 0)).toBe(360);
    expect(counterclockwiseRotationAngle(180, 180)).toBe(180);
    expect(counterclockwiseRotationAngle(180, 0)).toBe(0);
  });
});
