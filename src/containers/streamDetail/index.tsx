import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeb3Auth } from "@/containers/global/Web3AuthProvider";
import { uploadSelectors } from "@/containers/upload/selectors";
import { uploadActions } from "@/containers/upload/slice";
import { uploadTargetFor } from "@/containers/upload/target";
import { useUploadedInto } from "@/containers/upload/useUploadedInto";
import { PageHeader } from "@/shared/components/PageHeader";
import { ProvenanceDetails } from "@/shared/components/ProvenanceDetails";
import { TransferBadge } from "@/shared/components/TransferBadge";
import { getStreamAttachments } from "@/shared/providers/api";
import { NETWORK_SERVER_NAMES } from "@/shared/utils/networks";
import { getStatusConfig } from "@/shared/utils/statusConfig";
import {
  categoryForStream,
  formatStreamName,
} from "@/shared/utils/streamHelpers";
import { vaultDetailPath } from "@/shared/constants/routes";
import { viewTXInExplorer } from "@/shared/utils/viewVaultInExplorer";
import {
  ChevronLeft,
  ExternalLink,
  FileText,
  Layers,
  Plus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import RecordFilterBar from "./components/RecordFilterBar";
import { filterRecords, isFilterActive } from "./components/recordFilter";
import StreamTimeline from "./components/StreamTimeline";
import { useRecordFilter } from "./components/useRecordFilter";
import { vaultDetailSelectors } from "../vaultDetail/selectors";
import { vaultDetailActions } from "../vaultDetail/slice";
import { Attachment } from "../vaultDetail/types";
import { PageContainer } from "@/shared/components/PageContainer";

const PAGE_SIZE = 15;

const StreamDetail = () => {
  const { id, code } = useParams<{ id: string; code: string }>();
  const dispatch = useDispatch();
  const vault = useSelector(vaultDetailSelectors.vault);
  const { isAuthenticated } = useWeb3Auth() || {};

  // Ensure the vault is loaded so the header can show stream metadata
  // (name, status, verification) — e.g. on a hard refresh / deep link.
  useEffect(() => {
    if (id && vault?.id !== id) {
      dispatch(vaultDetailActions.fetchVaultDetailStart({ id }));
    }
  }, [id, vault?.id, dispatch]);

  const stream = vault?.streams?.find((s) => s.asset_code === code);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [totalRecords, setTotalRecords] = useState<number | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  // Bumped when a record is filed into this stream, to re-run the loader below.
  const [reloadKey, setReloadKey] = useState(0);

  // null totalPages = not yet loaded; treat as "no more" until the first page
  // resolves so the sentinel doesn't fire before we know the page count.
  const hasMore = totalPages !== null && page < totalPages;

  // Reset + load the first page whenever the stream changes.
  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    setAttachments([]);
    setPage(0);
    setTotalPages(null);
    setTotalRecords(null);
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
        if (!cancelled) console.error("Failed to load attachments:", error);
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
    } finally {
      setIsFetching(false);
    }
  }, [code, page, hasMore, isFetching, totalPages]);

  useUploadedInto([code], () => setReloadKey((key) => key + 1));

  const uploadTarget = useMemo(
    () =>
      isAuthenticated && stream && id
        ? uploadTargetFor(id, stream, vault?.ledger)
        : null,
    [isAuthenticated, stream, id, vault?.ledger],
  );
  const isFiling = useSelector(uploadSelectors.isFiling);
  const openUpload = () =>
    uploadTarget && dispatch(uploadActions.openUpload(uploadTarget));

  // The same resolution the vault page uses, so a section looks like itself
  // here too: its own glyph, label and copy rather than the generic layers
  // icon and the backend's "the stream mapped to …" description.
  const category = stream ? categoryForStream(stream) : null;

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
  const status = stream?.status ? getStatusConfig(stream.status) : null;

  return (
    /* Repoints the --cat-* variables, same as the section cards on the vault
       page — without it every stream renders in the default grey. */
    <div data-category={category?.code} className="min-h-screen bg-surface">
      <PageContainer measure="wide">
        <Link
          to={id ? vaultDetailPath(id) : "/"}
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-ink-subtle transition-colors hover:text-ink"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          Back to the vault
        </Link>

        <PageHeader
          icon={category?.icon ?? Layers}
          title={
            category?.label ?? (stream ? formatStreamName(stream) : "Record Stream")
          }
          description={category?.description ?? stream?.description}
          className="mb-6"
          meta={
            <>
              {category && (
                <TransferBadge transfersOnSale={category.transfersOnSale} />
              )}
              {status && (
                <Badge variant="secondary" className={status.className}>
                  {status.label}
                </Badge>
              )}
              {totalRecords != null && (
                <span className="flex items-center gap-1.5 text-sm text-ink-subtle">
                  <FileText className="h-3.5 w-3.5" />
                  {totalRecords} record{totalRecords !== 1 ? "s" : ""}
                </span>
              )}
            </>
          }
          actions={
            uploadTarget && (
              <Button size="sm" disabled={isFiling} onClick={openUpload}>
                <Plus />
                Add record
              </Button>
            )
          }
          provenance={
            <ProvenanceDetails
              txHash={stream?.tx_hash}
              ledger={stream?.ledger}
              createdAt={stream?.created_at}
              createdLabel="Created"
              rows={
                stream?.asset_code
                  ? [
                      {
                        label: "Stream",
                        value: stream.asset_code,
                        copyable: true,
                      },
                    ]
                  : []
              }
              actions={
                stream?.tx_hash && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      viewTXInExplorer(
                        stream.tx_hash!,
                        stream.ledger as NETWORK_SERVER_NAMES,
                      )
                    }
                  >
                    <ExternalLink />
                    Explorer
                  </Button>
                )
              }
            />
          }
        />

        {/* Records */}
        {isFirstLoad ? (
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
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
                  Every record in this section is still here — just none filed
                  the way you asked for.
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
    </div>
  );
};

export default StreamDetail;
