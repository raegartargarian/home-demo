import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeb3Auth } from "@/containers/global/Web3AuthProvider";
import { uploadActions } from "@/containers/upload/slice";
import { uploadTargetFor } from "@/containers/upload/target";
import { useUploadedInto } from "@/containers/upload/useUploadedInto";
import { CopyableHash } from "@/shared/components/CopyableHash";
import { TransferBadge } from "@/shared/components/TransferBadge";
import { LoadingIndicator } from "@/shared/components/LoadingIndicator";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";
import { getStreamAttachments } from "@/shared/providers/api";
import { formatDate } from "@/shared/utils/dateFormatter";
import {
  getLedgerNameFromServerName,
  NETWORK_SERVER_NAMES,
} from "@/shared/utils/networks";
import { getStatusConfig } from "@/shared/utils/statusConfig";
import {
  categoryForStream,
  formatStreamName,
} from "@/shared/utils/streamHelpers";
import { vaultDetailPath } from "@/shared/constants/routes";
import { viewTXInExplorer } from "@/shared/utils/viewVaultInExplorer";
import {
  Calendar,
  ChevronLeft,
  ExternalLink,
  FileText,
  Layers,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import ServiceRecordCard from "../vaultDetail/components/ServiceRecordCard";
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

  const sentinelRef = useInfiniteScroll({
    hasMore,
    isLoading: isFetching,
    onLoadMore: loadMore,
  });

  useUploadedInto([code], () => setReloadKey((key) => key + 1));

  const uploadTarget = useMemo(
    () =>
      isAuthenticated && stream && id
        ? uploadTargetFor(id, stream, vault?.ledger)
        : null,
    [isAuthenticated, stream, id, vault?.ledger],
  );
  const openUpload = () =>
    uploadTarget && dispatch(uploadActions.openUpload(uploadTarget));

  // The same resolution the vault page uses, so a section looks like itself
  // here too: its own glyph, label and copy rather than the generic layers
  // icon and the backend's "the stream mapped to …" description.
  const category = stream ? categoryForStream(stream) : null;

  const isFirstLoad = isFetching && attachments.length === 0;
  const status = stream?.status ? getStatusConfig(stream.status) : null;

  return (
    /* Repoints the --cat-* variables, same as the section cards on the vault
       page — without it every stream renders in the default grey. */
    <div data-category={category?.code} className="min-h-screen bg-surface">
      <PageContainer>
        <Link
          to={id ? vaultDetailPath(id) : "/"}
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-ink-subtle transition-colors hover:text-ink"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          Back to the vault
        </Link>

        {/* Stream header */}
        <div className="bg-surface-raised rounded-xl border border-line p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cat-surface border border-cat-line flex items-center justify-center flex-shrink-0">
              {category ? (
                <category.icon className="w-6 h-6 text-cat" aria-hidden />
              ) : (
                <Layers className="w-6 h-6 text-cat" aria-hidden />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-medium tracking-tight text-ink truncate">
                {category?.label ??
                  (stream ? formatStreamName(stream) : "Record Stream")}
              </h1>
              {(category?.description || stream?.description) && (
                <p className="text-sm text-ink-muted mt-1">
                  {category?.description ?? stream?.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {category && (
                  <TransferBadge transfersOnSale={category.transfersOnSale} />
                )}
                {status && (
                  <Badge variant="secondary" className={status.className}>
                    {status.label}
                  </Badge>
                )}
                {stream?.ledger && (
                  <Badge
                    variant="secondary"
                    className="bg-surface-inset text-ink-muted border-line"
                  >
                    {getLedgerNameFromServerName(stream.ledger) ||
                      stream.ledger}
                  </Badge>
                )}
                {stream?.created_at && (
                  <span className="flex items-center gap-1.5 text-sm text-ink-subtle">
                    <Calendar className="w-3.5 h-3.5" />
                    Created {formatDate(stream.created_at)}
                  </span>
                )}
                {totalRecords != null && (
                  <span className="flex items-center gap-1.5 text-sm text-ink-subtle">
                    <FileText className="w-3.5 h-3.5" />
                    {totalRecords} record{totalRecords !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {uploadTarget && (
              <Button
                size="sm"
                onClick={openUpload}
                className="shrink-0 bg-brand text-ink-inverse hover:bg-brand-hover"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add record
              </Button>
            )}
          </div>

          {(stream?.tx_hash || stream?.asset_code) && (
            <>
              <Separator className="my-5 bg-line" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {stream?.tx_hash && (
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-verified" />
                      <span className="text-sm text-verified font-medium">
                        Verified on blockchain
                      </span>
                      <CopyableHash value={stream.tx_hash} />
                    </div>
                  )}
                  {stream?.asset_code && (
                    <div className="flex items-center gap-1.5 text-xs text-ink-subtle">
                      <span>Stream:</span>
                      <CopyableHash value={stream.asset_code} />
                    </div>
                  )}
                </div>
                {stream?.tx_hash && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      viewTXInExplorer(
                        stream.tx_hash!,
                        stream.ledger as NETWORK_SERVER_NAMES,
                      )
                    }
                    className="border-line text-ink-muted hover:bg-surface-inset w-fit"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Explorer
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Records */}
        {isFirstLoad ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-16 w-full bg-surface-inset rounded-lg"
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
                onClick={openUpload}
                className="mt-4 bg-brand text-ink-inverse hover:bg-brand-hover"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add the first record
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <ServiceRecordCard
                  key={attachment.id}
                  attachment={attachment}
                />
              ))}
            </div>
            {hasMore && (
              <div ref={sentinelRef} aria-hidden className="h-px w-full" />
            )}
            {isFetching && attachments.length > 0 && (
              <div className="w-full flex items-center justify-center mt-6">
                <LoadingIndicator />
              </div>
            )}
          </>
        )}
      </PageContainer>
    </div>
  );
};

export default StreamDetail;
