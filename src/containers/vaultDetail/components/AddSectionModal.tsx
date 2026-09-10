import { wellFor } from "@/shared/components/PageContainer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FilterChip } from "@/shared/components/FilterChip";
import {
  FIELD_CLASS,
  FieldGroup,
  FormNote,
  invalidIf,
  LABEL_CLASS,
} from "@/shared/components/FormField";
import {
  ALL_STREAM_CODES,
  customCategoryFor,
  knownSectionForTypedName,
  SECTION_SLUG_MAX_LENGTH,
  STREAM_CATEGORIES,
  StreamCategory,
  toSectionSlug,
} from "@/shared/constants/streams";
import { VaultStreamDto } from "@/shared/types/vault";
import {
  firstProblem,
  revealProblem,
  type FormProblem,
  type RaisedProblem,
} from "@/shared/utils/formProblems";
import { categoryForStream } from "@/shared/utils/streamHelpers";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { vaultDetailSelectors } from "../selectors";
import { vaultDetailActions } from "../slice";

/** The slug a stream was created under, which is what a duplicate would clash with. */
const slugOf = (stream: VaultStreamDto): string =>
  toSectionSlug(stream.mapping || stream.asset_code || "");

/**
 * Adds a section to a vault that already has some.
 *
 * The five-section taxonomy is what a home is seeded with, and it is enough
 * for most houses. It is not enough for all of them — a workshop, a pool, a
 * rental unit — and the alternative to letting one be added is filing that
 * paperwork somewhere it does not belong. So the taxonomy stays the default
 * and this is the way past it, which is the same bargain the project form
 * already strikes with its "add your own".
 *
 * Mounted once, app-wide (see App.tsx). The same full-page shell as filing a
 * record and starting a project, so the app has one idea of what a form is.
 */
