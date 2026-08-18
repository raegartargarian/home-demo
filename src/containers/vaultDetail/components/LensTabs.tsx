import { motion, useReducedMotion } from "framer-motion";
import React from "react";
import { Lens, LENSES } from "./lens";

interface LensTabsProps {
  value: Lens;
  onChange: (lens: Lens) => void;
  className?: string;
}

/**
 * The lens switcher.
 *
 * Same sliding-pill idiom as the main nav (`shared/components/Header.tsx`) — a
 * shared `layoutId` so the indicator travels between tabs rather than cutting.
 * One dataset, several groupings, no navigation cost.
 */
export const LensTabs: React.FC<LensTabsProps> = ({
  value,
  onChange,
  className,
}) => {
  const reduceMotion = useReducedMotion();
  const active = LENSES.find((lens) => lens.id === value);

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Browse this vault by"
        className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-sunken p-1"
      >
        {LENSES.map(({ id, label, icon: Icon }) => {
          const isActive = id === value;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(id)}
              className={[
                "relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5",
                "text-sm font-medium transition-colors",
                isActive ? "text-ink" : "text-ink-muted hover:text-ink",
              ].join(" ")}
            >
              {isActive && (
                <motion.span
                  layoutId="lens-pill"
                  className="absolute inset-0 rounded-full bg-surface-raised shadow-sm"
                  transition={
                    reduceMotion
                      ? { duration: 0.15 }
                      : { type: "spring", stiffness: 400, damping: 32 }
                  }
                />
              )}
              <Icon className="relative h-[15px] w-[15px]" aria-hidden />
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </div>

      {active && (
        <p className="mt-2 text-sm text-ink-muted">{active.hint}</p>
      )}
    </div>
  );
};

export default LensTabs;
