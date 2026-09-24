import { Button } from "@/components/ui/button";
import { motion, useReducedMotion } from "framer-motion";
import { REDUCED } from "@/shared/constants/motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeb3Auth } from "@/containers/global/Web3AuthProvider";
import { uploadSelectors } from "@/containers/upload/selectors";
import { uploadActions } from "@/containers/upload/slice";
import { uploadTargetFor } from "@/containers/upload/target";
import { useUploadedInto } from "@/containers/upload/useUploadedInto";
import { cn } from "@/lib/utils";
import { Chip } from "@/shared/components/Chip";
import { PageContainer } from "@/shared/components/PageContainer";
import { getStreamAttachments } from "@/shared/providers/api";
import { AlertCircle, Archive, FileText, Layers, Plus } from "lucide-react";
import { groupByProject } from "@/shared/utils/recordLens";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { archivedCountOf } from "./components/archivedCount";
import RecordFilterBar from "./components/RecordFilterBar";
import {
  EMPTY_FILTER,
  filterRecords,
  isFilterActive,
} from "./components/recordFilter";
import StreamTimeline, {
  type StreamGrouping,
} from "./components/StreamTimeline";
import { useRecordFilter } from "./components/useRecordFilter";
import { useVaultContext } from "../vaultDetail/vaultContext";
import { Attachment } from "../vaultDetail/types";
import { previewableFiles } from "../vaultDetail/components/recordFiles";

const PAGE_SIZE = 15;

/**
 * Files are pinned after the record that carries them is filed, so a record can
 * arrive on this page with files that have no CID yet — or a CID the gateway
 * cannot serve for another second or two. Either way the tile falls back to a
 * glyph, and nothing asks again: the load runs on mount and once more when an
 * upload finishes, both of which are over before pinning is.
 *
 * So poll, briefly. Doubling from 3s gives about a minute across four tries,
 * which covers the gap without becoming a background job — and it stops on the
 * first failure rather than retrying into an endpoint that is already unhappy,
 * which is the trap `loadMore` was fixed for.
 */
const PIN_POLL_MS = 3_000;
const MAX_PIN_POLLS = 4;

/**
 * Whether anything the poll could actually fix is still unpinned.
 *
 * Scoped to the first page, because that is what the poll re-fetches. A record
 * further down the list will not be updated by it however many times it asks,
 * and an old record that never pinned at all would otherwise spend the whole
 * budget on every mount.
 */
const awaitingPins = (records: Attachment[]): boolean =>
  records
    .slice(0, PAGE_SIZE)
    .some((record) => previewableFiles(record).some((file) => !file.cid));

/** Fresh file lists for records already on screen, without disturbing the rest.
 *  Never replaces the list: the reader may have paged well past what page one
 *  returns, and rebuilding it under them would lose their place. */
const withFreshFiles = (
  current: Attachment[],
  fresh: Attachment[],
): Attachment[] => {
  const byId = new Map(fresh.map((record) => [record.id, record]));
  return current.map((record) => {
    const updated = byId.get(record.id);
    return updated
      ? { ...record, files: updated.files, status: updated.status }
      : record;
  });
};

