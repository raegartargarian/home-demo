import { Button } from "@/components/ui/button";
import { vaultDetailSelectors } from "@/containers/vaultDetail/selectors";
import { cn } from "@/lib/utils";
import { FilterChip } from "@/shared/components/FilterChip";
import {
  FIELD_CLASS,
  FieldGroup,
  LABEL_CLASS,
} from "@/shared/components/FormField";
import { VaultImage } from "@/shared/components/VaultImage";
import {
  ALL_STREAM_CODES,
  customCategoryFor,
  knownSectionForTypedName,
  SECTION_SLUG_MAX_LENGTH,
  STREAM_CATEGORIES,
  StreamCategoryCode,
  toSectionSlug,
} from "@/shared/constants/streams";
import { parseHomeFacts } from "@/shared/utils/homeFacts";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ImagePlus, Plus, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { homeImageCid } from "../image";
import { NV_LABEL_MAX_LENGTH, sanitizeNestedLabel } from "../naming";
import { projectVaultsSelectors } from "../selectors";
import { projectVaultsActions } from "../slice";

/**
 * The sections a job usually needs, per the architecture doc's worked example
 * — photos and invoices, the warranty, the permit, the insurance claim. The
 * home profile is the house's original identity, which a project rarely
 * touches, so it is offered but not ticked.
 */
const DEFAULT_SECTIONS: StreamCategoryCode[] = [
  "maintenance-upgrades",
  "systems-warranties",
  "property-records",
  "personal-vault",
];

/**
 * Starts a project under the home whose page is open.
 *
 * Mounted once, app-wide (see App.tsx), and opened by the Projects block with
 * the home's id. The same full-page shell as filing a record, so the two forms
 * the app has look like one app; the run itself belongs to the card in the
 * grid once this closes.
 */
