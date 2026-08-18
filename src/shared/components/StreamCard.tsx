import { cn } from "@/lib/utils";
import { TransferBadge } from "@/shared/components/TransferBadge";
import { VerificationBadge } from "@/shared/components/VerificationBadge";
import { StreamCategory } from "@/shared/constants/streams";
import { VaultStreamDto } from "@/shared/types/vault";
import { formatStreamName } from "@/shared/utils/streamHelpers";
import { ArrowRight, Layers, Plus } from "lucide-react";
import React from "react";

interface StreamCardProps {
  stream: VaultStreamDto;
  /** Resolved via `categoryForAssetCode`. Null for a stream outside the template. */
  category: StreamCategory | null;
  /** True record count from the API, which may exceed the previews rendered. */
  total: number;
  /** Record previews. */
  children?: React.ReactNode;
  onViewAll?: () => void;
  /** Omitted when the viewer cannot file records (e.g. signed out). */
  onAddRecord?: () => void;
  className?: string;
}

/**
 * One section of the Property Vault.
 *
 * All five looks come from a single component: `data-category` on the wrapper
 * repoints the `--cat-*` variables (see `styles/main.scss`), so the icon tile,
 * accent rule and private-vault treatment follow the section without a single
 * conditional className. Adding a section is a CSS block, not a code branch.
 */
export const StreamCard: React.FC<StreamCardProps> = ({
  stream,
  category,
  total,
  children,
  onViewAll,
  onAddRecord,
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
        "overflow-hidden rounded-xl border border-line bg-surface-raised shadow-sm",
        className
      )}
    >
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

      <div className="p-4">
        {isEmpty ? (
          // An empty section still teaches: listing what belongs here beats
          // "no records yet", which tells the homeowner nothing actionable.
          <div className="rounded-lg border border-dashed border-line bg-surface-sunken p-4">
            <p className="text-xs font-medium text-ink-muted">
              Nothing filed here yet. This section holds:
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {(category?.contents ?? []).map((item) => (
                <li
                  key={item}
                  className="rounded border border-cat-line bg-cat-surface px-1.5 py-0.5 text-[11px] text-cat-ink"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-2">{children}</div>
        )}

        {(onAddRecord || onViewAll) && (
          <div className="mt-3 flex items-center gap-2">
            {onAddRecord && (
              <button
                onClick={onAddRecord}
                className="flex items-center gap-1.5 rounded-lg border border-cat-line bg-cat-surface px-3 py-2 text-sm font-medium text-cat-ink transition-colors hover:brightness-95"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add record
              </button>
            )}
            {onViewAll && (
              <button
                onClick={onViewAll}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-cat-ink transition-colors hover:bg-cat-surface"
              >
                View all {total} records
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default StreamCard;