/** Project first, because it is what the section now opens on. */
const GROUPINGS: { value: StreamGrouping; label: string }[] = [
  { value: "project", label: "By project" },
  { value: "date", label: "By date" },
];

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
  // Spent poll attempts, reset by the loader below so a new upload gets a
  // fresh budget rather than inheriting an exhausted one.
  const [pinPolls, setPinPolls] = useState(0);

  // Archived records are out of the section by default. Asking for them adds
  // them to the list — the backend has no archived-only view — and every fetch
  // on this page has to ask the same way, or paging would mix two lists.
  const [showArchived, setShowArchived] = useState(false);
  // How many there are to show, which decides whether to offer the switch at
  // all: a section with nothing archived should not advertise a view of
  // nothing. Null until counted; a failed count keeps the last answer.
  const [archivedCount, setArchivedCount] = useState<number | null>(null);
  const archivedFilter = showArchived ? true : undefined;

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
    setPinPolls(0);
    setIsFetching(true);
    getStreamAttachments(code, 1, PAGE_SIZE, archivedFilter)
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
  }, [code, reloadKey, archivedFilter]);

  // Counted on the same occasions the list is loaded — arrival, an upload
  // landing, the switch changing — and never as part of the list request,
  // because it is two extra one-item pages the list itself does not need.
  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    Promise.all([
      getStreamAttachments(code, 1, 1, true),
      getStreamAttachments(code, 1, 1),
    ])
      .then(([everything, liveOnly]) => {
        if (cancelled) return;
        const count = archivedCountOf(everything, liveOnly);
        if (count !== null) setArchivedCount(count);
      })
      .catch((error) => {
        // Best effort: the switch simply does not appear until a count lands.
        console.error("Failed to count archived records:", error);
      });
    return () => {
      cancelled = true;
    };
  }, [code, reloadKey, archivedFilter]);

  /**
   * The next page, with no opinion about whether it should be asked for.
   *
   * Kept separate from `loadMore` so a retry can ask again after a failure —
   * `hasMore` is closed by `loadError`, which is what stops the sentinel
   * looping, and a retry that respected it could never fire.
   */
  const fetchNextPage = useCallback(async () => {
    if (isFetching || !code) return;
    const next = page + 1;
    if (totalPages !== null && next > totalPages) return;

    setIsFetching(true);
    try {
      const res = await getStreamAttachments(
        code,
        next,
        PAGE_SIZE,
        archivedFilter,
      );
      setAttachments((prev) => [...prev, ...(res.data?.content || [])]);
      setPage(res.data?.current_page ?? next);
      setTotalPages(res.data?.total_pages ?? totalPages);
      setLoadError(null);
    } catch (error) {
      console.error("Failed to load attachments:", error);
      setLoadError("The rest of this section could not be loaded.");
    } finally {
      setIsFetching(false);
    }
  }, [code, page, isFetching, totalPages, archivedFilter]);

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    void fetchNextPage();
  }, [hasMore, fetchNextPage]);

  /** Clears the failure and asks again from where the paging stopped. */
  const retryPaging = useCallback(() => {
    setLoadError(null);
    void fetchNextPage();
  }, [fetchNextPage]);

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

  // The job the work belonged to, or time. The job leads: a person looking for
  // one document remembers when it happened, but a person opening a section is
  // usually after a whole piece of work, and by date its paperwork is scattered
  // down as many headings as the work took months.
  //
  // Held as "not chosen yet" rather than as a default value, because whether
  // the job even *can* lead depends on data that arrives after the first
  // render. Once someone picks, their pick stands whatever loads next.
  const [chosen, setChosen] = useState<StreamGrouping | null>(null);
  const reduceMotion = useReducedMotion();

  const visible = useMemo(
    () => filterRecords(attachments, filter),
    [attachments, filter],
  );

  // Offered as soon as one record names a project. It used to wait for a second
  // project, on the reasoning that one heading over everything says nothing —
  // but the heading is the only place this page says the project's name, so a
  // first project filed under "September 2026" read as the name having been
  // lost, and then turned up the moment a second project was added.
  const hasProjects = useMemo(
    () => groupByProject(attachments).some((group) => group.key),
    [attachments],
  );

  // A filter over a half-loaded section under-reports without saying so, which
  // is the same trap the Projects lens fell into. Same answer as
  // `useVaultRecords`' `loadAll`: once a filter is on, pull the rest of the
  // section in rather than filtering the first page and calling it the answer.
  //
  // Grouping by project needs the same treatment for the same reason. A project
  // heading that says "3 files" over a section still loading page two is a
  // count the next page disproves — worse than a date heading getting longer,
  // because the reader takes it as the whole job.
  // A section of legacy names has no project to lead with, so date leads
  // there: the switch is not even drawn.
  const grouping: StreamGrouping = chosen ?? (hasProjects ? "project" : "date");

  const pendingPins = useMemo(() => awaitingPins(attachments), [attachments]);

  useEffect(() => {
    if (!code || !pendingPins || loadError || pinPolls >= MAX_PIN_POLLS) return;

    const timer = setTimeout(
      () => {
        getStreamAttachments(code, 1, PAGE_SIZE, archivedFilter)
          .then((res) => {
            const fresh: Attachment[] = res.data?.content ?? [];
            setAttachments((prev) => withFreshFiles(prev, fresh));
          })
          .catch((error) => {
            // One failure ends it. A gateway that is refusing now is not going
            // to be talked round by three more requests.
            console.error("Failed to refresh pinned files:", error);
            setPinPolls(MAX_PIN_POLLS);
          })
          .finally(() =>
            setPinPolls((spent) => Math.min(spent + 1, MAX_PIN_POLLS)),
          );
      },
      PIN_POLL_MS * 2 ** pinPolls,
    );

    return () => clearTimeout(timer);
  }, [code, pendingPins, loadError, pinPolls, archivedFilter]);

  const pullingAll = filtering || grouping === "project";
  useEffect(() => {
    if (pullingAll && hasMore && !isFetching) loadMore();
  }, [pullingAll, hasMore, isFetching, loadMore]);

  // Offered once there is something to show — or while it is on, so switching
  // the last archived record back to live does not make the switch vanish
  // from under the cursor.
  const offerArchived = (archivedCount ?? 0) > 0 || showArchived;

  const isFirstLoad = isFetching && attachments.length === 0;
  const retry = () => {
    setLoadError(null);
    setReloadKey((key) => key + 1);
  };
  return (
    <PageContainer measure="inherit">
      {/* The section's own heading line: what is in it, and how much. The
          house, the way out, the provenance and the Add-record button all
          belong to `VaultShell`, which stays mounted while you move between
          sections. */}
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 className="text-lg font-medium tracking-tight text-ink">Records</h2>
        <div className="flex flex-wrap items-center gap-4">
          {offerArchived && (
            <Chip
              label="Show archived"
              icon={Archive}
              tone="warn"
              size="md"
              count={archivedCount ?? undefined}
              pressed={showArchived}
              onToggle={() => setShowArchived((on) => !on)}
              title="Archived records stay in the vault, out of the section's way. Show them alongside the rest."
            />
          )}
          {hasProjects && (
            <div
              role="group"
              aria-label="Group records by"
              className="flex items-center gap-0.5 rounded-full border border-line bg-surface-raised p-0.5"
            >
              {GROUPINGS.map((option) => {
                const isActive = grouping === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setChosen(option.value)}
                    aria-pressed={isActive}
                    className={cn(
                      "relative rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      isActive
                        ? "text-ink"
                        : "text-ink-subtle hover:text-ink-muted",
                    )}
                  >
                    {/* The fill is one element that moves, not two that
                        cross-fade. The same shared-layout pill the header nav
                        uses for the same job, so the app has one idea of what
                        "the selected one of these" looks like — and a spring
                        rather than a curve because this is reversible: click
                        back before it settles and it carries its velocity
                        through instead of restarting. */}
                    {isActive && (
                      <motion.span
                        layoutId="grouping-pill"
                        className="absolute inset-0 rounded-full bg-surface-inset"
                        transition={
                          reduceMotion
                            ? REDUCED
                            : { type: "spring", stiffness: 400, damping: 32 }
                        }
                      />
                    )}
                    <span className="relative">{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}
          {totalRecords != null && (
            <span className="flex items-center gap-1.5 text-sm text-ink-subtle">
              <FileText className="h-3.5 w-3.5" aria-hidden />
              {/* While a filter is on, the section total on its own is a number
                  that contradicts the page under it. Say both — but only once
                  the whole section has arrived, since a filter counted over a
                  half-loaded list is the under-report this page already goes
                  out of its way to avoid. */}
              {filtering && !hasMore && !isFetching
                ? `${visible.length} of ${totalRecords} record${totalRecords !== 1 ? "s" : ""}`
                : `${totalRecords} record${totalRecords !== 1 ? "s" : ""}`}
            </span>
          )}
        </div>
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
            /* True only while something is genuinely pulling the rest in —
               otherwise the bar announces a wait that is not happening. */
            isLoading={isFetching && pullingAll}
            className="mb-5"
          />

          {/* Only once the section has finished arriving. A filter pulls
                the remaining pages in, and "nothing matches" announced over a
                half-loaded section is a claim the next page can disprove. */}
          {/* A page that failed after the first one used to leave no trace:
              the list simply stopped, `hasMore` closed behind it, and a section
              showing 15 of 60 records read exactly like a section holding 15.
              That matters more than an unloaded page usually would, because the
              filter counts and the project headings below are computed over
              whatever arrived and presented as the whole answer. */}
          {loadError && attachments.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">
                {loadError} Showing the {attachments.length} loaded so far
                {totalRecords != null ? ` of ${totalRecords}` : ""}.
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={retryPaging}
                disabled={isFetching}
              >
                Try again
              </Button>
            </div>
          )}

          {visible.length === 0 && !hasMore && !isFetching && !loadError ? (
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
                onClick={() => setFilter(EMPTY_FILTER)}
                className="mt-4"
              >
                Clear the filter
              </Button>
            </div>
          ) : (
            <StreamTimeline
              records={visible}
              grouping={grouping}
              /* A filter — or the project grouping — loads the whole section
                   itself, so the sentinel would only race it. */
              hasMore={hasMore && !pullingAll}
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
