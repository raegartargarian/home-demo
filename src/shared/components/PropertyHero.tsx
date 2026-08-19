import { cn } from "@/lib/utils";
import { VaultImage } from "@/shared/components/VaultImage";
import { HomeFacts } from "@/shared/types/home";
import { VaultDto } from "@/shared/types/vault";
import { factItems, formatLocation } from "@/shared/utils/homeFacts";
import { ChevronLeft, LucideIcon, MapPin } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

interface PropertyHeroProps {
  vault: VaultDto;
  /** What this page is about, set over the photograph. */
  title: string;
  /** A section's description. The house's own page shows its facts instead. */
  subtitle?: string;
  icon?: LucideIcon;
  /** Where the way out goes, and what it is called. */
  backTo: string;
  backLabel: string;
  /** Router state for the way out — see `BROWSE_ALL_HOMES`. */
  backState?: unknown;
  /**
   * The home's beds/baths/size line. Passed only by the house's own page — on a
   * section the subject is the section, and the facts would be the house
   * shouting over it.
   */
  facts?: HomeFacts | null;
  /** Width of the content well — matched to the page beneath. */
  innerClassName?: string;
  className?: string;
}

/**
 * The house, at the top of every page about it.
 *
 * The home is the subject, so it gets the frame rather than a thumbnail beside
 * a heading: full-bleed photograph, the page's name set over it. Both the vault
 * page and a section page use it, unchanged — a section is still a part of this
 * house, and giving it its own flat header made five sections read as five
 * unrelated boxes of text.
 *
 * This renders the photograph and nothing else. Provenance and actions used to
 * hang off the bottom of it, which meant a page that wanted its own provenance
 * row got the vault's as well — the section page shipped "Verified" and
 * "Completed" twice. Those belong to whoever is rendering the hero; see
 * `VaultShell`.
 *
 * The scrim is not styling: white type over a sunlit exterior fails contrast
 * without it. It is weighted to the bottom, where the type actually sits, and
 * left nearly clear through the middle so the photograph is still the
 * photograph.
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
  title,
  subtitle,
  icon: Icon,
  backTo,
  backLabel,
  backState,
  facts,
  innerClassName,
  className,
}) => {
  const location = facts ? formatLocation(facts) : "";
  const items = facts ? factItems(facts) : [];

  return (
    <header className={className}>
      <div className="relative isolate flex min-h-[min(52svh,420px)] flex-col justify-end overflow-hidden bg-surface-inset">
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
            "mx-auto w-full px-4 pb-8 pt-24 md:pb-10",
            innerClassName,
          )}
        >
          <Link
            to={backTo}
            state={backState}
            className="inline-flex items-center gap-1 text-xs font-medium text-white/70 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            {backLabel}
          </Link>

          <h1 className="mt-3 flex max-w-[24ch] items-center gap-3 text-3xl font-medium leading-tight tracking-tight text-white drop-shadow-sm md:text-4xl">
            {Icon && (
              <Icon className="h-7 w-7 shrink-0 opacity-90" aria-hidden />
            )}
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 max-w-prose text-sm text-white/80">{subtitle}</p>
          )}

          {location && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {location}
            </p>
          )}

          {items.length > 0 && (
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
    </header>
  );
};

export default PropertyHero;
