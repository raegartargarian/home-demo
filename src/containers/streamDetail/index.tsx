import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeb3Auth } from "@/containers/global/Web3AuthProvider";
import { uploadSelectors } from "@/containers/upload/selectors";
import { uploadActions } from "@/containers/upload/slice";
import { uploadTargetFor } from "@/containers/upload/target";
import { useUploadedInto } from "@/containers/upload/useUploadedInto";
import { PageContainer } from "@/shared/components/PageContainer";
import { getStreamAttachments } from "@/shared/providers/api";
import { AlertCircle, FileText, Layers, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import RecordFilterBar from "./components/RecordFilterBar";
import { filterRecords, isFilterActive } from "./components/recordFilter";
import StreamTimeline from "./components/StreamTimeline";
import { useRecordFilter } from "./components/useRecordFilter";
import { useVaultContext } from "../vaultDetail/vaultContext";
import { Attachment } from "../vaultDetail/types";

const PAGE_SIZE = 15;

const StreamDetail = () => {
  const { id, code } = useParams<{ id: string; code: string }>();
  const dispatch = useDispatch();
  const { vault, stream } = useVaultContext();
  const { isAuthenticated } = useWeb3Auth() || {};

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [totalRecords, setTotalRecords] = useState<number | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  // Bumped when a record is filed into this stream, to re-run the loader below.
  const [reloadKey, setReloadKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  // null totalPages = not yet loaded; treat as "no more" until the first page
  // resolves so the sentinel doesn't fire before we know the page count.
  //
  // `loadError` closes it too, and that is not politeness. A failed page leaves
  // `page` and `totalPages` untouched, so without this the sentinel re-arms on
  // the next render, calls `loadMore` again, fails again — an unbounded loop
  // against an endpoint that is already unhappy. One failure stops the paging
  // until something asks again.
  const hasMore = totalPages !== null && page < totalPages && !loadError;

  // Reset + load the first page whenever the stream changes.
  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    setAttachments([]);
    setPage(0);
    setTotalPages(null);
    setTotalRecords(null);
    setLoadError(null);
    setIsFetching(true);
    getStreamAttachments(code, 1, PAGE_SIZE)
      .then((res) => {
        if (cancelled) return;
        setAttachments(res.data?.content || []);
        setPage(res.data?.current_page ?? 1);
        setTotalPages(res.data?.total_pages ?? 1);
        setTotalRecords(res.data?.total_records ?? null);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load attachments:", error);
        setLoadError("This section's records could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setIsFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code, reloadKey]);

  const loadMore = useCallback(async () => {
    if (isFetching || !hasMore || !code) return;
    const next = page + 1;
    setIsFetching(true);
    try {
      const res = await getStreamAttachments(code, next, PAGE_SIZE);
      setAttachments((prev) => [...prev, ...(res.data?.content || [])]);
      setPage(res.data?.current_page ?? next);
      setTotalPages(res.data?.total_pages ?? totalPages);
    } catch (error) {
      console.error("Failed to load attachments:", error);
      setLoadError("The rest of this section could not be loaded.");
    } finally {
      setIsFetching(false);
    }
  }, [code, page, hasMore, isFetching, totalPages]);

  useUploadedInto([code], () => setReloadKey((key) => key + 1));

  const uploadTarget = useMemo(
    () =>
      isAuthenticated && stream && id
        ? uploadTargetFor(id, stream, vault.ledger)
        : null,
    [isAuthenticated, stream, id, vault.ledger],
  );
  const isFiling = useSelector(uploadSelectors.isFiling);
  const openUpload = () =>
    uploadTarget && dispatch(uploadActions.openUpload(uploadTarget));

  const [filter, setFilter] = useRecordFilter();
  const filtering = isFilterActive(filter);

  const visible = useMemo(
    () => filterRecords(attachments, filter),
    [attachments, filter],
  );

  // A filter over a half-loaded section under-reports without saying so, which
  // is the same trap the Projects lens fell into. Same answer as
  // `useVaultRecords`' `loadAll`: once a filter is on, pull the rest of the
  // section in rather than filtering the first page and calling it the answer.
  useEffect(() => {
    if (filtering && hasMore && !isFetching) loadMore();
  }, [filtering, hasMore, isFetching, loadMore]);

  const isFirstLoad = isFetching && attachments.length === 0;
  const retry = () => {
    setLoadError(null);
    setReloadKey((key) => key + 1);
  };
  return (
    <PageContainer measure="wide">
      {/* The section's own heading line: what is in it, and how much. The
          house, the way out, the provenance and the Add-record button all
          belong to `VaultShell`, which stays mounted while you move between
          sections. */}
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 className="text-lg font-medium tracking-tight text-ink">Records</h2>
        {totalRecords != null && (
          <span className="flex items-center gap-1.5 text-sm text-ink-subtle">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            {totalRecords} record{totalRecords !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Records */}
      {loadError && attachments.length === 0 ? (
        // A failed load used to render the "no records yet" empty state, which
        // says the section is empty when what happened is that nobody could
        // tell. Say which it was, and offer the retry that the paging no longer
        // does by itself.
        <div className="rounded-xl border border-line bg-surface-raised p-12 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-ink-subtle" />
          <h3 className="mb-1 text-base font-medium tracking-tight text-ink">
            Could not load this section
          </h3>
          <p className="text-sm text-ink-muted">{loadError}</p>
          <Button size="sm" variant="outline" onClick={retry} className="mt-4">
            Try again
          </Button>
        </div>
      ) : isFirstLoad ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="aspect-[4/3] w-full rounded-lg bg-surface-inset"
            />
          ))}
        </div>
      ) : attachments.length === 0 ? (
        <div className="bg-surface-raised rounded-xl border border-line p-12 text-center">
          <Layers className="w-10 h-10 text-ink-subtle mx-auto mb-3" />
          <h3 className="text-base font-medium tracking-tight text-ink mb-1">
            No home records yet
          </h3>
          <p className="text-sm text-ink-muted">
            Records will appear here once documentation is uploaded.
          </p>
          {uploadTarget && (
            <Button
              size="sm"
              disabled={isFiling}
              onClick={openUpload}
              className="mt-4"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add the first record
            </Button>
          )}
        </div>
      ) : (
        <>
          <RecordFilterBar
            records={attachments}
            filter={filter}
            onChange={setFilter}
            isLoading={isFetching}
            className="mb-5"
          />

          {/* Only once the section has finished arriving. A filter pulls
                the remaining pages in, and "nothing matches" announced over a
                half-loaded section is a claim the next page can disprove. */}
          {visible.length === 0 && !hasMore && !isFetching ? (
            <div className="rounded-xl border border-line bg-surface-raised p-12 text-center">
              <Layers className="mx-auto mb-3 h-10 w-10 text-ink-subtle" />
              <h3 className="mb-1 text-base font-medium tracking-tight text-ink">
                Nothing matches this filter
              </h3>
              <p className="text-sm text-ink-muted">
                Every record in this section is still here — just none filed the
                way you asked for.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFilter({ facets: [], rooms: [] })}
                className="mt-4"
              >
                Clear the filter
              </Button>
            </div>
          ) : (
            <StreamTimeline
              records={visible}
              /* A filter loads the whole section itself, so the sentinel
                   would only race it. */
              hasMore={hasMore && !filtering}
              isLoading={isFetching && attachments.length > 0}
              onLoadMore={loadMore}
            />
          )}
        </>
      )}
    </PageContainer>
  );
};

export default StreamDetail;
