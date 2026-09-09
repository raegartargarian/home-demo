import { Button } from "@/components/ui/button";
import { vaultDetailSelectors } from "@/containers/vaultDetail/selectors";
import { cn } from "@/lib/utils";
import { FilterChip } from "@/shared/components/FilterChip";
import {
  FIELD_CLASS,
  FieldGroup,
  LABEL_CLASS,
} from "@/shared/components/FormField";
import {
  facetForType,
  RECORD_FACETS,
  RecordFacet,
} from "@/shared/constants/recordFacets";
import { Room, ROOMS } from "@/shared/constants/rooms";
import { STREAM_CATEGORIES } from "@/shared/constants/streams";
import { useWalletAddress } from "@/shared/hooks/useWalletAddr";
import {
  buildRecordName,
  docTypesForSection,
  documentNameFrom,
  RecordDocType,
} from "@/shared/utils/recordNaming";
import { withRecordTags } from "@/shared/utils/recordTags";
import { withFlatNames } from "@filedgr/web-core/browser";
import { formatFileSize } from "@filedgr/web-core/format";
import { createDeterministicZip } from "@filedgr/web-core/zip";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Loader2, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { captureRect } from "../originRect";
import { uploadSelectors } from "../selectors";
import { uploadActions } from "../slice";
import { uploadTargetFor } from "../target";
import type { UploadTarget } from "../types";
import FileDropZone from "./FileDropZone";
import FileThumbnail from "./FileThumbnail";

// One record is packed into a single deterministic zip, so cap what goes in it.
const MAX_FILES = 50;
const MAX_TOTAL_BYTES = 5 * 1024 * 1024 * 1024;

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "record";

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

/**
 * What to call a file whose own name said nothing and that nobody renamed.
 *
 * Keeping the device's name was the other option and it is the wrong one: a
 * name not worth pre-filling is not worth filing either, and writing
 * `776222620_2322108331861993_6267282462334264398_n` into the vault under the
 * convention is the exact outcome the convention exists to prevent. Position
 * within the record is not a description, but it is true, it is stable as other
 * files are named around it, and it sorts.
 */
const positionalDocName = (type: RecordDocType, index: number) =>
  `${type} ${index + 1}`;

/** "photo.HEIC" → "HEIC". Empty for a file with no extension. */
const extensionOf = (filename: string) => {
  const dot = filename.lastIndexOf(".");
  return dot > 0 && dot < filename.length - 1 ? filename.slice(dot + 1) : "";
};

/**
 * Files a new record into one stream.
 *
 * Mounted once, app-wide (see App.tsx): the vault page and the stream page both
 * open it by dispatching `openUpload`, and both learn it finished through
 * `useUploadedInto` rather than by owning the flow.
 *
 * A full page rather than a dialog, because filing one record means a
 * destination, four naming fields, a description, room tags and a file set —
 * enough that a phone-sized sheet spent more of itself scrolling than showing.
 *
 * Once submitted the run belongs to the tray (see UploadTray.tsx) and this form
 * hides itself. It stays *mounted* while it does, so a failure can put it back
 * with the files and every field exactly as they were left.
 */
