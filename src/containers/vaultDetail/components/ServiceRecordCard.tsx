import { Badge } from "@/components/ui/badge";
import { appRoutes } from "@/shared/constants/routes";
import { formatDate } from "@/shared/utils/dateFormatter";
import { parseRecordName } from "@/shared/utils/recordNaming";
import { getStatusConfig } from "@/shared/utils/statusConfig";
import {
  ArrowRight,
  Calendar,
  FileText,
  Image as ImageIcon,
  Package,
} from "lucide-react";
import {
  toPreviewSource,
  useAttachmentResolver,
} from "@/shared/hooks/usePreview";
import {
  categorize,
  FileThumbnail,
  resolveMime,
  type PreviewCategory,
} from "@filedgr/web-core/preview";
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Attachment } from "../types";

interface ServiceRecordCardProps {
  attachment: Attachment;
}

/** Counts each kind of file in the record, as "1 video, 3 images, 2 PDFs".
 *  Categorisation is web-core's, so this stays in step with what the preview
 *  layer can actually render — including video, audio, 3D models and
 *  spreadsheets, which the old hand-rolled check collapsed into "other". */
const FILE_CATEGORY_LABELS: Partial<Record<PreviewCategory, [string, string]>> = {
  image: ["image", "images"],
  video: ["video", "videos"],
  audio: ["audio file", "audio files"],
  pdf: ["PDF", "PDFs"],
  model: ["3D model", "3D models"],
  spreadsheet: ["spreadsheet", "spreadsheets"],
  document: ["document", "documents"],
  zip: ["ZIP", "ZIPs"],
};

const summariseFiles = (attachment: Attachment): string | null => {
  const files = attachment.files ?? [];
  if (files.length === 0) return null;

  const counts = new Map<PreviewCategory, number>();
  for (const file of files) {
    const filename = file.filename ?? "";
    const category = categorize(resolveMime(file.mimetype, filename), filename);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  return (
    [...counts]
      .map(([category, count]) => {
        const [singular, plural] =
          FILE_CATEGORY_LABELS[category] ?? ["file", "files"];
        return `${count} ${count === 1 ? singular : plural}`;
      })
      .join(", ") || null
  );
};

/**
 * A single record inside a section.
 *
 * Colour comes from the `cat-*` variables, so the card takes on the accent of
 * whichever section it is rendered in rather than carrying its own — a fixed
 * blue tile inside an amber Maintenance card reads as a bug.
 *
 * Where the record follows the naming convention, the card shows the *reason*
 * it exists ("New Carpeting") and files the document type into a chip. Nobody
 * should have to read "100725 - Receipt - New Carpeting - HOME DEPOT" off a
 * list; that string is for the archive and the export.
 */
const ServiceRecordCard: React.FC<ServiceRecordCardProps> = ({
  attachment,
}) => {
  const navigate = useNavigate();
  const status = attachment.status ? getStatusConfig(attachment.status) : null;
  const fileTypeSummary = useMemo(() => summariseFiles(attachment), [attachment]);

  const named = useMemo(
    () => (attachment.name ? parseRecordName(attachment.name) : null),
    [attachment.name]
  );

  const title = named?.reason ?? attachment.name ?? "Home Record";
  // The document's own date beats the upload timestamp when we have it.
  const date = named?.date ?? (attachment.created_at ? new Date(attachment.created_at) : null);

  const files = attachment.files ?? [];
  const hasZip = files.some((f) => /\.zip$/i.test(f.filename ?? ""));
  const hasImage = files.some(
    (f) =>
      f.mimetype?.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp)$/i.test(f.filename ?? "")
  );
  const Icon = hasImage && !hasZip ? ImageIcon : hasZip ? Package : FileText;

  // Preview the first pinned file that isn't the zip bundle: for a photo or a
  // walkthrough video that is the record's own image, which reads far better in
  // a list than a category glyph. Falls back to the glyph when nothing is
  // pinned yet.
  const previewFile = useMemo(
    () =>
      attachment.files?.find((f) => f.cid && !/\.zip$/i.test(f.filename ?? "")),
    [attachment.files]
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

  return (
    <button
      onClick={() => navigate(`${appRoutes.serviceRecord.name}${attachment.id}`)}
      className="group w-full cursor-pointer rounded-lg border border-line bg-surface-raised p-4 text-left transition-all duration-200 hover:border-cat-line hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {previewSource ? (
            <FileThumbnail
              source={previewSource}
              resolver={resolver}
              className="size-9 shrink-0 overflow-hidden rounded-lg border border-cat-line"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cat-line bg-cat-surface">
              <Icon className="h-4 w-4 text-cat" aria-hidden />
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{title}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              {named && (
                <span className="rounded border border-cat-line bg-cat-surface px-1.5 text-[11px] font-medium text-cat-ink">
                  {named.type}
                </span>
              )}
              {date && (
                <span className="flex items-center gap-1 text-xs text-ink-subtle">
                  <Calendar className="h-3 w-3" aria-hidden />
                  {formatDate(date)}
                </span>
              )}
              {fileTypeSummary && (
                <span className="flex items-center gap-1 text-xs text-ink-subtle">
                  <Package className="h-3 w-3" aria-hidden />
                  {fileTypeSummary}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {status && (
            <Badge
              variant="secondary"
              className={`hidden text-xs sm:inline-flex ${status.className}`}
            >
              {status.label}
            </Badge>
          )}
          <ArrowRight className="h-4 w-4 text-ink-subtle transition-all group-hover:translate-x-0.5 group-hover:text-cat" />
        </div>
      </div>
    </button>
  );
};

export default ServiceRecordCard;
