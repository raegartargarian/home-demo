import { Chip } from "@/shared/components/Chip";
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

  return (
    <Chip
      label={isVerified ? "Verified" : "Pending"}
      tone={isVerified ? "verified" : "warn"}
      icon={isVerified ? ShieldCheck : ShieldQuestion}
      iconOnly={compact}
      title={
        isVerified
          ? "Anchored on the ledger — this record cannot be altered after the fact"
          : "Not yet anchored on the ledger"
      }
      className={className}
    />
  );
};

export default VerificationBadge;