export const UploadRecordModal: React.FC = () => {
  const dispatch = useDispatch();
  const target = useSelector(uploadSelectors.target);
  const status = useSelector(uploadSelectors.status);
  const error = useSelector(uploadSelectors.error);
  const walletAddress = useWalletAddress();
  const reduceMotion = useReducedMotion();

  // The four parts of the naming convention, captured as fields. Nobody types
  // "062824 - Invoice - Kitchen Remodel - …"; it is derived below and shown back.
  const [date, setDate] = useState(() => toDateInput(new Date()));
  const [docType, setDocType] = useState<RecordDocType>("Invoice");
  const [project, setProject] = useState("");
  const [description, setDescription] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [contains, setContains] = useState<RecordFacet[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  // One Document name per file, positionally aligned with `files`.
  //
  // The convention names *documents*, and a record can hold several — the
  // contractor's invoice and the photos of the finished work arrive together.
  // Naming only the record left every file inside it still called
  // `screenshot1241.png`, which is the thing the convention exists to stop.
  // Seeded from the file's own name so the common case is already filled in.
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [fileError, setFileError] = useState("");
  // Zipping happens before the flow starts, and a large set takes a moment.
  const [isPacking, setIsPacking] = useState(false);
  // Measured at submit, so the tray card can fly out of the button that filed it.
  const submitRef = useRef<HTMLButtonElement>(null);

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
          target: target
            ? uploadTargetFor(target.vaultId, stream, target.ledger)
            : null,
        }))
        .filter(
          (option): option is { id: string; target: UploadTarget } =>
            option.target !== null,
        )
        .map((option) => ({ id: option.id, label: option.target.streamLabel })),
    [streams, target],
  );

  const section = destination?.sectionCode
    ? STREAM_CATEGORIES[destination.sectionCode]
    : null;
  const docTypes = useMemo(
    () => docTypesForSection(section?.code),
    [section?.code],
  );

  // A record's Type puts it in one facet already; this is for everything *else*
  // in the same zip. Offering the typed facet again would just be a second way
  // to say what the Type said.
  const typedFacet = useMemo(() => facetForType(docType), [docType]);
  const containsOptions = useMemo(
    () => RECORD_FACETS.filter((facet) => facet.code !== typedFacet?.code),
    [typedFacet],
  );

  /**
   * The Document segment of the record's *own* name.
   *
   * With one file the record and the document are the same thing, so it is that
   * file's name — read straight from `fileNames`, not copied into a second
   * field, because a copy is a thing that can disagree with what gets filed.
   *
   * With several there is no such thing as the record's document, and naming it
   * after whichever file happened to be dropped first was the bug this replaced.
   * It is derived instead: what lists actually show for a record is its project
   * (`recordMeta.title` returns `reason`), so this segment only has to be true,
   * and "3 files" is.
   */
  const recordDocName =
    files.length > 1
      ? `${files.length} files`
      : files.length === 1
        ? (fileNames[0] ?? "").trim() || positionalDocName(docType, 0)
        : "";

  // Files whose own name said nothing, so nothing was pre-filled for them.
  // Not an error — a set can be filed with some of its photos unnamed — but
  // worth saying out loud, because the boxes are empty rather than wrong and
  // empty is easy to scroll past.
  const unnamedCount = files.filter(
    (_, index) => !(fileNames[index] ?? "").trim(),
  ).length;

  const recordName = useMemo(() => {
    const parsed = fromDateInput(date);
    if (!parsed || !project.trim() || !recordDocName.trim()) return "";
    return buildRecordName({
      date: parsed,
      type: docType,
      reason: project,
      docName: recordDocName,
    });
  }, [date, docType, project, recordDocName]);

  /**
   * The picked files, renamed to the convention.
   *
   * Same three leading segments as the record — they describe the upload, not
   * the individual document — with each file's own Document name last and its
   * original extension kept. A file whose Document name is left empty falls
   * back to the name it arrived with, so a set can be filed without naming
   * every last screenshot by hand.
   */
  const namedFiles = useMemo(() => {
    const parsed = fromDateInput(date);
    if (!parsed || !project.trim()) return files;

    return files.map((file, index) => {
      const name = buildRecordName({
        date: parsed,
        type: docType,
        reason: project,
        docName:
          (fileNames[index] ?? "").trim() || positionalDocName(docType, index),
        extension: extensionOf(file.name) || undefined,
      });

      return name === file.name ? file : new File([file], name, { type: file.type });
    });
  }, [files, fileNames, date, docType, project]);

  useEffect(() => {
    if (!isOpen) return;
    setStreamId(target?.streamId ?? "");
    setDate(toDateInput(new Date()));
    setProject("");
    setDescription("");
    setRooms([]);
    setContains([]);
    setFiles([]);
    setFileNames([]);
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
        `One record can hold at most ${MAX_FILES} files (this selection has ${next.length}). File the rest as a second record.`,
      );
      return;
    }
    if (totalSize(next) > MAX_TOTAL_BYTES) {
      setFileError(
        `The files add up to more than ${formatFileSize(MAX_TOTAL_BYTES)}.`,
      );
      return;
    }

    setFileError("");
    setFiles(next);
    // The file the user picked already names itself; don't make them retype it.
    setFileNames((prev) => [
      ...prev,
      ...incoming.map((file) => documentNameFrom(file.name)),
    ]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileNames((prev) => prev.filter((_, i) => i !== index));
    setFileError("");
  };

  /**
   * With one file, the record and the document are the same thing, so one field
   * names both and no per-file box is shown. Adding a second file is what
   * splits them apart.
   */
  const isSingleFile = files.length === 1;

  const renameFile = (index: number, value: string) =>
    setFileNames((prev) => prev.map((name, i) => (i === index ? value : name)));

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

    // Taken before the form hides itself, while the button is still on screen.
    const originRect = captureRect(submitRef.current);

    setIsPacking(true);
    try {
      // Every file inside carries the convention too, not just the record.
      // `withFlatNames` runs *after* the rename so it de-duplicates the names
      // the reader will actually see — two photos both called "After
      // completion" become "…After completion" and "…After completion-2",
      // rather than colliding silently.
      const named = withFlatNames(namedFiles);

      // A lone zip is already the package, so it is uploaded as it is — under
      // the canonical name, same as the one packed below. Anything else is
      // packed into one. Deterministic, not just any zip: the same files must
      // always produce the same bytes for an interrupted upload to be resumable.
      const file =
        files.length === 1 && files[0].name.toLowerCase().endsWith(".zip")
          ? named[0]
          : await createDeterministicZip(named, {
              name: `${slugify(recordDocName)}.zip`,
            });

      dispatch(
        uploadActions.startUpload(
          {
            // The canonical name is what the browsing lenses read back — see
            // utils/recordLens.ts. A free-text name would file the record under
            // "Unfiled" and leave it off every project.
            name: recordName,
            // Rooms are appended to the description as a readable line: the
            // backend stores no tags, and this is the only field that comes back
            // on every row of the section list. See utils/recordTags.ts.
            // A Type change can leave a selection that the Type now covers;
            // drop it rather than writing the same facet down twice.
            description: withRecordTags(description.trim(), {
              rooms,
              contains: contains.filter(
                (facet) => facet.code !== typedFacet?.code,
              ),
            }),
            file,
            filename: file.name,
            streamId: destination.streamId,
            assetCode: destination.assetCode,
            ledger: destination.ledger,
            networkOwner: walletAddress,
          },
          {
            title: recordName,
            subtitle: destination.streamLabel,
            originRect,
            vaultId: destination.vaultId,
            assetCode: destination.assetCode,
          },
        ),
      );
    } catch (packError) {
      console.error("Failed to package the record:", packError);
      setFileError("Could not package these files. Please try again.");
    } finally {
      setIsPacking(false);
    }
  };

  // A failed run, a rejected file set, or a missing wallet — whichever is
  // blocking, shown in one place beside the files.
  const problem = fileError || error;

  return (
    <AnimatePresence>
      {isOpen && target && (
        <motion.div
          className="fixed inset-0 z-[60] bg-surface-sunken"
          // Handed over to the tray on submit. Hidden rather than unmounted so
          // a failed run comes back to a form that never lost anything.
          style={isRunning ? { display: "none" } : undefined}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={
            reduceMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 420, damping: 36 }
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Add a record to ${destination?.streamLabel ?? "this vault"}`}
            // Repoints the --cat-* variables, same as the stream cards. The
            // canonical section code, not the raw asset code, which may carry a
            // per-vault prefix.
            data-category={destination?.sectionCode}
            className="relative flex h-full flex-col"
          >
            {/* The same floating island the app's own header is: the form
                scrolls underneath it, which is exactly the condition glass is
                for. A flat band welded to the top of a full-page form was the
                one piece of chrome still drawn the old way. */}
            <header className="pointer-events-none absolute inset-x-3 top-3 z-10 md:inset-x-6 md:top-4">
              <div className="glass pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-full py-2.5 pl-6 pr-2.5">
                <div className="min-w-0">
                  <h2 className="text-base font-medium tracking-tight text-ink">
                    Add a record
                  </h2>
                  <p className="truncate text-xs text-ink-muted">
                    {destination
                      ? `Filed into ${destination.streamLabel}`
                      : "Choose a section to file it into"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={close}
                  aria-label="Close"
                >
                  <X aria-hidden />
                </Button>
              </div>
            </header>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto">
                {/* Clears the floating header, which is out of flow. */}
                <div className="mx-auto grid max-w-5xl grid-cols-1 gap-x-12 gap-y-10 px-5 pb-28 pt-[6.5rem] sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px]">
                  <div className="space-y-10">
                    <FieldGroup
                      title="Where it goes"
                      hint="A record lives in one section. Rooms and projects cut across them later."
                    >
                      <div className="space-y-1.5">
                        <label htmlFor="record-section" className={LABEL_CLASS}>
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
                      </div>
                    </FieldGroup>

                    <FieldGroup
                      title="What it is"
                      hint={
                          files.length > 1
                            ? "These become the record's name. Each file takes the same three, then its own Document name."
                            : "These four fields become the record's name, shown at the bottom right."
                        }
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label htmlFor="record-date" className={LABEL_CLASS}>
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
                          <label htmlFor="record-type" className={LABEL_CLASS}>
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
                        <label htmlFor="record-project" className={LABEL_CLASS}>
                          Project
                        </label>
                        <input
                          id="record-project"
                          value={project}
                          onChange={(event) => setProject(event.target.value)}
                          placeholder="e.g. Roof Replacement"
                          autoFocus
                          className={FIELD_CLASS}
                        />
                        {/* No suggestions list: the only source for one was
                            every record in the vault, and the route that
                            returns them is not deployed — see the note in
                            providers/api.ts. Restore it there and the datalist
                            comes back with it. */}
                        <p className="text-xs text-ink-subtle">
                          The job this belongs to. Reuse the same wording and
                          every section's paperwork gathers on one page.
                        </p>
                      </div>

                      {/* Only while the record *is* one document. Past that,
                          each file carries its own box beside the file it
                          names, and there is nothing left for this one to
                          mean. */}
                      {files.length <= 1 && (
                        <div className="space-y-1.5">
                          <label
                            htmlFor="record-doc-name"
                            className={LABEL_CLASS}
                          >
                            Document
                          </label>
                          <input
                            id="record-doc-name"
                            value={fileNames[0] ?? ""}
                            onChange={(event) =>
                              renameFile(0, event.target.value)
                            }
                            disabled={files.length === 0}
                            placeholder={
                              files.length === 0
                                ? "Add a file, and it names itself here"
                                : "e.g. Summit Roofing final invoice"
                            }
                            autoFocus={files.length === 1 && !fileNames[0]}
                            className={cn(
                              FIELD_CLASS,
                              files.length === 0 &&
                                "cursor-not-allowed opacity-60",
                            )}
                          />
                          <p className="text-xs text-ink-subtle">
                            What the document is. Names the file too.
                          </p>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label
                          htmlFor="record-description"
                          className={LABEL_CLASS}
                        >
                          Description{" "}
                          <span className="font-normal text-ink-subtle">
                            (optional)
                          </span>
                        </label>
                        <textarea
                          id="record-description"
                          value={description}
                          onChange={(event) =>
                            setDescription(event.target.value)
                          }
                          rows={4}
                          placeholder="Who did the work, what was covered, anything worth remembering."
                          className={cn(FIELD_CLASS, "resize-none")}
                        />
                      </div>
                    </FieldGroup>

                    {/* One upload is one zip, and a zip is often more than one
                        kind of document — the contractor's invoice together
                        with the photos of the finished work. The name can only
                        carry one Type, so this is how the rest of what is
                        inside stays findable. See utils/recordTags.ts. */}
                    <FieldGroup
                      title="Also contains"
                      hint={`Optional. ${
                        typedFacet
                          ? `This is filed under ${typedFacet.label}. Check other associated labels for future filtering of records.`
                          : "Check the associated labels for future filtering of records."
                      }`}
                    >
                      <div
                        role="group"
                        aria-label="What else these files contain"
                        className="flex flex-wrap gap-1.5"
                      >
                        {containsOptions.map((facet) => (
                          <FilterChip
                            key={facet.code}
                            label={facet.label}
                            icon={facet.icon}
                            isActive={contains.some(
                              (it) => it.code === facet.code,
                            )}
                            onToggle={() =>
                              setContains((current) =>
                                current.some((it) => it.code === facet.code)
                                  ? current.filter(
                                      (it) => it.code !== facet.code,
                                    )
                                  : [...current, facet],
                              )
                            }
                          />
                        ))}
                      </div>
                    </FieldGroup>

                    {/* Tags, not filing: the record still lives in the section
                        chosen above, and tagging it "Kitchen" does not move it.
                        A closed list rather than free text, because these are
                        what the section's filter chips are built from and two
                        spellings of one room would split its records across two
                        chips. */}
                    <FieldGroup
                      title="Rooms"
                      hint="Optional. Lets this record be found by where the work was."
                    >
                      <div
                        role="group"
                        aria-label="Rooms this record covers"
                        className="flex flex-wrap gap-1.5"
                      >
                        {ROOMS.map((room) => (
                          <FilterChip
                            key={room.code}
                            label={room.label}
                            isActive={rooms.some((it) => it.code === room.code)}
                            onToggle={() =>
                              setRooms((current) =>
                                current.some((it) => it.code === room.code)
                                  ? current.filter((it) => it.code !== room.code)
                                  : [...current, room],
                              )
                            }
                          />
                        ))}
                      </div>
                    </FieldGroup>
                  </div>

                  <div className="space-y-6 lg:sticky lg:top-8 lg:self-start">
                    <FieldGroup
                      title="Files"
                      hint="Everything here is filed as one record."
                    >
                      <FileDropZone
                        onFiles={acceptFiles}
                        fileCount={files.length}
                        totalBytes={totalSize(files)}
                        maxFiles={MAX_FILES}
                        maxTotalBytes={MAX_TOTAL_BYTES}
                        disabled={isPacking}
                      />

                      {files.length > 0 && (
                        <ul className="max-h-[26rem] space-y-1.5 overflow-y-auto">
                          {files.map((file, index) => (
                            <li
                              key={`${file.name}-${index}`}
                              className="rounded-lg border border-line bg-surface-raised px-3 py-2"
                            >
                              <div className="flex items-center gap-2.5">
                                <FileThumbnail file={file} />
                                <span className="min-w-0 flex-1 truncate text-sm text-ink">
                                  {file.name}
                                </span>
                                <span className="shrink-0 text-xs tabular-nums text-ink-subtle">
                                  {formatFileSize(file.size)}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => removeFile(index)}
                                  aria-label={`Remove ${file.name}`}
                                  className="shrink-0"
                                >
                                  <X aria-hidden />
                                </Button>
                              </div>

                              {/* With one file the record's own Document field
                                  already names it, so this would be the same
                                  box twice. Two or more and each file needs its
                                  own name — shown against the file it names,
                                  with the name it will be filed under below. */}
                              {!isSingleFile && (
                                <div className="mt-2 space-y-1">
                                  <label
                                    htmlFor={`file-name-${index}`}
                                    className="text-xs font-medium text-ink-muted"
                                  >
                                    Document
                                  </label>
                                  <input
                                    id={`file-name-${index}`}
                                    value={fileNames[index] ?? ""}
                                    onChange={(event) =>
                                      renameFile(index, event.target.value)
                                    }
                                    placeholder={
                                      documentNameFrom(file.name) ||
                                      "Name this file"
                                    }
                                    className={cn(FIELD_CLASS, "py-1.5 text-xs")}
                                  />
                                  <p className="break-all font-mono text-[11px] text-ink-subtle">
                                    {namedFiles[index]?.name ?? file.name}
                                  </p>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </FieldGroup>

                    {unnamedCount > 0 && (
                      <p className="text-xs text-ink-subtle">
                        {unnamedCount} of {files.length} file
                        {files.length !== 1 ? "s" : ""} unnamed. Filing now names
                        {" "}
                        {unnamedCount === 1 ? "it" : "them"} by position —{" "}
                        {docType} 1, {docType} 2 — rather than keeping the name
                        the device gave {unnamedCount === 1 ? "it" : "them"}.
                      </p>
                    )}
                    {recordName && (
                      <div className="rounded-lg border border-line bg-surface-raised px-3 py-2">
                        <p className="text-xs text-ink-subtle">Filed as</p>
                        <p className="mt-0.5 break-all font-mono text-xs text-ink-muted">
                          {recordName}
                        </p>
                      </div>
                    )}

                    {(problem || !walletAddress) && (
                      <div
                        className={cn(
                          "flex items-start gap-2 rounded-lg border p-3 text-sm",
                          problem
                            ? "border-destructive/20 bg-destructive/10 text-destructive"
                            : "border-line bg-surface-raised text-ink-muted",
                        )}
                      >
                        <AlertCircle
                          className="mt-0.5 h-4 w-4 shrink-0"
                          aria-hidden
                        />
                        <span>
                          {problem || "Connect your wallet to file a record."}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Matching island at the other end. A floating header over a
                  welded footer reads as two different surfaces. */}
              <footer className="pointer-events-none absolute inset-x-3 bottom-3 z-10 md:inset-x-6 md:bottom-4">
                <div className="glass pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-full py-2.5 pl-6 pr-2.5">
                  <p className="hidden text-xs text-ink-subtle sm:block">
                    Filing keeps running in the corner — you can carry on
                    browsing.
                  </p>
                  <div className="flex flex-1 justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={close}
                    >
                      Cancel
                    </Button>
                    <Button
                      ref={submitRef}
                      type="submit"
                      disabled={!canSubmit}
                    >
                      {isPacking && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      {isPacking ? "Packaging…" : "File record"}
                    </Button>
                  </div>
                </div>
              </footer>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadRecordModal;
