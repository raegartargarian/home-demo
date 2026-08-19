import { cn } from "@/lib/utils";
import { TransferBadge } from "@/shared/components/TransferBadge";
import { VerificationBadge } from "@/shared/components/VerificationBadge";
import { SectionFileGrid } from "@/shared/components/SectionFileGrid";
import { StreamCategory } from "@/shared/constants/streams";
import { VaultStreamDto } from "@/shared/types/vault";
import { formatStreamName } from "@/shared/utils/streamHelpers";
import { Layers } from "lucide-react";
import React from "react";

interface StreamCardProps {
  stream: VaultStreamDto;
  /** Resolved via `categoryForAssetCode`. Null for a stream outside the template. */
  category: StreamCategory | null;
  /** True record count from the API, which may exceed the previews rendered. */
  total: number;
  /** Record previews. */
  children?: React.ReactNode;
  /**
   * Opens the section's own page. The whole card is the target — omitted only
   * for a stream that is not addressable, which then reads as a plain preview.
   */
  onOpen?: () => void;
  className?: string;
}

/**
 * One section of the Property Vault.
 *
 * All five looks come from a single component: `data-category` on the wrapper
 * repoints the `--cat-*` variables (see `styles/main.scss`), so the icon tile,
 * accent rule and private-vault treatment follow the section without a single
 * conditional className. Adding a section is a CSS block, not a code branch.
 *
 * The card is one target rather than a surface with buttons on it. It used to
 * end in an "Add record" and a "View all…" pair, which put three different
 * click affordances on one card — the title, the footer link and the file
 * tiles — for two destinations. Opening the section is now the card, and filing
 * is the vault header's own button, which is where someone holding a document
 * they have not placed yet already starts.
 */
export const StreamCard: React.FC<StreamCardProps> = ({
  stream,
  category,
  total,
  children,
  onOpen,
  className,
}) => {
  const Icon = category?.icon ?? Layers;
  const label = category?.label ?? formatStreamName(stream);
  const description = category?.description ?? stream.description;
  const isEmpty = total === 0;

  return (
    <section
      data-category={category?.code}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface-raised transition-colors",
        onOpen && "hover:border-line-strong",
        className,
      )}
    >
      {/* The whole card, as one control. An overlay rather than a handler on
          the section: a `<section role="button">` cannot legally contain the
          file tiles, which are buttons themselves. The tiles lift above this
          with their own stacking context below, so they still get their clicks. */}
      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open ${label}`}
          className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cat"
        />
      )}
      {/* Accent rule: the fastest way to tell five sections apart while scrolling. */}
      <div className="h-1 w-full bg-cat" aria-hidden />

      <header className="flex items-start gap-3 border-b border-line p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cat-line bg-cat-surface">
          <Icon className="h-[18px] w-[18px] text-cat" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-ink">{label}</h3>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-ink-subtle">
              {description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-xs tabular-nums text-ink-subtle">
            {total} record{total !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1.5">
            {category && (
              <TransferBadge transfersOnSale={category.transfersOnSale} />
            )}
            <VerificationBadge txHash={stream.tx_hash} compact />
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col p-4">
        {isEmpty ? (
          // An empty section still teaches: showing what belongs here beats
          // "no records yet", which tells the homeowner nothing actionable.
          // Same tiles the landing page uses, greyed back so a section you have
          // not filled yet cannot be mistaken for one you have.
          <div className="rounded-lg border border-dashed border-line bg-surface-sunken p-4">
            <p className="text-xs font-medium text-ink-muted">
              Nothing filed here yet. This section holds:
            </p>
            {category ? (
              <SectionFileGrid
                code={category.code}
                size="md"
                className="mt-3 opacity-60"
              />
            ) : null}
          </div>
        ) : (
          // Files on a shelf — see `FileShelf`, which the caller supplies so a
          // click on a document does the same thing here as on the stream page.
          // Lifted above the card-wide overlay so those clicks still land.
          <div className="relative z-20">{children}</div>
        )}
      </div>
    </section>
  );
};

export default StreamCard;
