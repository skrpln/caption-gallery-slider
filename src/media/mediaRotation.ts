// Documentation: [[documentation/phase-2-captions]], [[documentation/crop-controls]]

/** Snaps any angle to the persisted form: 0, 90, 180 or 270. */
export function normalizeRotation(rotation: number): number {
  if (!Number.isFinite(rotation)) {
    return 0;
  }

  const quarterTurns = Math.round(rotation / 90);
  return ((quarterTurns * 90) % 360 + 360) % 360;
}

/**
 * Picks the angle to render so that the CSS transition from `currentAngle`
 * to `targetRotation` always turns clockwise. The rendered angle keeps
 * growing past 360, because jumping from 270deg straight to 0deg would spin
 * the media three quarters back instead of one quarter forward.
 */
export function clockwiseRotationAngle(currentAngle: number, targetRotation: number): number {
  const current = Number.isFinite(currentAngle) ? currentAngle : 0;
  const delta = ((normalizeRotation(targetRotation) - normalizeRotation(current)) % 360 + 360) % 360;
  return current + delta;
}

/**
 * Picks the angle to render so that the transition from `currentAngle` back
 * to `targetRotation` turns counter-clockwise. Used to undo a quarter turn
 * that could not be stored.
 */
export function counterclockwiseRotationAngle(currentAngle: number, targetRotation: number): number {
  const current = Number.isFinite(currentAngle) ? currentAngle : 0;
  const delta = ((normalizeRotation(current) - normalizeRotation(targetRotation)) % 360 + 360) % 360;
  return current - delta;
}
