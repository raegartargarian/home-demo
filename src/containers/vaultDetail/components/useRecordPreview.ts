import {
  toPreviewSource,
  useAttachmentResolver,
} from "@/shared/hooks/usePreview";
import {
  categorize,
  resolveMime,
  type PreviewCategory,
  type PreviewSource,
  type SourceResolver,
} from "@filedgr/web-core/preview";
import { FileText, Image as ImageIcon, Package } from "lucide-react";
import React, { useMemo } from "react";
import { Attachment } from "../types";
import { isZip, previewableFiles, type RecordFile } from "./recordFiles";

export type { RecordFile };

/**
 * What a record looks like, decided once.
 *
 * A record is a bundle of files, so "the face of this record" is a choice —
 * first pinned file that isn't the zip — and the small tile and the row
 * thumbnail have to make it the same way or the same record shows two different
 * faces in two places on one page. That choice lives here.
 */

/** Short enough for a corner badge. */
const FORMAT_LABELS: Partial<Record<PreviewCategory, string>> = {
  pdf: "PDF",
  spreadsheet: "XLS",
  image: "IMG",
  video: "VID",
  audio: "AUD",
  model: "3D",
  document: "DOC",
  zip: "ZIP",
};

/** The corner badge for one file: "PDF", "XLS", "IMG"… */
export const formatOf = (file: RecordFile): string | null => {
  const filename = file.filename ?? "";
  return (
    FORMAT_LABELS[categorize(resolveMime(file.mimetype, filename), filename)] ??
    null
  );
};

export interface RecordPreview {
  /** Null when nothing on the record is pinned yet. */
  previewSource: PreviewSource | null;
  resolver: SourceResolver;
  /** Fallback glyph for when there is no preview to show. */
  Icon: React.ComponentType<{ className?: string }>;
}

export const useRecordPreview = (attachment: Attachment): RecordPreview => {
  const files = useMemo(() => attachment.files ?? [], [attachment.files]);

  const previewFile = useMemo(
    () => previewableFiles(attachment).find((file) => file.cid),
    [attachment],
  );

  const resolver = useAttachmentResolver(attachment);

  // Memoised for the same reason as the resolver: web-core re-resolves whenever
  // either prop changes identity, and an inline object changes on every render.
  const previewSource = useMemo(
    () =>
      previewFile
        ? toPreviewSource(previewFile, previewFile.cid ?? attachment.id)
        : null,
    [previewFile, attachment.id],
  );

  const Icon = useMemo(() => {
    const hasZip = files.some(isZip);
    const hasImage = files.some(
      (file) =>
        file.mimetype?.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file.filename ?? ""),
    );
    return hasImage && !hasZip ? ImageIcon : hasZip ? Package : FileText;
  }, [files]);

  return { previewSource, resolver, Icon };
};