export const AddSectionModal: React.FC = () => {
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  const { vaultId } = useSelector(vaultDetailSelectors.addSectionModal);
  const vault = useSelector(vaultDetailSelectors.vault);
  const creation = useSelector(vaultDetailSelectors.sectionCreation);
  const isOpen = vaultId !== null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [problem, setProblem] = useState<RaisedProblem | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setDescription("");
    setProblem(null);
  }, [isOpen]);

  const close = () => dispatch(vaultDetailActions.closeAddSectionModal());

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape")
        dispatch(vaultDetailActions.closeAddSectionModal());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, dispatch]);

  const streams = useMemo(() => vault?.streams ?? [], [vault?.streams]);

  // What the vault already has, in both currencies: the accent codes the five
  // resolve to, and the raw slugs a named section was created under. A typed
  // name is checked against whichever of the two it turns out to be.
  const taken = useMemo(() => {
    const codes = new Set<string>();
    const slugs = new Set<string>();
    for (const stream of streams) {
      const category = categoryForStream(stream);
      if (category && !category.isCustom) codes.add(category.code);
      const slug = slugOf(stream);
      if (slug) slugs.add(slug);
    }
    return { codes, slugs };
  }, [streams]);

  /** The taxonomy's own sections this vault is missing, offered as one tap. */
  const missing: StreamCategory[] = useMemo(
    () =>
      ALL_STREAM_CODES.filter((code) => !taken.codes.has(code)).map(
        (code) => STREAM_CATEGORIES[code],
      ),
    [taken],
  );

  const slug = toSectionSlug(name);
  // Typing the name of one of the five means that one, not a near-duplicate
  // beside it. Matched on the label as shown, because three of the five have a
  // label that does not slugify onto their own code.
  const known = knownSectionForTypedName(name);
  const isDuplicate = known
    ? taken.codes.has(known.code)
    : taken.slugs.has(slug);

  // The code for one of the five, so it resolves to its own section, colour and
  // copy — the slug of its label would not.
  const mapping = known ? known.code : slug;
  const preview = known ?? (slug ? customCategoryFor(slug) : null);

  const PreviewIcon = preview?.icon;

  const isAdding = creation?.status === "running";

  // In the order the form is read, so filling them in walks down the page.
  const rules: FormProblem[] = [
    {
      key: "name",
      unmet: slug.length === 0,
      message: "Give the section a name first.",
      field: nameRef,
    },
    {
      key: "name",
      unmet: isDuplicate,
      message: known
        ? `${known.label} is already one of this vault's sections.`
        : "This vault already has a section by that name.",
      field: nameRef,
    },
  ];

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!vaultId || isAdding) return;

    const found = firstProblem(rules);
    if (found) {
      setProblem({ key: found.key, message: found.message });
      revealProblem(found);
      return;
    }
    if (!preview) return;

    setProblem(null);
    dispatch(
      vaultDetailActions.addSectionStart({
        vaultId,
        mapping,
        label: preview.label,
        description: description.trim(),
      }),
    );
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
            aria-label="Add a section"
            className="relative flex h-full flex-col"
          >
            <header className="pointer-events-none absolute inset-x-0 top-3 z-10 md:top-4">
              <div className={wellFor("wide")}>
                <div className="glass pointer-events-auto flex items-center justify-between gap-4 rounded-full py-2.5 pl-6 pr-2.5">
                  <div className="min-w-0">
                    <h2 className="text-base font-medium tracking-tight text-ink">
                      Add a section
                    </h2>
                    <p className="truncate text-xs text-ink-muted">
                      {vault?.name ?? "This vault"}
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
              </div>
            </header>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div
                  className={`${wellFor("wide")} grid grid-cols-1 gap-x-12 gap-y-10 pb-28 pt-[6.5rem] lg:grid-cols-[minmax(0,1fr)_380px]`}
                >
                  <div className="space-y-10">
                    {missing.length > 0 && (
                      <FieldGroup
                        title="From the template"
                        hint="Sections this vault was not seeded with. One tap fills the name in."
                      >
                        <div
                          role="group"
                          aria-label="Sections from the template"
                          className="flex flex-wrap gap-1.5"
                        >
                          {missing.map((category) => (
                            <span
                              key={category.code}
                              data-category={category.code}
                            >
                              <FilterChip
                                label={category.label}
                                icon={category.icon}
                                isActive={known?.code === category.code}
                                onToggle={() =>
                                  setName(
                                    known?.code === category.code
                                      ? ""
                                      : category.label,
                                  )
                                }
                              />
                            </span>
                          ))}
                        </div>
                      </FieldGroup>
                    )}

                    <FieldGroup
                      title="The section"
                      hint="What this part of the house is called, in the words you would use for it."
                    >
                      <div className="space-y-1.5">
                        <label htmlFor="section-name" className={LABEL_CLASS}>
                          Name
                        </label>
                        <input
                          id="section-name"
                          ref={nameRef}
                          value={name}
                          onChange={(event) => {
                            setName(event.target.value);
                            setProblem(null);
                          }}
                          maxLength={SECTION_SLUG_MAX_LENGTH * 2}
                          placeholder="e.g. Landscaping"
                          autoFocus
                          {...invalidIf(problem?.key === "name", FIELD_CLASS)}
                        />
                        {isDuplicate ? (
                          <p className="text-xs text-alert">
                            {known
                              ? `${known.label} is already one of this vault's sections.`
                              : "This vault already has a section by that name."}
                          </p>
                        ) : slug.length > 0 ? (
                          <p className="text-xs text-ink-subtle">
                            {known
                              ? `That is ${known.label}, one of the five the template names.`
                              : `Filed as ${slug}.`}
                          </p>
                        ) : (
                          <p className="text-xs text-ink-subtle">
                            A section is permanent. It travels with the
                            property, and its records go with it.
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="section-description"
                          className={LABEL_CLASS}
                        >
                          Description
                          <span className="ml-1.5 font-normal text-ink-subtle">
                            optional
                          </span>
                        </label>
                        <textarea
                          id="section-description"
                          value={description}
                          onChange={(event) =>
                            setDescription(event.target.value)
                          }
                          rows={3}
                          placeholder="What belongs in here."
                          className={cn(FIELD_CLASS, "resize-none")}
                        />
                      </div>
                    </FieldGroup>
                  </div>

                  {/* Where the project form puts its cover. A section has no
                      photograph, so what it can show instead is itself: the
                      accent and glyph it will be given, and the slug the
                      backend will actually store. */}
                  <div className="lg:sticky lg:top-8 lg:self-start">
                    <FieldGroup
                      title="How it will look"
                      hint="The card this section gets on the vault page."
                    >
                      <div
                        data-category={preview?.code}
                        className="pane overflow-hidden rounded-xl"
                      >
                        <div className="h-1 w-full bg-cat" aria-hidden />
                        <div className="flex items-start gap-3 p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cat-line bg-cat-surface">
                            {PreviewIcon && (
                              <PreviewIcon
                                className="h-[18px] w-[18px] text-cat"
                                aria-hidden
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-semibold text-ink">
                              {preview?.label ?? "Your section"}
                            </h3>
                            <p className="mt-0.5 text-xs leading-relaxed text-ink-subtle">
                              {preview?.description ||
                                (slug
                                  ? `Filed as ${slug}.`
                                  : "Name it and it appears here.")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-ink-subtle">
                        {known
                          ? "One of the five the template names, so it keeps the taxonomy's own colour and copy."
                          : "A section you named takes one of the spare accents, chosen from the name so it looks the same everywhere."}
                      </p>
                    </FieldGroup>
                  </div>
                </div>
              </div>

              <footer className="pointer-events-none absolute inset-x-0 bottom-3 z-10 md:bottom-4">
                <div className={wellFor("wide")}>
                  <div className="glass pointer-events-auto flex items-center justify-between gap-4 rounded-full py-2.5 pl-6 pr-2.5">
                    <FormNote problem={problem?.message}>
                      Anchoring takes a moment — it runs in the grid while you
                      carry on.
                    </FormNote>
                    <div className="flex flex-1 justify-end gap-2">
                      <Button type="button" variant="outline" onClick={close}>
                        Cancel
                      </Button>
                      {/* Disabled only while a run is in flight. Not being
                          filled in yet is what the click is for. */}
                      <Button type="submit" disabled={isAdding}>
                        Add section
                      </Button>
                    </div>
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

export default AddSectionModal;
