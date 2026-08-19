import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";

interface FilterChipProps {
  label: string;
  /** Pressed state. Drives `aria-pressed`, not just the colour. */
  isActive: boolean;
  onToggle: () => void;
  icon?: LucideIcon;
  /** Shown after the label — how many records the chip would leave. */
  count?: number;
  className?: string;
}

/**
 * One toggle in a filter bar.
 *
 * Hand-rolled because there is no chip or toggle primitive in the app and no
 * Radix toggle-group installed. The look is `TransferBadge`'s — the established
 * chip shape here — and the pressed state uses the `--cat-*` variables, so a
 * chip on a section page takes that section's accent without being told which
 * section it is on.
 *
 * It is a `button` with `aria-pressed`, which is the honest role for something
 * that toggles — these options combine rather than replacing one another, so
 * they are not tabs. `shrink-0` matters — the bar that holds these scrolls
 * horizontally, and a chip that shrinks turns into an ellipsis.
 */
export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  isActive,
  onToggle,
  icon: Icon,
  count,
  className,
}) => (
  <button
    type="button"
    aria-pressed={isActive}
    onClick={onToggle}
    className={cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1",
      "text-xs font-medium transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cat",
      isActive
        ? "border-cat-line bg-cat-surface text-cat-ink"
        : "border-line bg-surface-raised text-ink-muted hover:border-ink-subtle hover:text-ink",
      className,
    )}
  >
    {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden />}
    {label}
    {count !== undefined && (
      <span className={cn("tabular-nums", !isActive && "text-ink-subtle")}>
        {count}
      </span>
    )}
  </button>
);

export default FilterChip;
