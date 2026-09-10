import type { RefObject } from "react";

/**
 * Why a form cannot be submitted yet, and where to go about it.
 *
 * The three full-page forms used to answer that question by greying out their
 * button, which is the one answer that explains nothing: the reader is told no
 * and left to audit their own form for the reason. Worse on these forms than
 * most, because they are a page tall — the field holding it up is often not on
 * screen when the button is.
 *
 * So the button always submits, and a submit that cannot go through spends its
 * click saying what is missing and putting the reader in front of it.
 */
export interface FormProblem {
  /**
   * Which control this is about. Held so the field can mark itself while the
   * message stands — a sentence at the foot of a page-tall form is easy to
   * read and still not know which box it meant.
   */
  key: string;
  /** True when the rule is *not* satisfied. */
  unmet: boolean;
  /** What is missing, in the homeowner's words, not the field's name. */
  message: string;
  /** Where to send them. */
  field: RefObject<HTMLElement | null>;
}

/** What a form keeps once it has pointed at something. */
export interface RaisedProblem {
  key: string;
  message: string;
}

/**
 * The first rule the form does not satisfy.
 *
 * Order matters: list the rules in the order the fields are read, so someone
 * with three empty boxes is sent to the first one rather than the last one to
 * be checked, and filling them in walks down the page.
 */
export const firstProblem = (rules: FormProblem[]): FormProblem | null =>
  rules.find((rule) => rule.unmet) ?? null;

/** Puts the reader in front of the field that is holding them up. */
export const revealProblem = (problem: FormProblem): void => {
  const field = problem.field.current;
  if (!field) return;

  // Focus first with its scrolling suppressed, then scroll deliberately.
  // Letting focus do the scrolling snaps the field to whichever edge it
  // entered from, which reads as a jump rather than as being shown something.
  field.focus({ preventScroll: true });
  field.scrollIntoView({
    block: "center",
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
};
