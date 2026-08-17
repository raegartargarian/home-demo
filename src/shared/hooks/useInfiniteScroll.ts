import { useEffect, useRef, useState } from "react";

interface UseInfiniteScrollOptions {
  /** Whether there are more pages to load. */
  hasMore: boolean;
  /** Whether a page is currently being fetched. */
  isLoading: boolean;
  /** Invoked once when the sentinel scrolls into view and a load is allowed. */
  onLoadMore: () => void;
  /** IntersectionObserver rootMargin (default '100px'). */
  rootMargin?: string;
  /** IntersectionObserver threshold (default 0.1). */
  threshold?: number;
  /**
   * Derive a custom scroll root from the sentinel node — e.g. the nearest
   * Radix ScrollArea viewport. Defaults to the browser viewport.
   */
  getRoot?: (sentinel: HTMLDivElement) => Element | null;
}

/**
 * Infinite scroll backed by a SINGLE long-lived IntersectionObserver attached
 * to a sentinel element. The observer reads `hasMore`/`isLoading`/`onLoadMore`
 * through refs, so unrelated re-renders (polling, in-place list patches) can
 * never tear it down or leave it un-armed — the failure mode of the older
 * "observer on the last list item, recreated every fetch" pattern, which could
 * disconnect mid-transition and never re-arm until a full page reload.
 *
 * After each load settles it re-observes the sentinel, so a sentinel that stays
 * continuously in view (a short list that doesn't fill its scroll container)
 * keeps paging until it's pushed out of view or there's nothing more.
 * IntersectionObserver only fires on intersection *changes*, so without this a
 * still-visible sentinel would fire once and stall.
 *
 * Returns a ref callback to spread onto a sentinel <div> rendered at the bottom
 * of the list (only while `hasMore`).
 *
 *   const sentinelRef = useInfiniteScroll({ hasMore, isLoading, onLoadMore });
 *   ...
 *   {hasMore && <div ref={sentinelRef} aria-hidden className="h-px w-full" />}
 */
export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  rootMargin = "100px",
  threshold = 0.1,
  getRoot,
}: UseInfiniteScrollOptions) {
  // The sentinel is held in state (not a ref) so the observer effect re-runs
  // when it mounts/unmounts — it isn't rendered during a first-load skeleton,
  // so the observer must attach once the sentinel appears.
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const hasMoreRef = useRef(hasMore);
  const isLoadingRef = useRef(isLoading);
  const onLoadMoreRef = useRef(onLoadMore);
  const getRootRef = useRef(getRoot);
  // Guards against firing multiple loads before `isLoading` flips to true.
  const loadingMoreRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Keep the refs current for the long-lived observer to read.
  useEffect(() => {
    hasMoreRef.current = hasMore;
    isLoadingRef.current = isLoading;
    onLoadMoreRef.current = onLoadMore;
    getRootRef.current = getRoot;
    // Once a load has started (or there's nothing more) release the guard for
    // the next intersection.
    if (isLoading || !hasMore) loadingMoreRef.current = false;
  }, [hasMore, isLoading, onLoadMore, getRoot]);

  useEffect(() => {
    if (!sentinel) return;

    const root = getRootRef.current?.(sentinel) ?? null;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !isLoadingRef.current &&
          !loadingMoreRef.current
        ) {
          loadingMoreRef.current = true;
          onLoadMoreRef.current();
        }
      },
      { root, rootMargin, threshold }
    );

    observerRef.current = observer;
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [sentinel, rootMargin, threshold]);

  // Re-arm after a load settles. Re-observing a still-intersecting sentinel
  // makes the observer deliver a fresh callback (it measures the post-load
  // layout), so a sentinel that never leaves the viewport keeps paging instead
  // of stalling after the first load.
  useEffect(() => {
    if (isLoading || !hasMore) return;
    const observer = observerRef.current;
    if (!observer || !sentinel) return;
    observer.unobserve(sentinel);
    observer.observe(sentinel);
  }, [isLoading, hasMore, sentinel]);

  return setSentinel;
}