export const CreateProjectVaultModal: React.FC = () => {
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  const { parentVaultId } = useSelector(projectVaultsSelectors.createModal);
  const creation = useSelector(projectVaultsSelectors.creation);
  // The block only opens this from the home's own page, so the home is the
  // vault already loaded — no second fetch.
  const home = useSelector(vaultDetailSelectors.vault);
  const isOpen = parentVaultId !== null;

  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] =
    useState<StreamCategoryCode[]>(DEFAULT_SECTIONS);
  // Sections someone typed, as slugs. Kept apart from the five so the taxonomy
  // still submits in its own order and these follow it.
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [sectionDraft, setSectionDraft] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [useHomePhoto, setUseHomePhoto] = useState(true);
  const [photoError, setPhotoError] = useState("");

  const homeHasPhoto = !!(home && homeImageCid(home));
  const homeAddress = home ? (parseHomeFacts(home)?.address ?? home.name) : "";

  useEffect(() => {
    if (!isOpen) return;
    setLabel("");
    setDescription("");
    setSections(DEFAULT_SECTIONS);
    setCustomSections([]);
    setSectionDraft("");
    setPhoto(null);
    setPhotoError("");
  }, [isOpen]);

  // A home without a photo has nothing to hand down, so the choice is made.
  useEffect(() => {
    setUseHomePhoto(homeHasPhoto);
  }, [homeHasPhoto, isOpen]);

  // Revoked on the way out: a preview held open for a form that may be closed
  // without submitting is a file the tab cannot let go of.
  const photoUrl = useMemo(
    () => (photo ? URL.createObjectURL(photo) : null),
    [photo],
  );
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const close = () => dispatch(projectVaultsActions.closeCreateModal());

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape")
        dispatch(projectVaultsActions.closeCreateModal());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, dispatch]);

  const toggleSection = (code: StreamCategoryCode) =>
    setSections((current) =>
      current.includes(code)
        ? current.filter((it) => it !== code)
        : [...current, code],
    );

  const draftSlug = toSectionSlug(sectionDraft);
  // Typing the name of one of the five ticks that chip instead of making a
  // near-duplicate beside it, which would file the same paperwork twice.
  // Matched on the name as shown, not only the slug: three of the five have a
  // label that does not slugify onto their code.
  const draftIsKnown = knownSectionForTypedName(sectionDraft);
  const canAddSection =
    draftSlug.length > 0 &&
    !customSections.includes(draftSlug) &&
    !(
      draftIsKnown && sections.includes(draftIsKnown.code as StreamCategoryCode)
    );

  const addSection = () => {
    if (!canAddSection) return;
    if (draftIsKnown) {
      toggleSection(draftIsKnown.code as StreamCategoryCode);
    } else {
      setCustomSections((current) => [...current, draftSlug]);
    }
    setSectionDraft("");
  };

  const removeSection = (slug: string) =>
    setCustomSections((current) => current.filter((it) => it !== slug));

  const acceptPhoto = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !/\.heic$/i.test(file.name)) {
      setPhotoError("Choose an image file for the cover.");
      return;
    }
    setPhotoError("");
    setPhoto(file);
    setUseHomePhoto(false);
  };

  const cleanLabel = sanitizeNestedLabel(label);
  const hasPhoto = useHomePhoto ? homeHasPhoto : photo !== null;
  const isCreating = creation?.status === "running";
  const canSubmit =
    !!parentVaultId &&
    cleanLabel.length > 0 &&
    description.trim().length > 0 &&
    sections.length + customSections.length > 0 &&
    hasPhoto &&
    !isCreating;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !parentVaultId) return;

    dispatch(
      projectVaultsActions.createProject({
        parentVaultId,
        label: cleanLabel,
        description: description.trim(),
        // The taxonomy in its own order first, whatever order they were
        // ticked in, then the typed ones in the order they were added.
        sections: [
          ...ALL_STREAM_CODES.filter((code) => sections.includes(code)),
          ...customSections,
        ],
        image:
          useHomePhoto || !photo
            ? { kind: "home" }
            : { kind: "file", file: photo },
      }),
    );
    close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] bg-surface-sunken"
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
            aria-label="Start a project"
            className="relative flex h-full flex-col"
          >
            <header className="pointer-events-none absolute inset-x-3 top-3 z-10 md:inset-x-6 md:top-4">
              <div className="glass pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-full py-2.5 pl-6 pr-2.5">
                <div className="min-w-0">
                  <h2 className="text-base font-medium tracking-tight text-ink">
                    Start a project
                  </h2>
                  <p className="truncate text-xs text-ink-muted">
                    {homeAddress
                      ? `A project of ${homeAddress}`
                      : "Under this home"}
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
                <div className="mx-auto grid max-w-5xl grid-cols-1 gap-x-12 gap-y-10 px-5 pb-28 pt-[6.5rem] sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px]">
                  <div className="space-y-10">
                    <FieldGroup
                      title="What the job is"
                      hint="A project gathers one job's paperwork in one place — estimate, photos, permit and warranty together."
                    >
                      <div className="space-y-1.5">
                        <label htmlFor="project-name" className={LABEL_CLASS}>
                          Project name
                        </label>
                        <input
                          id="project-name"
                          value={label}
                          onChange={(event) => setLabel(event.target.value)}
                          maxLength={NV_LABEL_MAX_LENGTH}
                          placeholder="e.g. Kitchen Remodel – 2024"
                          autoFocus
                          className={FIELD_CLASS}
                        />
                        <p className="text-xs text-ink-subtle">
                          How you would say it out loud — the job and the year.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="project-description"
                          className={LABEL_CLASS}
                        >
                          Description
                        </label>
                        <textarea
                          id="project-description"
                          value={description}
                          onChange={(event) =>
                            setDescription(event.target.value)
                          }
                          rows={3}
                          placeholder="Who is doing the work, what it covers, when it started."
                          className={cn(FIELD_CLASS, "resize-none")}
                        />
                      </div>
                    </FieldGroup>

                    <FieldGroup
                      title="Sections"
                      hint="The same sections the home has. Tick the ones this job will produce paperwork for."
                    >
                      <div
                        role="group"
                        aria-label="Sections the project will have"
                        className="flex flex-wrap gap-1.5"
                      >
                        {ALL_STREAM_CODES.map((code) => {
                          const category = STREAM_CATEGORIES[code];
                          return (
                            <span key={code} data-category={code}>
                              <FilterChip
                                label={category.label}
                                icon={category.icon}
                                isActive={sections.includes(code)}
                                onToggle={() => toggleSection(code)}
                              />
                            </span>
                          );
                        })}
                      </div>
                      {customSections.length > 0 && (
                        <div
                          role="group"
                          aria-label="Sections you named"
                          className="mt-2 flex flex-wrap gap-1.5"
                        >
                          {customSections.map((slug) => {
                            const category = customCategoryFor(slug);
                            return (
                              <span key={slug} data-category={category.code}>
                                <FilterChip
                                  label={category.label}
                                  icon={category.icon}
                                  isActive
                                  onToggle={() => removeSection(slug)}
                                />
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* A job produces paperwork the five sections do not
                          name. The slug is what the backend stores, so it is
                          shown as it is typed rather than after the fact. */}
                      {/* `items-end` rather than a hand-tuned top margin: the
                          label sits above the input, so aligning the bottoms
                          is what puts the button on the field's own line. */}
                      <div className="mt-3 flex items-end gap-2">
                        <div className="min-w-0 flex-1">
                          <label
                            htmlFor="project-section"
                            className={LABEL_CLASS}
                          >
                            Add your own
                          </label>
                          <input
                            id="project-section"
                            value={sectionDraft}
                            onChange={(event) =>
                              setSectionDraft(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key !== "Enter") return;
                              // The form's own submit is the Create button.
                              event.preventDefault();
                              addSection();
                            }}
                            maxLength={SECTION_SLUG_MAX_LENGTH * 2}
                            placeholder="Landscaping"
                            className={FIELD_CLASS}
                          />
                        </div>
                        {/* Default size, not `sm`: the field is `py-2` on
                            `text-sm`, which is 36px, and that is exactly the
                            default button height. `sm` is 32px and would sit
                            four pixels short of the field it belongs to. */}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addSection}
                          disabled={!canAddSection}
                          className="shrink-0"
                        >
                          <Plus />
                          Add
                        </Button>
                      </div>

                      {draftSlug.length > 0 && (
                        <p className="text-xs text-ink-subtle">
                          {draftIsKnown
                            ? `That is ${draftIsKnown.label}. Adding it will tick it above.`
                            : `Filed as ${draftSlug}.`}
                        </p>
                      )}

                      {sections.length + customSections.length === 0 && (
                        <p className="text-xs text-alert">
                          A project needs at least one section.
                        </p>
                      )}
                    </FieldGroup>
                  </div>

                  <div className="space-y-6 lg:sticky lg:top-8 lg:self-start">
                    <FieldGroup
                      title="Cover"
                      hint="What the project's card shows. The home's own photo, unless a picture of the work says it better."
                    >
                      <div
                        role="radiogroup"
                        aria-label="Cover photo"
                        className="space-y-2"
                      >
                        <label
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                            useHomePhoto
                              ? "border-blueprint bg-surface-raised"
                              : "border-line bg-surface-raised hover:border-line-strong",
                            !homeHasPhoto && "cursor-not-allowed opacity-60",
                          )}
                        >
                          <input
                            type="radio"
                            name="project-cover"
                            checked={useHomePhoto}
                            disabled={!homeHasPhoto}
                            onChange={() => setUseHomePhoto(true)}
                            className="sr-only"
                          />
                          <span className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-inset">
                            {home && (
                              <VaultImage
                                vault={home}
                                imgClassName="h-full w-full object-cover"
                                iconClassName="h-5 w-5 text-ink-subtle"
                              />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-ink">
                              Use the home's photo
                            </span>
                            <span className="block text-xs text-ink-subtle">
                              {homeHasPhoto
                                ? "The project takes the house's picture."
                                : "This home has no photo to reuse."}
                            </span>
                          </span>
                        </label>

                        <label
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                            !useHomePhoto
                              ? "border-blueprint bg-surface-raised"
                              : "border-line bg-surface-raised hover:border-line-strong",
                          )}
                        >
                          <input
                            type="radio"
                            name="project-cover"
                            checked={!useHomePhoto}
                            onChange={() => setUseHomePhoto(false)}
                            className="sr-only"
                          />
                          <span className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-inset">
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt=""
                                className="h-full w-full object-cover"
                                draggable={false}
                              />
                            ) : (
                              <ImagePlus
                                className="h-5 w-5 text-ink-subtle"
                                aria-hidden
                              />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-ink">
                              Choose a photo
                            </span>
                            <span className="block truncate text-xs text-ink-subtle">
                              {photo
                                ? photo.name
                                : "A picture of the work, from your device."}
                            </span>
                          </span>
                        </label>

                        {!useHomePhoto && (
                          <input
                            type="file"
                            accept="image/*,.heic"
                            aria-label="Choose a cover photo"
                            onChange={(event) =>
                              acceptPhoto(event.target.files?.[0])
                            }
                            className="block w-full text-xs text-ink-muted file:mr-3 file:rounded-full file:border file:border-line file:bg-surface-raised file:px-3.5 file:py-1.5 file:text-xs file:font-medium file:text-ink hover:file:bg-surface-inset"
                          />
                        )}
                      </div>
                    </FieldGroup>

                    {photoError && (
                      <div className="flex items-start gap-2 rounded-lg border border-alert-line bg-alert-surface p-3 text-sm text-alert">
                        <AlertCircle
                          className="mt-0.5 h-4 w-4 shrink-0"
                          aria-hidden
                        />
                        <span>{photoError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <footer className="pointer-events-none absolute inset-x-3 bottom-3 z-10 md:inset-x-6 md:bottom-4">
                <div className="glass pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-full py-2.5 pl-6 pr-2.5">
                  <p className="hidden text-xs text-ink-subtle sm:block">
                    Setting up takes a minute or two — it runs in the grid while
                    you carry on.
                  </p>
                  <div className="flex flex-1 justify-end gap-2">
                    <Button type="button" variant="outline" onClick={close}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!canSubmit}>
                      Start project
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

export default CreateProjectVaultModal;
