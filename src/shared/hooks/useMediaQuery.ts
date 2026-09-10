import { useCallback, useMemo, useSyncExternalStore } from "react";

/** A `matchMedia` that survives a server or a test environment without one. */
const listFor = (query: string): MediaQueryList | null =>
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia(query)
    : null;

/**
 * Subscribes to a CSS media query from JavaScript.
 *
 * This exists because some choices genuinely cannot be made in CSS. The landing
 * hero picks between two video encodes, and `<source media="…">` does not help:
 * the `media` attribute is only honoured inside `<picture>`, and browsers ignore
 * it on `<video>` — a phone would silently download the desktop cut. Nor does
 * hiding one of two `<video>` elements work, because a hidden element is still
 * mounted and still fetches. The element that should not load has to not exist,
 * and that is a render-time decision.
 *
 * `useSyncExternalStore` rather than `useState` and an effect: it reads the
 * current match during render, so the first paint is already correct instead of
 * flipping on the first commit — which for a video source would mean fetching
 * the wrong file and then fetching the right one.
 */
export const useMediaQuery = (query: string): boolean => {
  const list = useMemo(() => listFor(query), [query]);

  const subscribe = useCallback(
    (onChange: () => void) => {
      list?.addEventListener("change", onChange);
      return () => list?.removeEventListener("change", onChange);
    },
    [list],
  );

  // Without a `matchMedia` there is nothing to match, so both snapshots agree
  // on `false` and the caller renders its narrow case.
  const getSnapshot = useCallback(() => list?.matches ?? false, [list]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
};

export default useMediaQuery;
