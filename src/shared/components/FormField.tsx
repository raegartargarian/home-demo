import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
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
