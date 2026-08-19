import { cn } from "@/lib/utils";
import { Chip } from "@/shared/components/Chip";
import { ProvenanceDetails } from "@/shared/components/ProvenanceDetails";
import { VaultImage } from "@/shared/components/VaultImage";
import { appRoutes } from "@/shared/constants/routes";
import { HomeFacts } from "@/shared/types/home";
import { VaultDto } from "@/shared/types/vault";
import { factItems, formatLocation } from "@/shared/utils/homeFacts";
import { getStatusConfig } from "@/shared/utils/statusConfig";
import { ChevronLeft, LucideIcon, MapPin } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

interface PropertyHeroProps {
  vault: VaultDto;
  /**
   * `page` — the vault's own header: the house is the subject, so it gets the
   * frame. `band` — a section's header: the house is context, so it drops to a
   * strip and the section takes the headline.
   */
  variant?: "page" | "band";
  /** `band` only: what this page is about, set over the photograph. */
  bandTitle?: string;
  bandDescription?: string;
  bandIcon?: LucideIcon;
  /** `band` only: where the back-link goes, and what it says. */
  backTo?: string;
  backLabel?: string;
  /** Resolved by the page via `parseHomeFacts`. Null renders the name only. */
  facts?: HomeFacts | null;
  /** Page-level actions (proof download, explorer link, share). */
  actions?: React.ReactNode;
  /** Width of the content well — matched to the page it sits above. */
  innerClassName?: string;
  className?: string;
}

/**
 * The property, at the top of its own page.
 *
 * The home is the subject, so it gets the frame rather than a thumbnail beside
 * a heading: full-bleed photograph, address set over it, facts underneath. The
 * previous boxed header put a 176px crop of the house next to its address,
 * which is the layout of a search result, not of the page you land on when you
 * open your own home.
 *
 * Two things here are not styling.
 *
 * The scrim. White type over a sunlit exterior fails contrast without it. It is
 * weighted to the bottom, where the type actually sits, and left nearly clear
 * through the middle so the photograph is still the photograph.
 *
 * The split between what is over the photograph and what is under it. Identity
 * — address, location, the beds/baths/size facts — is the home and belongs on
 * it. Provenance and actions are about the *record* of the home, and they use
 * badges built for a light surface, which a photograph would swallow; they get
 * the bar below, where they read correctly and cannot be lost against a bright
 * sky.
 */

/** Clear through the middle, weighted where the type lands. */
const SCRIM =
  "linear-gradient(to bottom," +
  "rgba(24,23,21,0.48) 0%," +
  "rgba(24,23,21,0.16) 28%," +
  "rgba(24,23,21,0.30) 55%," +
  "rgba(24,23,21,0.76) 88%," +
  "rgba(24,23,21,0.88) 100%)";

export const PropertyHero: React.FC<PropertyHeroProps> = ({
  vault,
  variant = "page",
  bandTitle,
  bandDescription,
  bandIcon: BandIcon,
  backTo,
  backLabel,
  facts,
  actions,
  innerClassName,
  className,
}) => {
  const isBand = variant === "band";
  const status = vault.status ? getStatusConfig(vault.status) : null;
  const location = facts ? formatLocation(facts) : "";
  const items = facts ? factItems(facts) : [];

  return (
    <header className={className}>
      <div
        className={cn(
          "relative isolate flex flex-col justify-end overflow-hidden bg-surface-inset",
          isBand ? "min-h-[200px]" : "min-h-[min(52svh,420px)]",
        )}
      >
        {/* The photograph carries nothing the address beside it does not
            already say, so it is decorative to a screen reader. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 flex items-center justify-center"
        >
          <VaultImage
            vault={vault}
            imgClassName="h-full w-full object-cover"
            iconClassName="h-16 w-16 text-ink-subtle"
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{ backgroundImage: SCRIM }}
        />

        {/* White rather than `text-ink-inverse`: that token flips with the
            theme, and the ground here is a photograph either way. */}
        <div
          className={cn(
            "mx-auto w-full px-4",
            isBand ? "pb-5 pt-24" : "pb-8 pt-24 md:pb-10",
            innerClassName,
          )}
        >
          <Link
            to={backTo ?? appRoutes.vaults.path}
            className="inline-flex items-center gap-1 text-xs font-medium text-white/70 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            {backLabel ?? "All homes"}
          </Link>

          <h1
            className={cn(
              "mt-2 flex max-w-[24ch] items-center gap-2.5 font-medium leading-tight tracking-tight text-white drop-shadow-sm",
              isBand ? "text-2xl md:text-3xl" : "mt-3 text-3xl md:text-4xl",
            )}
          >
            {BandIcon && (
              <BandIcon className="h-6 w-6 shrink-0 opacity-90" aria-hidden />
            )}
            {isBand ? bandTitle : (facts?.address ?? vault.name)}
          </h1>

          {isBand && bandDescription && (
            <p className="mt-1.5 max-w-prose text-sm text-white/80">
              {bandDescription}
            </p>
          )}

          {!isBand && location && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {location}
            </p>
          )}

          {!isBand && items.length > 0 && (
            <dl className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white">
              {items.map((item, index) => (
                <React.Fragment key={item.label}>
                  {index > 0 && (
                    <span className="text-white/40" aria-hidden>
                      ·
                    </span>
                  )}
                  <div className="flex items-baseline gap-1">
                    <dt className="sr-only">{item.label}</dt>
                    <dd className="font-semibold tabular-nums">{item.value}</dd>
                    <span className="text-white/70">{item.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </dl>
          )}
        </div>
      </div>

      {/* Provenance and actions, on a surface that renders them honestly. The
          same component the section page uses, so the two pages cannot end up
          giving two different accounts of the same facts. */}
      <div className="border-b border-line bg-surface-raised">
        <div className={cn("mx-auto w-full px-4 py-3", innerClassName)}>
          <ProvenanceDetails
            txHash={vault.tx_hash}
            ledger={vault.ledger}
            createdAt={vault.created_at}
            actions={
              <>
                {status && <Chip label={status.label} tone={status.tone} />}
                {actions}
              </>
            }
          />
        </div>
      </div>
    </header>
  );
};

export default PropertyHero;
