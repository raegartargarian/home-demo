import { Chip } from "@/shared/components/Chip";
import { VaultImage } from "@/shared/components/VaultImage";
import { VaultDto } from "@/shared/types/vault";
import { formatDate } from "@/shared/utils/dateFormatter";
import { formatLocation, parseHomeFacts } from "@/shared/utils/homeFacts";
import { getStatusConfig } from "@/shared/utils/statusConfig";
import { ArrowRight, Calendar, Layers, MapPin } from "lucide-react";
import React, { useMemo } from "react";

/** Weighted to the bottom, where the status chip sits. */
const SCRIM =
  "linear-gradient(to bottom," +
  "rgba(24,23,21,0) 45%," +
  "rgba(24,23,21,0.35) 100%)";

/** The grid a page of these is laid out in. Shared, so two grids of the same
 *  card cannot end up at two different column widths. */
export const VAULT_GRID_CLASS =
  "grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5";

/** What a skeleton in that grid stands in for, and what a placeholder card
 *  holding a slot in it has to be at least as tall as. */
export const VAULT_CARD_HEIGHT = "h-[300px]";
export const VAULT_CARD_MIN_HEIGHT = "min-h-[300px]";

interface VaultCardProps {
  vault: VaultDto;
  /**
   * Overrides the name on the card. A project is named by the template that
   * carries its parent link, not by the vault; a home names itself by the
   * address in its facts sheet, which is this component's own default.
   */
  title?: string;
  onOpen: () => void;
}

/**
 * One vault, as a card in a grid.
 *
 * The homes list and the projects grid draw the same object, and they used to
 * do it with two components — which is how the projects grid ended up at a
 * different column width, a different gap and a tighter footer than the list
 * of homes, for cards that are meant to read as the same kind of thing.
 *
 * The photograph is `aspect-[3/2]` rather than a fixed height: a 128px band
 * against a 360px column is a 2.8:1 letterbox, which crops a house in half
 * whatever the photograph is.
 */
export const VaultCard: React.FC<VaultCardProps> = ({
  vault,
  title,
  onOpen,
}) => {
  const facts = useMemo(() => parseHomeFacts(vault), [vault]);
  const status = vault.status ? getStatusConfig(vault.status) : null;
  // A project's description is prose, so it has no facts sheet and no location
  // line — the card is a row shorter, which is the truth about it.
  const location = facts ? formatLocation(facts) : "";
  const name = title ?? facts?.address ?? vault.name;
  const sectionCount = vault.streams?.length ?? 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${name}`}
      className="group flex h-full w-full min-w-[280px] max-w-[400px] cursor-pointer flex-col overflow-hidden rounded-xl border border-line bg-surface-raised text-left transition-colors duration-200 hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative flex aspect-[3/2] items-center justify-center overflow-hidden bg-surface-inset">
        <VaultImage
          vault={vault}
          imgClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          iconClassName="h-10 w-10 text-ink-subtle"
        />

        {/* A pale chip on a bright sky is unreadable, which is the problem
            `PropertyHero` solves the same way. */}
        {status && (
          <>
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ backgroundImage: SCRIM }}
            />
            <Chip
              label={status.label}
              tone={status.tone}
              className="absolute bottom-2 left-2"
            />
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate text-base font-medium tracking-tight text-ink">
          {name}
        </h3>
        {location && (
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-ink-subtle">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            {location}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <div className="flex items-center gap-3 text-xs text-ink-subtle">
            {vault.created_at && (
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Calendar className="h-3 w-3 shrink-0" aria-hidden />
                {formatDate(vault.created_at)}
              </span>
            )}
            {sectionCount > 0 && (
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Layers className="h-3 w-3 shrink-0" aria-hidden />
                {sectionCount} section{sectionCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-ink-subtle transition-all group-hover:translate-x-0.5 group-hover:text-ink"
            aria-hidden
          />
        </div>
      </div>
    </button>
  );
};

export default VaultCard;
