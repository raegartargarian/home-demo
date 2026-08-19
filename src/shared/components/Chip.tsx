import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";

export type ChipTone = "neutral" | "verified" | "warn" | "alert" | "category";

/**
 * One tone per *meaning*, and the palette behind each is decided once in
 * `styles/main.scss`. `category` resolves against the nearest `[data-category]`
 * ancestor, so a chip on a section page takes that section's accent without
 * being told which section it is on.
 */
const TONE: Record<ChipTone, string> = {
  neutral: "border-line bg-surface-inset text-ink-muted",
  verified: "border-verified-line bg-verified-surface text-verified",
  warn: "border-warn-line bg-warn-surface text-warn",
  alert: "border-alert-line bg-alert-surface text-alert",
  category: "border-cat-line bg-cat-surface text-cat-ink",
};

/**
 * Two sizes, and the difference is whether a finger has to hit it. `sm` labels
 * something; `md` is pressed, so it gets a real target rather than a 20px one.
 */
const SIZE = {
  sm: "gap-1.5 px-2 py-0.5 text-[11px] [&_svg]:size-3",
  md: "gap-1.5 px-3 py-1 text-xs [&_svg]:size-3",
} as const;

interface ChipProps {
  label: string;
  tone?: ChipTone;
  size?: keyof typeof SIZE;
  icon?: LucideIcon;
  /** Shown after the label — how many records the chip stands for. */
  count?: number;
  /** Native `title`, for the chips whose meaning needs a sentence. */
  title?: string;
  /** Render the label to screen readers only, leaving the icon. Dense rows. */
  iconOnly?: boolean;
  /**
   * Supplying this makes the chip a toggle: a `button` with `aria-pressed`,
   * which is the honest role for something that combines with its neighbours
   * rather than replacing them. Without it the chip is a `span` that states a
   * fact.
   */
  onToggle?: () => void;
  pressed?: boolean;
  className?: string;
}

/**
 * The one chip.
 *
 * There used to be four: the shadcn `Badge` (filled, 12px semibold, no border),
 * `TransferBadge` and `VerificationBadge` (tinted, 11px medium, bordered, with
 * an icon) and `FilterChip` (bordered, 12px medium, larger padding). Three
 * paddings, two type sizes, two weights and two fill treatments — so "Verified"
 * and "Completed", which are the same kind of fact about the same record, drew
 * themselves differently and sat side by side saying so.
 *
 * Everything that labels a fact or toggles a filter is this component now. The
 * quiet tinted-and-bordered look wins over the filled one, because the page is
 * carried by photographs and warm neutrals, and a row of saturated pills
 * competes with them.
 */
export const Chip: React.FC<ChipProps> = ({
  label,
  tone = "neutral",
  size = "sm",
  icon: Icon,
  count,
  title,
  iconOnly = false,
  onToggle,
  pressed,
  className,
}) => {
  const content = (
    <>
      {Icon && <Icon className="shrink-0" aria-hidden />}
      {iconOnly ? <span className="sr-only">{label}</span> : label}
      {count !== undefined && <span className="tabular-nums">{count}</span>}
    </>
  );

  const classes = cn(
    "inline-flex shrink-0 items-center rounded-full border font-medium",
    SIZE[size],
    className,
  );

  if (!onToggle) {
    return (
      <span title={title} className={cn(classes, TONE[tone])}>
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      title={title}
      aria-pressed={pressed}
      onClick={onToggle}
      className={cn(
        classes,
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        pressed
          ? TONE[tone]
          : "border-line bg-surface-raised text-ink-muted hover:border-ink-subtle hover:text-ink",
      )}
    >
      {content}
    </button>
  );
};

export default Chip;
