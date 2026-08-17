import { Skeleton } from "@/components/ui/skeleton";
import { StreamCard } from "@/shared/components/StreamCard";
import { streamDetailPath } from "@/shared/constants/routes";
import {
  categoryForAssetCode,
  StreamCategory,
} from "@/shared/constants/streams";
import { getStreamAttachments } from "@/shared/providers/api";
import { VaultStreamDto } from "@/shared/types/vault";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Attachment } from "../types";
import ServiceRecordCard from "./ServiceRecordCard";

// How many records to show inline per stream before linking to the full page.
const PREVIEW_COUNT = 3;

interface StreamListProps {
  vaultId: string;
  streams: VaultStreamDto[];
}

interface StreamPreview {
  previews: Attachment[];
  total: number;
}

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

const StreamList: React.FC<StreamListProps> = ({ vaultId, streams }) => {
  const navigate = useNavigate();
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
      const entries = await Promise.all(
        streams.map(async (stream) => {
          const empty: StreamPreview = { previews: [], total: 0 };
          if (!stream.asset_code) return [stream.id, empty] as const;
          try {
            const res = await getStreamAttachments(
              stream.asset_code,
              1,
              PREVIEW_COUNT
            );
            const previews: Attachment[] = res.data?.content || [];
            const total = res.data?.total_records ?? previews.length;
            return [stream.id, { previews, total }] as const;
          } catch (error) {
            console.error("Failed to load attachments:", error);
            return [stream.id, empty] as const;
          }
        })
      );

      if (cancelled) return;
      setPreviewsByStream(Object.fromEntries(entries));
      setIsLoading(false);
    };

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [streams]);

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
        const { previews, total } = previewsByStream[stream.id] ?? {
          previews: [],
          total: 0,
        };
        const hasMore = total > previews.length;

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
