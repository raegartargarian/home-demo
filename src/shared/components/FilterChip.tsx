import { Chip } from "@/shared/components/Chip";
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
 * The same `Chip` everything else in the app is drawn with, in its pressable
 * size and taking the section accent when on — so a chip on a section page
 * belongs to that section without being told which one it is on.
 *
 * `Chip` renders a `button` with `aria-pressed` as soon as it is given an
 * `onToggle`, which is the honest role for something that combines with its
 * neighbours rather than replacing them.
 */
export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  isActive,
  onToggle,
  icon,
  count,
  className,
}) => (
  <Chip
    label={label}
    tone="category"
    size="md"
    icon={icon}
    count={count}
    pressed={isActive}
    onToggle={onToggle}
    className={className}
  />
);

export default FilterChip;
