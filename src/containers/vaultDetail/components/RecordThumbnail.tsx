import { cn } from "@/lib/utils";
import {
  toPreviewSource,
  useAttachmentResolver,
} from "@/shared/hooks/usePreview";
import { FileThumbnail } from "@filedgr/web-core/preview";
import { FileText, Image as ImageIcon, Package } from "lucide-react";
import React, { useMemo } from "react";
import { Attachment } from "../types";

interface RecordThumbnailProps {
  attachment: Attachment;
  className?: string;
}

/**
 * A record's own face.
 *
 * Previews the first pinned file that isn't the zip bundle: for a photo or a
 * walkthrough video that is the record's own image, which reads far better in a
 * list than a category glyph. Falls back to a glyph chosen from what the record
 * contains when nothing is pinned yet.
 */
export const RecordThumbnail: React.FC<RecordThumbnailProps> = ({
  attachment,
  className,
}) => {
  const files = useMemo(() => attachment.files ?? [], [attachment.files]);
  const hasZip = files.some((file) => /\.zip$/i.test(file.filename ?? ""));
  const hasImage = files.some(
    (file) =>
      file.mimetype?.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file.filename ?? "")
  );
  const Icon = hasImage && !hasZip ? ImageIcon : hasZip ? Package : FileText;

  const previewFile = useMemo(
    () => files.find((file) => file.cid && !/\.zip$/i.test(file.filename ?? "")),
    [files]
  );

  const resolver = useAttachmentResolver(attachment);

  // Memoised for the same reason as the resolver: web-core re-resolves whenever
  // either prop changes identity, and an inline object changes on every render.
  const previewSource = useMemo(
    () =>
      previewFile
        ? toPreviewSource(previewFile, previewFile.cid ?? attachment.id)
        : null,
    [previewFile, attachment.id]
  );

  if (previewSource) {
    return (
      <FileThumbnail
        source={previewSource}
        resolver={resolver}
        className={cn(
          "shrink-0 overflow-hidden rounded-lg border border-cat-line",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border border-cat-line bg-cat-surface",
        className
      )}
    >
      <Icon className="h-4 w-4 text-cat" aria-hidden />
    </div>
  );
};

export default RecordThumbnail;
