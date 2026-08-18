import { Skeleton } from "@/components/ui/skeleton";
import { useWeb3Auth } from "@/containers/global/Web3AuthProvider";
import { uploadActions } from "@/containers/upload/slice";
import { uploadTargetFor } from "@/containers/upload/target";
import { useUploadedInto } from "@/containers/upload/useUploadedInto";
import { StreamCard } from "@/shared/components/StreamCard";
import { streamDetailPath } from "@/shared/constants/routes";
import {
  categoryForAssetCode,
  StreamCategory,
} from "@/shared/constants/streams";
import { getStreamAttachments } from "@/shared/providers/api";
import { VaultStreamDto } from "@/shared/types/vault";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Attachment } from "../types";
import ServiceRecordCard from "./ServiceRecordCard";

// How many records to show inline per stream before linking to the full page.
const PREVIEW_COUNT = 3;

interface StreamListProps {
  vaultId: string;
  streams: VaultStreamDto[];
  /** Fallback ledger for streams that don't carry one of their own. */
  vaultLedger?: string;
}

interface StreamPreview {
  previews: Attachment[];
  total: number;
}

const EMPTY_PREVIEW: StreamPreview = { previews: [], total: 0 };

const fetchPreview = async (
  stream: VaultStreamDto
): Promise<[string, StreamPreview]> => {
  if (!stream.asset_code) return [stream.id, EMPTY_PREVIEW];
  try {
    const res = await getStreamAttachments(
      stream.asset_code,
      1,
      PREVIEW_COUNT
    );
    const previews: Attachment[] = res.data?.content || [];
    return [
      stream.id,
      { previews, total: res.data?.total_records ?? previews.length },
    ];
  } catch (error) {
    console.error("Failed to load attachments:", error);
    return [stream.id, EMPTY_PREVIEW];
  }
};

/** Streams the backend returns in arbitrary order; the five-section
 *  architecture has a fixed reading order. Unrecognised streams sort last so an
 *  off-template stream is still reachable rather than hidden. */
const withCategory = (streams: VaultStreamDto[]) =>
  streams
    .map((stream) => ({
      stream,
      category: categoryForAssetCode(stream.asset_code),
    }))
    .sort(
      (a, b) =>
        (a.category?.order ?? Number.MAX_SAFE_INTEGER) -
        (b.category?.order ?? Number.MAX_SAFE_INTEGER)
    );

const StreamList: React.FC<StreamListProps> = ({
  vaultId,
  streams,
  vaultLedger,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useWeb3Auth() || {};
  // streamId -> { first few records, true total }, loaded in parallel up front.
  const [previewsByStream, setPreviewsByStream] = useState<
    Record<string, StreamPreview>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  const sections = useMemo(() => withCategory(streams), [streams]);

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      setIsLoading(true);
      const entries = await Promise.all(streams.map(fetchPreview));
      if (cancelled) return;
      setPreviewsByStream(Object.fromEntries(entries));
      setIsLoading(false);
    };

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [streams]);

  // A record filed from the modal lands on the backend, not in this state —
  // refetch just the section it went into.
  const refreshStream = useCallback(
    async (assetCode: string) => {
      const stream = streams.find((s) => s.asset_code === assetCode);
      if (!stream) return;
      const [id, preview] = await fetchPreview(stream);
      setPreviewsByStream((prev) => ({ ...prev, [id]: preview }));
    },
    [streams]
  );
  useUploadedInto(
    streams.map((stream) => stream.asset_code),
    refreshStream
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: Math.min(streams.length || 3, 5) }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-xl bg-surface-inset" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map(({ stream, category }) => {
        const { previews, total } = previewsByStream[stream.id] ?? EMPTY_PREVIEW;
        const hasMore = total > previews.length;
        const uploadTarget = isAuthenticated
          ? uploadTargetFor(vaultId, stream, vaultLedger)
          : null;

        return (
          <StreamCard
            key={stream.id}
            stream={stream}
            category={category as StreamCategory | null}
            total={total}
            onViewAll={
              hasMore && stream.asset_code
                ? () => navigate(streamDetailPath(vaultId, stream.asset_code!))
                : undefined
            }
            onAddRecord={
              uploadTarget
                ? () => dispatch(uploadActions.openUpload(uploadTarget))
                : undefined
            }
          >
            {previews.map((attachment) => (
              <ServiceRecordCard key={attachment.id} attachment={attachment} />
            ))}
          </StreamCard>
        );
      })}
    </div>
  );
};

export default StreamList;
