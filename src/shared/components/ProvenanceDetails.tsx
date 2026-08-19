import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CopyableHash } from "@/shared/components/CopyableHash";
import { VerificationBadge } from "@/shared/components/VerificationBadge";
import { formatDate } from "@/shared/utils/dateFormatter";
import { getLedgerNameFromServerName } from "@/shared/utils/networks";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import React, { useState } from "react";

export interface ProvenanceRow {
  label: string;
  /**
   * Plain text, or a `Chip` where the value carries a meaning worth colouring —
   * a status, or whether the section transfers at sale.
   */
  value: React.ReactNode;
  /** Hashes and codes are shown shortened, with a copy affordance. Text only. */
  copyable?: boolean;
}

interface ProvenanceDetailsProps {
  txHash?: string | null;
  /** Backend ledger name; rendered through `getLedgerNameFromServerName`. */
  ledger?: string | null;
  createdAt?: string | null;
  /** "Registered" for a vault, "Created" for a stream. */
  createdLabel?: string;
  /** Anything else worth identifying — a stream's asset code, for instance. */
  rows?: ProvenanceRow[];
  /**
   * The page's own action, kept in the collapsed row — the one thing someone
   * came here to do.
   */
  actions?: React.ReactNode;
  /**
   * What you do *with* the provenance: open the explorer, download the proof.
   * These live inside the panel, with the evidence they act on. In the row they
   * were three buttons of equal weight beside the one that matters.
   */
  detailActions?: React.ReactNode;
  className?: string;
}

/**
 * What proves a record is what it says, folded away until it is asked for.
 *
 * The vault and stream headers each used to lay this out in full: a transaction
 * hash, an asset code, a network badge, a registration date and two buttons,
 * across a row as wide as the page. All of it is real and none of it is what
 * someone opens their own home to look at — it is the answer to "prove it",
 * asked rarely and usually once. So the claim stays visible and the evidence
 * sits one click behind it.
 *
 * Shared by both headers so the two pages cannot drift into two different
 * accounts of the same facts.
 */
export const ProvenanceDetails: React.FC<ProvenanceDetailsProps> = ({
  txHash,
  ledger,
  createdAt,
  createdLabel = "Registered",
  rows = [],
  actions,
  detailActions,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  // The dashboard's curve, so this does not introduce a second motion
  // vocabulary. No spring: nothing here is gesture-driven, and a disclosure
  // that overshoots reads as decoration.
  const reveal = reduceMotion
    ? { duration: 0.15, ease: "easeOut" as const }
    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

  const detail: ProvenanceRow[] = [
    ...(txHash ? [{ label: "Transaction", value: txHash, copyable: true }] : []),
    ...rows,
    ...(ledger
      ? [{ label: "Network", value: getLedgerNameFromServerName(ledger) || ledger }]
      : []),
    ...(createdAt ? [{ label: createdLabel, value: formatDate(createdAt) }] : []),
  ];

  const hasPanel = detail.length > 0 || !!detailActions;

  // Nothing to prove and nothing to do with it: render nothing rather than an
  // empty disclosure that opens onto a blank panel.
  if (!hasPanel && !actions) return null;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <VerificationBadge txHash={txHash ?? undefined} />

        {hasPanel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            className="gap-1"
          >
            Details
            {/* Same duration as the panel, so the two halves of the gesture
                finish together. */}
            <ChevronDown
              className={cn(
                "transition-transform duration-[220ms]",
                isOpen && "rotate-180",
              )}
              aria-hidden
            />
          </Button>
        )}

        {actions && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isOpen && hasPanel && (
          // Height has to be animated in JS — `auto` is not interpolable in CSS
          // — and the clip lives on this wrapper rather than an ancestor, so
          // nothing outside the panel gets cropped while it slides.
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={
              reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }
            }
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={reveal}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-lg border border-line bg-surface-sunken p-3">
              {detail.length > 0 && (
                <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                  {detail.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-3"
                    >
                      <dt className="text-xs text-ink-subtle">{row.label}</dt>
                      <dd className="min-w-0 text-xs text-ink-muted">
                        {row.copyable ? (
                          <CopyableHash value={String(row.value)} />
                        ) : (
                          row.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {detailActions && (
                <div
                  className={cn(
                    "flex flex-wrap items-center gap-2",
                    detail.length > 0 && "mt-3 border-t border-line pt-3",
                  )}
                >
                  {detailActions}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProvenanceDetails;
