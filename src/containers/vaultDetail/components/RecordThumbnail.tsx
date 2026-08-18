import { cn } from "@/lib/utils";
import { FileThumbnail } from "@filedgr/web-core/preview";
import React from "react";
import { Attachment } from "../types";
import { useRecordPreview } from "./useRecordPreview";

interface RecordThumbnailProps {
  attachment: Attachment;
  className?: string;
}

/**
 * A record's own face, at row size.
 *
 * Previews the first pinned file that isn't the zip bundle: for a photo or a
 * walkthrough video that is the record's own image, which reads far better in a
 * list than a category glyph. Falls back to a glyph chosen from what the record
 * contains when nothing is pinned yet. `RecordTile` shows the same face at tile
 * size — both take the choice from `useRecordPreview`.
 */
export const RecordThumbnail: React.FC<RecordThumbnailProps> = ({
  attachment,
  className,
}) => {
  const { previewSource, resolver, Icon } = useRecordPreview(attachment);

  if (previewSource) {
    return (
      <FileThumbnail
        source={previewSource}
        resolver={resolver}
        className={cn(
          "shrink-0 overflow-hidden rounded-lg border border-cat-line",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border border-cat-line bg-cat-surface",
        className,
      )}
    >
      <Icon className="h-4 w-4 text-cat" aria-hidden />
    </div>
  );
};

export default RecordThumbnail;
