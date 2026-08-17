import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VaultImage } from "@/shared/components/VaultImage";
import { VerificationBadge } from "@/shared/components/VerificationBadge";
import { HomeFacts } from "@/shared/types/home";
import { VaultDto } from "@/shared/types/vault";
import { formatDate } from "@/shared/utils/dateFormatter";
import { factItems, formatLocation } from "@/shared/utils/homeFacts";
import { getLedgerNameFromServerName } from "@/shared/utils/networks";
import { getStatusConfig } from "@/shared/utils/statusConfig";
import { CalendarDays, MapPin } from "lucide-react";
import React from "react";

interface PropertyHeaderProps {
  vault: VaultDto;
  /** Resolved by the page via `parseHomeFacts`. Null renders the name only. */
  facts?: HomeFacts | null;
  /** Page-level actions (proof download, explorer link, share). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * The property, not the record.
 *
 * Housing products lead with the home — photo, address, then the facts row
 * people are trained to scan (beds / baths / size / year). Ledger state is real
 * and worth showing, but it is provenance for the record, not the subject of the
 * page; it sits in the badge row rather than the headline.
 */
export const PropertyHeader: React.FC<PropertyHeaderProps> = ({
  vault,
  facts,
  actions,
  className,
}) => {
  const status = vault.status ? getStatusConfig(vault.status) : null;
  const ledger = vault.ledger
    ? getLedgerNameFromServerName(vault.ledger) || vault.ledger
    : null;
  const location = facts ? formatLocation(facts) : "";
  const items = facts ? factItems(facts) : [];

  return (
    <header
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-surface-raised shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-5 p-5 md:flex-row md:p-6">
        <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-inset md:h-28 md:w-44">
          <VaultImage
            vault={vault}
            imgClassName="h-full w-full object-cover"
            iconClassName="h-9 w-9 text-ink-subtle"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-tight text-ink md:text-2xl">
            {facts?.address ?? vault.name}
          </h1>

          {location && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {location}
            </p>
          )}

          {items.length > 0 && (
            <dl className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink">
              {items.map((item, index) => (
                <React.Fragment key={item.label}>
                  {index > 0 && (
                    <span className="text-ink-subtle" aria-hidden>
                      ·
                    </span>
                  )}
                  <div className="flex items-baseline gap-1">
                    <dt className="sr-only">{item.label}</dt>
                    <dd className="font-semibold tabular-nums">{item.value}</dd>
                    <span className="text-ink-subtle">{item.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </dl>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <VerificationBadge txHash={vault.tx_hash} />
            {status && (
              <Badge variant="secondary" className={status.className}>
                {status.label}
              </Badge>
            )}
            {ledger && (
              <Badge
                variant="secondary"
                className="border-line bg-surface-inset text-ink-muted"
              >
                {ledger}
              </Badge>
            )}
            {vault.created_at && (
              <span className="flex items-center gap-1.5 text-xs text-ink-subtle">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                Registered {formatDate(vault.created_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-sunken px-5 py-3 md:px-6">
          {actions}
        </div>
      )}
    </header>
  );
};

export default PropertyHeader;
