import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { vaultDetailSelectors } from "@/containers/vaultDetail/selectors";
import { STREAM_CATEGORIES } from "@/shared/constants/streams";
import { useWalletAddress } from "@/shared/hooks/useWalletAddr";
import { recordMeta } from "@/shared/utils/recordLens";
import {
  buildRecordName,
  docTypesForSection,
  RecordDocType,
} from "@/shared/utils/recordNaming";
import { withFlatNames } from "@filedgr/web-core/browser";
import { formatFileSize } from "@filedgr/web-core/format";
import type { UploadPhase } from "@filedgr/web-core/upload";
import { createDeterministicZip } from "@filedgr/web-core/zip";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Loader2, Pause, Play, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { uploadSelectors } from "../selectors";
import { uploadActions } from "../slice";
import { uploadTargetFor } from "../target";
import type { UploadTarget } from "../types";
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

const FIELD_CLASS =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-cat";

const totalSize = (files: File[]) =>
  files.reduce((sum, file) => sum + file.size, 0);

/** `<input type="date">` wants yyyy-mm-dd in local time, not an ISO instant. */
const toDateInput = (date: Date) =>
  `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;

const fromDateInput = (value: string): Date | null => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** "Hill Country final invoice.pdf" → "Hill Country final invoice". */
const stripExtension = (filename: string) =>
  filename.replace(/\.[^./\\]+$/, "");

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

  // The four parts of the naming convention, captured as fields. Nobody types
  // "062824 - Invoice - Kitchen Remodel - …"; it is derived below and shown back.
  const [date, setDate] = useState(() => toDateInput(new Date()));
  const [docType, setDocType] = useState<RecordDocType>("Invoice");
  const [project, setProject] = useState("");
  const [docName, setDocName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  // Zipping happens before the flow starts, and a large set takes a moment.
  const [isPacking, setIsPacking] = useState(false);

  const isRunning = status !== "idle";
  const isOpen = target !== null;

  // Where the record is going. A section card opens the modal with this
  // settled; the vault's own button opens it unset, and the picker below fills
  // it in. Either way the modal reads one resolved destination, so there is no
  // second code path for the "chosen here" case.
  const vault = useSelector(vaultDetailSelectors.vault);
  const streams = useMemo(() => vault?.streams ?? [], [vault?.streams]);
  const [streamId, setStreamId] = useState("");

  const destination = useMemo(() => {
    if (!target) return null;
    const stream = streams.find((candidate) => candidate.id === streamId);
    return stream
      ? uploadTargetFor(target.vaultId, stream, target.ledger)
      : target.streamId
        ? target
        : null;
  }, [target, streams, streamId]);

  // Only streams a record can actually be addressed to — `uploadTargetFor`
  // returns null for a stream with no asset code, and offering one would give
  // the homeowner a destination that silently cannot be filed into.
  const sectionOptions = useMemo(
    () =>
      streams
        .map((stream) => ({
          id: stream.id,
          target: target ? uploadTargetFor(target.vaultId, stream, target.ledger) : null,
        }))
        .filter(
          (option): option is { id: string; target: UploadTarget } =>
            option.target !== null
        )
        .map((option) => ({ id: option.id, label: option.target.streamLabel })),
    [streams, target]
  );

  const section = destination?.sectionCode
    ? STREAM_CATEGORIES[destination.sectionCode]
    : null;
  const docTypes = useMemo(
    () => docTypesForSection(section?.code),
    [section?.code]
  );

  // Suggest the projects this vault already has, so "Kitchen Remodel" is picked
  // rather than retyped into a near-miss that splits the project in two.
  const { items: vaultRecords } = useSelector(vaultDetailSelectors.records);
  const knownProjects = useMemo(
    () => [
      ...new Set(
        vaultRecords
          .map((record) => recordMeta(record).project)
          .filter((name): name is string => !!name)
      ),
    ],
    [vaultRecords]
  );

  const recordName = useMemo(() => {
    const parsed = fromDateInput(date);
    if (!parsed || !project.trim() || !docName.trim()) return "";
    return buildRecordName({
      date: parsed,
      type: docType,
      reason: project,
      docName,
    });
  }, [date, docType, project, docName]);

  useEffect(() => {
    if (!isOpen) return;
    setStreamId(target?.streamId ?? "");
    setDate(toDateInput(new Date()));
    setProject("");
    setDocName("");
    setDescription("");
    setFiles([]);
    setFileError("");
    setIsPacking(false);
  }, [isOpen, target?.streamId]);

  // Default to the first type that fits the section being filed into.
  useEffect(() => {
    if (isOpen && docTypes.length > 0) setDocType(docTypes[0]);
  }, [isOpen, docTypes]);

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

    // The file the user picked already names itself; don't make them retype it.
    if (!docName.trim() && next.length > 0) {
      setDocName(stripExtension(next[0].name));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError("");
  };

  const canSubmit =
    !!destination?.streamId &&
    !!destination.assetCode &&
    !!recordName &&
    files.length > 0 &&
    !!walletAddress &&
    !isRunning &&
    !isPacking;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !destination?.streamId || !destination.assetCode) return;

    setIsPacking(true);
    try {
      // A lone zip is uploaded as-is; anything else is packed into one.
      // Deterministic, not just any zip: the same files must always produce the
      // same bytes for an interrupted upload to be resumable.
      const file =
        files.length === 1 && files[0].name.toLowerCase().endsWith(".zip")
          ? files[0]
          : await createDeterministicZip(withFlatNames(files), {
              name: `${slugify(docName)}.zip`,
            });

      dispatch(
        uploadActions.startUpload({
          // The canonical name is what the browsing lenses read back — see
          // utils/recordLens.ts. A free-text name would file the record under
          // "Unfiled" and leave it off every project.
          name: recordName,
          description: description.trim() || undefined,
          file,
          filename: file.name,
          streamId: destination.streamId,
          assetCode: destination.assetCode,
          ledger: destination.ledger,
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
            aria-label={`Add a record to ${destination?.streamLabel ?? "this vault"}`}
            // Repoints the --cat-* variables, same as the stream cards. The
            // canonical section code, not the raw asset code, which may carry a
            // per-vault prefix.
            data-category={destination?.sectionCode}
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
                  {destination
                    ? `Filed into ${destination.streamLabel}`
                    : "Choose a section to file it into"}
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="record-date"
                      className="text-sm font-medium text-ink"
                    >
                      Date
                    </label>
                    <input
                      id="record-date"
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      className={FIELD_CLASS}
                    />
                    <p className="text-xs text-ink-subtle">
                      When the work happened, not today.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="record-section"
                      className="text-sm font-medium text-ink"
                    >
                      Section
                    </label>
                    <select
                      id="record-section"
                      value={destination?.streamId ?? ""}
                      onChange={(event) => setStreamId(event.target.value)}
                      className={FIELD_CLASS}
                    >
                      <option value="" disabled>
                        Choose a section…
                      </option>
                      {sectionOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="truncate text-xs text-ink-subtle">
                      {destination
                        ? "Where this record is filed."
                        : "Pick where this record belongs."}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="record-type"
                      className="text-sm font-medium text-ink"
                    >
                      Type
                    </label>
                    <select
                      id="record-type"
                      value={docType}
                      onChange={(event) =>
                        setDocType(event.target.value as RecordDocType)
                      }
                      className={FIELD_CLASS}
                    >
                      {docTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <p className="truncate text-xs text-ink-subtle">
                      Types filed in {section?.label ?? "this section"}.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="record-project"
                    className="text-sm font-medium text-ink"
                  >
                    Project
                  </label>
                  <input
                    id="record-project"
                    list="known-projects"
                    value={project}
                    onChange={(event) => setProject(event.target.value)}
                    placeholder="e.g. Roof Replacement"
                    autoFocus
                    className={FIELD_CLASS}
                  />
                  <datalist id="known-projects">
                    {knownProjects.map((known) => (
                      <option key={known} value={known} />
                    ))}
                  </datalist>
                  <p className="text-xs text-ink-subtle">
                    The job this belongs to. Reuse the same wording and every
                    section's paperwork gathers on one page.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="record-doc-name"
                    className="text-sm font-medium text-ink"
                  >
                    Document
                  </label>
                  <input
                    id="record-doc-name"
                    value={docName}
                    onChange={(event) => setDocName(event.target.value)}
                    placeholder="e.g. Summit Roofing final invoice"
                    className={FIELD_CLASS}
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
                    className={cn(FIELD_CLASS, "resize-none")}
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

                {recordName && (
                  <div className="rounded-lg border border-line bg-surface-sunken px-3 py-2">
                    <p className="text-xs text-ink-subtle">Filed as</p>
                    <p className="mt-0.5 break-all font-mono text-xs text-ink-muted">
                      {recordName}
                    </p>
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
