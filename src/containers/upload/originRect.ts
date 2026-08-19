/** A snapshot of where something sat on screen, in viewport coordinates. */
export type OriginRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Measure an element so the tray card can fly out of it.
 *
 * Taken at submit time, while the button is still on screen: by the time the
 * card mounts, the form that owned the button is already gone.
 */
export const captureRect = (
  el: HTMLElement | null | undefined,
): OriginRect | undefined => {
  if (!el) return undefined;
  const rect = el.getBoundingClientRect();
  return {
    x: rect.x,
    y: rect.y,
    width: Math.max(1, rect.width),
    height: Math.max(1, rect.height),
  };
};
