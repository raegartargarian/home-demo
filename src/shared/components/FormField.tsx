import { cn } from "@/lib/utils";
import { CalendarDays, ChevronDown } from "lucide-react";
import React from "react";

/**
 * A field has to look like something you can type into.
 *
 * These were `bg-surface` on a `bg-surface-sunken` page — #F7F5F2 on #F4F4F4,
 * three points of luminance apart — so a row of inputs read as faint rectangles
 * rather than as controls. They lift to the raised surface, take the stronger
 * hairline, and gain a focus ring, which is the app's one accent doing the job
 * it exists for.
 *
 * Shared by every full-page form (filing a record, starting a project) so the
 * two cannot drift into two ideas of what an input looks like.
 */
export const FIELD_CLASS = [
  "w-full rounded-lg border border-line-strong bg-surface-raised",
  "px-3 py-2 text-sm text-ink outline-none transition-colors",
  "placeholder:text-ink-subtle",
  "focus-visible:border-blueprint focus-visible:ring-2 focus-visible:ring-ring/40",
].join(" ");

export const LABEL_CLASS = "text-sm font-medium text-ink";

/**
 * A field the form has just pointed at.
 *
 * The message says what is missing and the focus ring says where, but focus is
 * spent the moment the reader clicks anywhere else — and on a form this tall
 * that happens on the way to reading the message. The red hairline is what
 * stays. It is dropped as soon as the field is touched, so it marks *this*
 * attempt rather than accumulating into a form covered in red.
 *
 * Overrides the focus colours too: a field that is both focused and wrong
 * should say wrong, not say focused.
 */
export const FIELD_INVALID_CLASS = [
  "border-alert",
  "focus-visible:border-alert focus-visible:ring-alert/30",
].join(" ");

/**
 * A set of controls the form is pointing at — a chip group, a drop zone.
 *
 * A ring rather than a border, offset off the group's own edge: these are
 * several controls with their own outlines, and a border drawn round the lot
 * would read as a box that had appeared out of nowhere.
 */
export const GROUP_INVALID_CLASS =
  "ring-2 ring-alert/40 ring-offset-4 ring-offset-surface-sunken";

/**
 * The attributes a field takes when the form may be pointing at it.
 *
 * Spread last, so the className it composes is the one that lands:
 * `{...invalidIf(problem?.key === "name", FIELD_CLASS)}`. The two attributes
 * travel together on purpose — a red hairline with no `aria-invalid` marks the
 * field for people who can see it and for nobody else.
 */
export const invalidIf = (isInvalid: boolean, base: string) => ({
  "aria-invalid": isInvalid || undefined,
  className: cn(base, isInvalid && FIELD_INVALID_CLASS),
});

/**
 * The line at the foot of a full-page form: its standing hint, or the reason
 * the last submit did not go through. One or the other, never both — the
 * reason is the only thing worth the space at that moment.
 */
export const FormNote: React.FC<{
  problem?: string | null;
  children: React.ReactNode;
}> = ({ problem, children }) =>
  problem ? (
    <p className="text-xs font-medium text-alert">{problem}</p>
  ) : (
    <p className="hidden text-xs text-ink-subtle sm:block">{children}</p>
  );

/**
 * A select, with the browser's own arrow turned off.
 *
 * Left native, the chevron is drawn by the platform and pinned to the field's
 * outer edge with the platform's inset — around 8px against the 12px every
 * other field indents its content by. On a full-width field that reads as an
 * arrow belonging to the window rather than to the form. `appearance-none`
 * takes it away and `SelectShell` puts ours back on the field's own padding.
 */
export const SELECT_CLASS = cn(
  FIELD_CLASS,
  "cursor-pointer appearance-none pr-9",
);

/** Positions the chevron for a `SELECT_CLASS` select. Wrap one of these. */
export const SelectShell: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn("relative", className)}>
    {children}
    <ChevronDown
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
      aria-hidden
    />
  </div>
);

/**
 * A native date input, with the platform's own furniture turned off.
 *
 * `<input type="date">` draws a calendar indicator the page has no say over:
 * the platform's glyph, in the platform's colour, on the platform's inset —
 * the same complaint the select had, one field along. Hiding it and drawing
 * ours is only half the job, though. The native picker can only be opened from
 * that indicator, and `showPicker()` is not everywhere yet, so the invisible
 * indicator is stretched over the whole field instead: the control still opens
 * the way the platform intends, from anywhere on it, and looks like the rest of
 * the form while doing it.
 */
export const DATE_CLASS = cn(
  FIELD_CLASS,
  "relative cursor-pointer appearance-none pr-9",
  "[&::-webkit-calendar-picker-indicator]:absolute",
  "[&::-webkit-calendar-picker-indicator]:inset-0",
  "[&::-webkit-calendar-picker-indicator]:h-full",
  "[&::-webkit-calendar-picker-indicator]:w-full",
  "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
  "[&::-webkit-calendar-picker-indicator]:opacity-0",
);

/** Positions our calendar glyph for a `DATE_CLASS` input. Wrap one of these. */
export const DateShell: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn("relative", className)}>
    {children}
    <CalendarDays
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
      aria-hidden
    />
  </div>
);

/** A titled block of fields. The form is a full page, so it needs signposting. */
export const FieldGroup: React.FC<{
  title: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ title, hint, children }) => (
  <section className="space-y-4">
    <div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-ink-subtle">{hint}</p>}
    </div>
    {children}
  </section>
);
