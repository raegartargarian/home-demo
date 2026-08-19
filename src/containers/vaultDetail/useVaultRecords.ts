import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { vaultDetailSelectors } from "./selectors";
import { vaultDetailActions } from "./slice";

/**
 * A vault with more history than this is past what a client-side lens should be
 * grouping anyway — at that point the grouping belongs on the backend.
 */
const MAX_PAGES = 10;

/**
 * The vault's records as one set, across every section.
 *
 * `loadAll` is for callers that group or count: a partial page read in date
 * order is simply the recent past and is honest, but anything that gathers
 * records into buckets is wrong until the whole vault has arrived — the bucket
 * whose second half landed on page 2 shows up missing half of itself.
 */
export const useVaultRecords = (vaultId?: string, loadAll = false) => {
  const dispatch = useDispatch();
  const { items, currentPage, totalPages, isLoading } = useSelector(
    vaultDetailSelectors.records
  );

  const lastPage = Math.min(totalPages ?? Infinity, MAX_PAGES);
  const hasMore = totalPages !== null && currentPage < totalPages;

  const loadMore = useCallback(() => {
    if (!vaultId || isLoading || !hasMore) return;
    dispatch(
      vaultDetailActions.fetchVaultRecordsStart({
        vaultId,
        page: currentPage + 1,
      })
    );
  }, [vaultId, isLoading, hasMore, currentPage, dispatch]);

  // First page, once per vault.
  useEffect(() => {
    if (!vaultId || isLoading || currentPage !== 0) return;
    dispatch(vaultDetailActions.fetchVaultRecordsStart({ vaultId, page: 1 }));
  }, [vaultId, currentPage, isLoading, dispatch]);

  // Remaining pages, only where a partial set would be misleading.
  useEffect(() => {
    if (!loadAll || !vaultId || isLoading) return;
    if (currentPage === 0 || currentPage >= lastPage) return;
    dispatch(
      vaultDetailActions.fetchVaultRecordsStart({
        vaultId,
        page: currentPage + 1,
      })
    );
  }, [loadAll, vaultId, currentPage, lastPage, isLoading, dispatch]);

  return {
    records: items,
    isLoading,
    hasMore,
    loadMore,
    /** True once every page the lens is allowed to load has arrived. */
    isComplete: currentPage > 0 && currentPage >= lastPage,
    /**
     * True when the vault is longer than `MAX_PAGES` — so `isComplete` means
     * "loaded all it may", not "loaded all there is", and any grouping over
     * these records is missing the older history. A lens that groups has to say
     * so rather than presenting a partial set as the whole vault.
     */
    isTruncated: totalPages !== null && totalPages > MAX_PAGES,
  };
};
