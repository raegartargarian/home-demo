import { cn } from "@/lib/utils";
import { ArrowLeftRight, Lock } from "lucide-react";
import React from "react";

interface TransferBadgeProps {
  /** From `StreamCategory.transfersOnSale`. */
  transfersOnSale: boolean;
  /** Drop the label and render the icon only — for dense rows. */
  compact?: boolean;
  className?: string;
}

/**
 * Surfaces the transfer boundary at the heart of the Property Vault: four
 * sections travel with the property, the Personal Vault does not.
 *
 * This is the single most load-bearing distinction in the architecture, and it
 * is invisible unless something says so on the stream itself — a homeowner
 * uploading an insurance claim needs to know it will not reach the buyer, and a
 * buyer needs to know the maintenance history will.
 */
export const TransferBadge: React.FC<TransferBadgeProps> = ({
  transfersOnSale,
  compact = false,
  className,
}) => {
  const Icon = transfersOnSale ? ArrowLeftRight : Lock;
  const label = transfersOnSale ? "Transfers at sale" : "Private";
  const title = transfersOnSale
    ? "Travels with the property when ownership changes"
    : "Belongs to the current homeowner — detached at sale and never transferred to the buyer";

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        transfersOnSale
          ? "border-line bg-surface-inset text-ink-muted"
          : "border-cat-line bg-cat-surface text-cat-ink",
        className
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {!compact && label}
      {compact && <span className="sr-only">{label}</span>}
    </span>
  );
};

export default TransferBadge;
