import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldQuestion } from "lucide-react";
import React from "react";

interface VerificationBadgeProps {
  /** Presence of a ledger transaction hash is what makes a record verifiable. */
  txHash?: string | null;
  /** Drop the label and render the icon only — for dense rows. */
  compact?: boolean;
  className?: string;
}

/**
 * Ledger proof, and nothing else.
 *
 * The `verified` token is reserved for this component's colour. Green elsewhere
 * in the app means "success" or "complete", which is a different claim — a
 * record can be complete and unverified, or verified and out of date.
 */
export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  txHash,
  compact = false,
  className,
}) => {
  const isVerified = Boolean(txHash);
  const Icon = isVerified ? ShieldCheck : ShieldQuestion;
  const label = isVerified ? "Verified" : "Pending";
  const title = isVerified
    ? "Anchored on the ledger — this record cannot be altered after the fact"
    : "Not yet anchored on the ledger";

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium",
        isVerified
          ? "border-verified-line bg-verified-surface text-verified"
          : "border-warn-line bg-warn-surface text-warn",
        className
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {!compact && label}
      {compact && <span className="sr-only">{label}</span>}
    </span>
  );
};

export default VerificationBadge;
