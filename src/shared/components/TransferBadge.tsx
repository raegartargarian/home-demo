import { Chip } from "@/shared/components/Chip";
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
 *
 * A thin wrapper over `Chip`: what is worth keeping here is the meaning, not
 * the drawing. The `title` carries the sentence the label cannot.
 */
export const TransferBadge: React.FC<TransferBadgeProps> = ({
  transfersOnSale,
  compact = false,
  className,
}) => (
  <Chip
    label={transfersOnSale ? "Transfers at sale" : "Private"}
    tone={transfersOnSale ? "neutral" : "category"}
    icon={transfersOnSale ? ArrowLeftRight : Lock}
    iconOnly={compact}
    title={
      transfersOnSale
        ? "Travels with the property when ownership changes"
        : "Belongs to the current homeowner — detached at sale and never transferred to the buyer"
    }
    className={className}
  />
);

export default TransferBadge;
