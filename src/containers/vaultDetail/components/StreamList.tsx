import { Skeleton } from "@/components/ui/skeleton";
import { useUploadedInto } from "@/containers/upload/useUploadedInto";
import { StreamCard } from "@/shared/components/StreamCard";
import { streamDetailPath } from "@/shared/constants/routes";
import { getStreamAttachments } from "@/shared/providers/api";
import { VaultStreamDto } from "@/shared/types/vault";
import { sortedSections } from "@/shared/utils/streamHelpers";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Attachment } from "../types";
import AddSectionCard from "./AddSectionCard";
import FileShelf from "./FileShelf";
import { sectionTiles } from "./sectionTiles";

// How many records to fetch per stream for the inline preview. Each one can
// carry several files and each file gets its own tile, so this is an upper
// bound on records, not on tiles.
const PREVIEW_COUNT = 6;

/** Tiles per section card: two rows of three, as on the landing page. */
const TILE_COUNT = 6;

interface StreamListProps {
  vaultId: string;
  streams: VaultStreamDto[];
}

interface StreamPreview {
  previews: Attachment[];
  total: number;
}

const EMPTY_PREVIEW: StreamPreview = { previews: [], total: 0 };

const fetchPreview = async (
  stream: VaultStreamDto,
): Promise<[string, StreamPreview]> => {
  if (!stream.asset_code) return [stream.id, EMPTY_PREVIEW];
  try {
    const res = await getStreamAttachments(stream.asset_code, 1, PREVIEW_COUNT);
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

const StreamList: React.FC<StreamListProps> = ({ vaultId, streams }) => {
  const navigate = useNavigate();
  // streamId -> { first few records, true total }, loaded in parallel up front.
  const [previewsByStream, setPreviewsByStream] = useState<
    Record<string, StreamPreview>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  const sections = useMemo(() => sortedSections(streams), [streams]);

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
    [streams],
  );
  useUploadedInto(
    streams.map((stream) => stream.asset_code),
    refreshStream,
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: Math.min(streams.length || 3, 5) }).map(
          (_, i) => (
            <Skeleton
              key={i}
              className="h-80 w-full rounded-xl bg-surface-inset"
            />
          ),
        )}
      </div>
    );
  }

  return (
    // The same grid the landing page lays its five cards out in — a vault
    // section and the promise of one are now literally the same card.
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {sections.map(({ stream, category }) => {
        const { previews, total } =
          previewsByStream[stream.id] ?? EMPTY_PREVIEW;
        const tiles = sectionTiles(previews).slice(0, TILE_COUNT);

        return (
          <StreamCard
            key={stream.id}
            stream={stream}
            category={category}
            total={total}
            onOpen={
              stream.asset_code
                ? () => navigate(streamDetailPath(vaultId, stream.asset_code!))
                : undefined
            }
          >
            <FileShelf tiles={tiles} interactive={false} />
          </StreamCard>
        );
      })}

      {/* Last in the grid, where the new section will appear. */}
      <AddSectionCard vaultId={vaultId} />
    </div>
  );
};

export default StreamList;
