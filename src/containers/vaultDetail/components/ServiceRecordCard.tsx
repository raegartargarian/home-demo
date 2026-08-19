import { Chip } from "@/shared/components/Chip";
import { appRoutes } from "@/shared/constants/routes";
import { formatDate } from "@/shared/utils/dateFormatter";
import { recordMeta } from "@/shared/utils/recordLens";
import { getStatusConfig } from "@/shared/utils/statusConfig";
import { ArrowRight, Calendar, Package } from "lucide-react";
import {
  categorize,
  resolveMime,
  type PreviewCategory,
} from "@filedgr/web-core/preview";
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Attachment } from "../types";
import RecordThumbnail from "./RecordThumbnail";

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

  // The document's own date and reason beat the upload timestamp and the raw
  // filename wherever the name follows the convention.
  const meta = useMemo(() => recordMeta(attachment), [attachment]);

  return (
    <button
      onClick={() => navigate(`${appRoutes.serviceRecord.name}${attachment.id}`)}
      className="group w-full cursor-pointer rounded-lg border border-line bg-surface-raised p-4 text-left transition-colors duration-200 hover:border-cat-line"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <RecordThumbnail attachment={attachment} className="size-9" />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{meta.title}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              {meta.type && (
                <span className="rounded border border-cat-line bg-cat-surface px-1.5 text-[11px] font-medium text-cat-ink">
                  {meta.type}
                </span>
              )}
              {meta.date && (
                <span className="flex items-center gap-1 text-xs text-ink-subtle">
                  <Calendar className="h-3 w-3" aria-hidden />
                  {formatDate(meta.date)}
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
            <Chip
              label={status.label}
              tone={status.tone}
              className="hidden sm:inline-flex"
            />
          )}
          <ArrowRight className="h-4 w-4 text-ink-subtle transition-all group-hover:translate-x-0.5 group-hover:text-cat" />
        </div>
      </div>
    </button>
  );
};

export default ServiceRecordCard;
