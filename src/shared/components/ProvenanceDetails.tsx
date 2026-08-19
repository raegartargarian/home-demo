import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CopyableHash } from "@/shared/components/CopyableHash";
import { VerificationBadge } from "@/shared/components/VerificationBadge";
import { formatDate } from "@/shared/utils/dateFormatter";
import { getLedgerNameFromServerName } from "@/shared/utils/networks";
import { ChevronDown } from "lucide-react";
import React, { useState } from "react";

export interface ProvenanceRow {
  label: string;
  value: string;
  /** Hashes and codes are shown shortened, with a copy affordance. */
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
  /** Explorer link, proof download: the things you do *with* the provenance. */
  actions?: React.ReactNode;
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
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const detail: ProvenanceRow[] = [
    ...(txHash ? [{ label: "Transaction", value: txHash, copyable: true }] : []),
    ...rows,
    ...(ledger
      ? [{ label: "Network", value: getLedgerNameFromServerName(ledger) || ledger }]
      : []),
    ...(createdAt ? [{ label: createdLabel, value: formatDate(createdAt) }] : []),
  ];

  // Nothing to prove and nothing to do with it: render nothing rather than an
  // empty disclosure that opens onto a blank panel.
  if (detail.length === 0 && !actions) return null;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <VerificationBadge txHash={txHash ?? undefined} />

        {detail.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            className="gap-1"
          >
            Details
            <ChevronDown
              className={cn("transition-transform", isOpen && "rotate-180")}
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

      {isOpen && detail.length > 0 && (
        <dl className="mt-3 grid gap-x-6 gap-y-2 rounded-lg border border-line bg-surface-sunken p-3 sm:grid-cols-2">
          {detail.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-3"
            >
              <dt className="text-xs text-ink-subtle">{row.label}</dt>
              <dd className="min-w-0 text-xs text-ink-muted">
                {row.copyable ? (
                  <CopyableHash value={row.value} />
                ) : (
                  <span className="truncate">{row.value}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};

export default ProvenanceDetails;
