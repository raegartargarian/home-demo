import { DocFace, FileTile } from "@/shared/components/FileTile";
import { appRoutes } from "@/shared/constants/routes";
import {
  toPreviewSource,
  useAttachmentResolver,
} from "@/shared/hooks/usePreview";
import { FileThumbnail } from "@filedgr/web-core/preview";
import { FileText } from "lucide-react";
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Attachment } from "../types";
import { type RecordFile } from "./recordFiles";
import { formatOf } from "./useRecordPreview";

interface RecordFileTileProps {
  /** The record the file was filed as. */
  attachment: Attachment;
  file: RecordFile;
  label: string;
  /**
   * Opens the file itself, in the preview modal. Where it is omitted the tile
   * falls back to opening the record that carries the file.
   */
  onOpen?: () => void;
  /**
   * False renders the face alone, with no click of its own — for shelves that
   * sit inside something that is already one target.
   */
  interactive?: boolean;
}

/**
 * One filed document, as a file on a shelf.
 *
 * The section preview used to be a list of rows, which reads as a database
 * table of a house. The same documents as faces read as what the homeowner
 * actually has — and it is the same treatment, at the same size, that the
 * landing page uses to show what belongs in a section, so the promise and the
 * vault are one thing.
 *
 * Clicking opens the file in the preview modal, where the rest of the shelf is
 * one arrow key away. The full filename stays in the tooltip.
 */
export const RecordFileTile: React.FC<RecordFileTileProps> = ({
  attachment,
  file,
  label,
  onOpen,
  interactive = true,
}) => {
  const navigate = useNavigate();
  const resolver = useAttachmentResolver(attachment);

  // Memoised because web-core re-resolves — and so refetches — whenever either
  // prop changes identity, and an inline object changes on every render.
  const source = useMemo(
    () => (file.cid ? toPreviewSource(file, file.cid) : null),
    [file],
  );

  const face = (
    <FileTile
        label={label}
        format={formatOf(file) ?? undefined}
        size="md"
        className="transition-colors duration-200 group-hover:border-cat-line"
      >
        {source ? (
          <FileThumbnail
            source={source}
            resolver={resolver}
            className="h-full w-full"
          />
        ) : (
          // Not pinned yet — the ruled document face beats an empty box, which
          // reads as a failed load.
          <div className="relative h-full">
            <DocFace />
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText className="h-4 w-4 text-cat" aria-hidden />
            </div>
          </div>
        )}
    </FileTile>
  );

  // A shelf on a section card is a preview of what is inside, and the card is
  // one target that opens the section — so the faces there are just faces, and
  // a click anywhere on the card goes the same place.
  if (!interactive) {
    return (
      <div title={file.filename ?? attachment.name ?? label} className="block">
        {face}
      </div>
    );
  }

  return (
    <button
      type="button"
      title={file.filename ?? attachment.name ?? label}
      onClick={
        onOpen ??
        (() => navigate(`${appRoutes.serviceRecord.name}${attachment.id}`))
      }
      className="group block w-full cursor-pointer text-left"
    >
      {face}
    </button>
  );
};

export default RecordFileTile;
