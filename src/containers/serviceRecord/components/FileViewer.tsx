import { Button } from "@/components/ui/button";
import { Chip } from "@/shared/components/Chip";
import { Card, CardContent } from "@/components/ui/card";
import { CopyableHash } from "@/shared/components/CopyableHash";
import {
  downloadSource,
  isPreviewable,
  useAttachmentResolver,
  usePreviewSources,
} from "@/shared/hooks/usePreview";
import { formatFileSize } from "@filedgr/web-core/format";
import { getStatusConfig } from "@/shared/utils/statusConfig";
import {
  FilePreview,
  FileThumbnail,
  type PreviewSource,
} from "@filedgr/web-core/preview";
import { AnimatePresence, motion } from "framer-motion";
import { Download, File, Maximize2, X } from "lucide-react";
import React, { useState } from "react";
import { AttachmentModel } from "../types";

interface FileViewerProps {
  attachment: AttachmentModel;
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const FileViewer: React.FC<FileViewerProps> = ({ attachment }) => {
  const [expanded, setExpanded] = useState<PreviewSource | null>(null);
  const files = attachment.files ?? [];
  const resolver = useAttachmentResolver(attachment);
  const sources = usePreviewSources(attachment.files);

  if (files.length === 0) {
    return (
      <div className="bg-surface-raised rounded-xl border border-line p-12 text-center">
        <File className="w-12 h-12 text-ink-subtle mx-auto mb-4" />
        <h3 className="text-lg font-medium tracking-tight text-ink mb-2">
          No files available
        </h3>
        <p className="text-ink-muted max-w-md mx-auto">
          This home record does not contain any viewable files.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-4"
      >
        {files.map((file, index) => {
          const source = sources[index];
          const previewable = isPreviewable(file);

          return (
            <motion.div key={file.id ?? index} variants={staggerItem}>
              <Card className="bg-surface-raised border border-line overflow-hidden">
                <CardContent className="p-0">
                  {/* File header */}
                  <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-line">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Type-aware tile: a real frame for video, a rendered
                          page for documents, the image itself for photos. */}
                      <FileThumbnail
                        source={source}
                        resolver={resolver}
                        enabled={previewable}
                        className="size-9 rounded-lg overflow-hidden flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">
                          {file.filename || "Unnamed file"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {file.mimetype && <Chip label={file.mimetype} />}
                          {file.size != null && (
                            <span className="text-xs text-ink-subtle">
                              {formatFileSize(file.size)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {previewable && (
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpanded(source)}
                        >
                          <Maximize2 />
                          Full screen
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadSource(resolver, source)}
                        >
                          <Download />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Inline preview. Dispatch is web-core's: image, video,
                      audio, pdf, docx, xlsx, csv/text, json, markdown, zip and
                      3D models all render here, and the heavy renderers
                      code-split so nothing is loaded until it is needed. */}
                  <div className="bg-surface-sunken min-h-[20rem] flex items-center justify-center p-4">
                    {previewable ? (
                      <FilePreview
                        source={source}
                        resolver={resolver}
                        className="w-full max-h-[28rem]"
                      />
                    ) : (
                      <p className="text-sm text-ink-subtle">
                        Not yet pinned — this file has no content address.
                      </p>
                    )}
                  </div>

                  {/* File metadata */}
                  <div className="px-5 py-3 bg-surface-sunken/50 border-t border-line">
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-subtle">
                      {file.hash && (
                        <span className="flex items-center gap-1.5">
                          Hash:
                          <CopyableHash value={file.hash} />
                        </span>
                      )}
                      {file.cid && (
                        <span className="flex items-center gap-1.5">
                          CID:
                          <CopyableHash value={file.cid} />
                        </span>
                      )}
                      {file.status && (
                        <span>
                          Status:{" "}
                          <span className="text-ink-muted">
                            {getStatusConfig(file.status).label}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Full-screen preview. Same component, more room — one code path for
          every file type instead of a lightbox for images and a modal for
          PDFs. */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={() => setExpanded(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="relative flex flex-col w-full h-full max-w-6xl bg-surface-raised rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line shrink-0">
                <h3 className="text-sm font-medium text-ink truncate">
                  {expanded.filename}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setExpanded(null)}
                  aria-label="Close preview"
                >
                  <X />
                </Button>
              </div>
              <div className="flex-1 min-h-0 bg-surface-sunken">
                <FilePreview
                  source={expanded}
                  resolver={resolver}
                  className="w-full h-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileViewer;
