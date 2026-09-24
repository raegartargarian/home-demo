import { Button } from "@/components/ui/button";
import {
  downloadSource,
  toPreviewSource,
  useAttachmentResolver,
  type PreviewAccess,
  type PreviewFile,
} from "@/shared/hooks/usePreview";
import { formatFileSize } from "@/shared/utils/fileHelpers";
import { FilePreview } from "@filedgr/web-core/preview";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, FileIcon, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo } from "react";

/**
 * One file, full screen, with the rest of the set a keypress away.
 *
 * The viewers themselves are web-core's — image, video, audio, PDF, DOCX,
 * XLSX, CSV, text, ZIP and 3D all dispatch from one `FilePreview` — so this
 * component owns only the shell: which file is showing, how to reach the next
 * one, and how to save it. That is the same division `filedgr-web-app` draws,
 * and the reason it can afford one code path instead of a lightbox for images
 * and a modal for documents.
 *
 * Navigation is the point. A file arrives as part of a set — the six documents
 * on a section's shelf, the year's worth on the stream page — and a preview you
 * have to close and reopen to compare two pages of a survey is a worse tool
 * than the folder it replaced.
 */

/** What the modal needs to show and fetch one file. */
export interface PreviewEntry {
  /** Carries the access context the resolver needs (public/tx/ledger). */
  attachment: PreviewAccess & { id: string };
  file: PreviewFile;
  /** Shown in the header — the tile's own label. */
  label: string;
  /** The note on the record the file came in, shown under the header. */
  note?: string;
}

interface FilePreviewModalProps {
  entries: PreviewEntry[];
  /** Null closes the modal. */
  index: number | null;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

/** Rendered only with a valid entry, so the hooks below never see a gap. */
const PreviewShell: React.FC<{
  entries: PreviewEntry[];
  index: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}> = ({ entries, index, onNavigate, onClose }) => {
  const reduceMotion = useReducedMotion();
  const { attachment, file, label, note } = entries[index];

  const hasPrev = index > 0;
  const hasNext = index < entries.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(index - 1);
  }, [hasPrev, index, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(index + 1);
  }, [hasNext, index, onNavigate]);

  // Arrow keys are what people reach for in a viewer; Escape is what they reach
  // for to leave one.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, onClose]);

  const resolver = useAttachmentResolver(attachment);
  const source = useMemo(
    () => toPreviewSource(file, file.cid ?? attachment.id),
    [file, attachment.id],
  );
  const canPreview = Boolean(file.cid);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={file.filename ?? label}
        initial={reduceMotion ? { opacity: 0 } : { scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { scale: 0.97, opacity: 0 }}
        transition={
          reduceMotion
            ? { duration: 0.15 }
            : { type: "spring", stiffness: 300, damping: 26 }
        }
        onClick={(event) => event.stopPropagation()}
        className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-surface-raised"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-ink">{label}</h3>
            <p className="truncate text-xs text-ink-subtle">
              {file.filename}
              {file.size != null && ` · ${formatFileSize(file.size)}`}
            </p>
          </div>

          {entries.length > 1 && (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={goPrev}
                disabled={!hasPrev}
                aria-label="Previous file"
              >
                <ChevronLeft aria-hidden />
              </Button>
              <span className="px-1 text-xs tabular-nums text-ink-subtle">
                {index + 1} / {entries.length}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={goNext}
                disabled={!hasNext}
                aria-label="Next file"
              >
                <ChevronRight aria-hidden />
              </Button>
            </div>
          )}

          {canPreview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadSource(resolver, source)}
              className="shrink-0"
            >
              <Download aria-hidden />
              Download
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0"
          >
            <X aria-hidden />
          </Button>
        </header>

        {/* Capped and scrollable: the file is what the viewer is for, and a
            long note must not push it off a phone screen. */}
        {note && (
          <p className="max-h-24 shrink-0 overflow-y-auto whitespace-pre-line border-b border-line px-4 py-2 text-xs text-ink-muted">
            {note}
          </p>
        )}

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-surface-sunken p-4">
          {canPreview ? (
            // Keyed on the file so switching entries remounts the viewer rather
            // than showing the previous file's canvas while the next resolves.
            <FilePreview
              key={source.id}
              source={source}
              resolver={resolver}
              className="h-full w-full"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-ink-subtle">
              <FileIcon className="h-12 w-12 opacity-50" aria-hidden />
              <p className="text-sm">
                Not yet pinned — this file has no content address.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  entries,
  index,
  onNavigate,
  onClose,
}) => (
  <AnimatePresence>
    {index !== null && entries[index] && (
      <PreviewShell
        entries={entries}
        index={index}
        onNavigate={onNavigate}
        onClose={onClose}
      />
    )}
  </AnimatePresence>
);

/** Open/close/step state for a set of previewable files. */
export const useFilePreview = () => {
  const [index, setIndex] = React.useState<number | null>(null);
  return {
    index,
    openAt: setIndex,
    close: useCallback(() => setIndex(null), []),
    navigate: setIndex,
  };
};

export default FilePreviewModal;
