import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { categoryForAssetCode } from "@/shared/constants/streams";
import { useWalletAddress } from "@/shared/hooks/useWalletAddr";
import { withFlatNames } from "@filedgr/web-core/browser";
import { formatFileSize } from "@filedgr/web-core/format";
import type { UploadPhase } from "@filedgr/web-core/upload";
import { createDeterministicZip } from "@filedgr/web-core/zip";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Loader2, Pause, Play, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { uploadSelectors } from "../selectors";
import { uploadActions } from "../slice";
import FileDropZone from "./FileDropZone";

// One record is packed into a single deterministic zip, so cap what goes in it.
const MAX_FILES = 50;
const MAX_TOTAL_BYTES = 5 * 1024 * 1024 * 1024;

const PHASE_LABEL: Record<UploadPhase, string> = {
  creating: "Preparing the record…",
  reviewing: "Reviewing the files…",
  uploading: "Uploading…",
  completing: "Finalising the upload…",
  confirming: "Anchoring to the blockchain…",
  done: "Done",
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "record";

const totalSize = (files: File[]) =>
  files.reduce((sum, file) => sum + file.size, 0);

/**
 * Files a new record into one stream.
 *
 * Mounted once, app-wide (see App.tsx): the vault page and the stream page both
 * open it by dispatching `openUpload`, and both learn it finished through
 * `useUploadedInto` rather than by owning the flow.
 */
export const UploadRecordModal: React.FC = () => {
  const dispatch = useDispatch();
  const target = useSelector(uploadSelectors.target);
  const status = useSelector(uploadSelectors.status);
  const phase = useSelector(uploadSelectors.phase);
  const progress = useSelector(uploadSelectors.progress);
  const parts = useSelector(uploadSelectors.parts);
  const error = useSelector(uploadSelectors.error);
  const walletAddress = useWalletAddress();
  const reduceMotion = useReducedMotion();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  // Zipping happens before the flow starts, and a large set takes a moment.
  const [isPacking, setIsPacking] = useState(false);

  const isRunning = status !== "idle";
  const isOpen = target !== null;

  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setDescription("");
    setFiles([]);
    setFileError("");
    setIsPacking(false);
  }, [isOpen, target?.streamId]);

  const close = () => {
    if (isRunning) return;
    dispatch(uploadActions.closeUpload());
  };

  useEffect(() => {
    // Not while a run is in flight: closing mid-upload would orphan it.
    if (!isOpen || isRunning) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch(uploadActions.closeUpload());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isRunning, dispatch]);

  const acceptFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;
    const next = [...files, ...incoming];

    if (next.length > MAX_FILES) {
      setFileError(
        `One record can hold at most ${MAX_FILES} files (this selection has ${next.length}). File the rest as a second record.`
      );
      return;
    }
    if (totalSize(next) > MAX_TOTAL_BYTES) {
      setFileError(
        `The files add up to more than ${formatFileSize(MAX_TOTAL_BYTES)}.`
      );
      return;
    }

    setFileError("");
    setFiles(next);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError("");
  };

  const canSubmit =
    !!target &&
    !!name.trim() &&
    files.length > 0 &&
    !!walletAddress &&
    !isRunning &&
    !isPacking;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !target) return;

    setIsPacking(true);
    try {
      // A lone zip is uploaded as-is; anything else is packed into one.
      // Deterministic, not just any zip: the same files must always produce the
      // same bytes for an interrupted upload to be resumable.
      const file =
        files.length === 1 && files[0].name.toLowerCase().endsWith(".zip")
          ? files[0]
          : await createDeterministicZip(withFlatNames(files), {
              name: `${slugify(name)}.zip`,
            });

      dispatch(
        uploadActions.startUpload({
          name: name.trim(),
          description: description.trim() || undefined,
          file,
          filename: file.name,
          streamId: target.streamId,
          assetCode: target.assetCode,
          ledger: target.ledger,
          networkOwner: walletAddress,
        })
      );
    } catch (packError) {
      console.error("Failed to package the record:", packError);
      setFileError("Could not package these files. Please try again.");
    } finally {
      setIsPacking(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && target && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Add a record to ${target.streamLabel}`}
            // Repoints the --cat-* variables, same as the stream cards. The
            // canonical section code, not the raw asset code, which may carry a
            // per-vault prefix.
            data-category={categoryForAssetCode(target.assetCode)?.code}
            onClick={(event) => event.stopPropagation()}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={
              reduceMotion
                ? { duration: 0.15 }
                : { type: "spring", stiffness: 420, damping: 34 }
            }
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-surface-raised shadow-xl sm:max-w-lg sm:rounded-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line p-5">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-ink">
                  Add a record
                </h2>
                <p className="mt-0.5 truncate text-sm text-ink-muted">
                  Filed into {target.streamLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={isRunning}
                aria-label="Close"
                className="rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-surface-inset hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </header>

            {isRunning ? (
              <div className="space-y-4 p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-ink">
                  <Loader2 className="h-4 w-4 animate-spin text-cat" aria-hidden />
                  {status === "paused"
                    ? "Paused"
                    : (phase && PHASE_LABEL[phase]) || "Uploading…"}
                </div>
                <Progress value={progress} className="bg-surface-inset" />
                <p className="text-xs text-ink-subtle">
                  {progress}%
                  {parts && ` · part ${parts.current} of ${parts.total}`}
                </p>
                <p className="text-xs text-ink-subtle">
                  Keep this window open until the record is anchored.
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-line text-ink-muted hover:bg-surface-inset"
                    onClick={() =>
                      dispatch(
                        status === "paused"
                          ? uploadActions.resumeUpload()
                          : uploadActions.pauseUpload()
                      )
                    }
                  >
                    {status === "paused" ? (
                      <Play className="mr-1.5 h-3.5 w-3.5" />
                    ) : (
                      <Pause className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {status === "paused" ? "Resume" : "Pause"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-line text-ink-muted hover:bg-surface-inset"
                    onClick={() => dispatch(uploadActions.cancelUpload())}
                  >
                    Cancel upload
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 p-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="record-name"
                    className="text-sm font-medium text-ink"
                  >
                    Record name
                  </label>
                  <input
                    id="record-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Roof replacement invoice"
                    autoFocus
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-cat"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="record-description"
                    className="text-sm font-medium text-ink"
                  >
                    Description{" "}
                    <span className="font-normal text-ink-subtle">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="record-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={2}
                    placeholder="Who did the work, what was covered, anything worth remembering."
                    className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-cat"
                  />
                </div>

                <FileDropZone
                  onFiles={acceptFiles}
                  fileCount={files.length}
                  totalBytes={totalSize(files)}
                  maxFiles={MAX_FILES}
                  maxTotalBytes={MAX_TOTAL_BYTES}
                  disabled={isPacking}
                />

                {files.length > 0 && (
                  <ul className="max-h-44 space-y-1.5 overflow-y-auto">
                    {files.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm text-ink">
                          {file.name}
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-ink-subtle">
                          {formatFileSize(file.size)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          aria-label={`Remove ${file.name}`}
                          className="shrink-0 rounded p-1 text-ink-subtle transition-colors hover:bg-surface-inset hover:text-ink"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {(fileError || error || !walletAddress) && (
                  <div
                    className={cn(
                      "flex items-start gap-2 rounded-lg border p-3 text-sm",
                      fileError || error
                        ? "border-destructive/20 bg-destructive/10 text-destructive"
                        : "border-line bg-surface-sunken text-ink-muted"
                    )}
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      {fileError ||
                        error ||
                        "Connect your wallet to file a record."}
                    </span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={close}
                    className="border-line text-ink-muted hover:bg-surface-inset"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="bg-brand text-ink-inverse hover:bg-brand-hover"
                  >
                    {isPacking && (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    )}
                    {isPacking ? "Packaging…" : "File record"}
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadRecordModal;
