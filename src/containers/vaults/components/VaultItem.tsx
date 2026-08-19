import { Chip } from "@/shared/components/Chip";
import { VaultImage } from "@/shared/components/VaultImage";
import { appRoutes } from "@/shared/constants/routes";
import { VaultDto } from "@/shared/types/vault";
import { formatDate } from "@/shared/utils/dateFormatter";
import { formatLocation, parseHomeFacts } from "@/shared/utils/homeFacts";
import { getStatusConfig } from "@/shared/utils/statusConfig";
import { ArrowRight, Calendar, Layers, MapPin } from "lucide-react";
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface VaultItemProps {
  vault: VaultDto;
}

/** Weighted to the bottom, where the status chip sits. */
const SCRIM =
  "linear-gradient(to bottom," +
  "rgba(24,23,21,0) 45%," +
  "rgba(24,23,21,0.35) 100%)";

/**
 * One home, in the list of homes.
 *
 * The card names the house the way its own page does: `parseHomeFacts` reads
 * the address out of the vault's description, so the list says "4412 Maple
 * Ridge Drive" where it used to say the vault's internal label — and the two
 * screens stop disagreeing about what the home is called.
 *
 * `aspect-[3/2]` rather than a fixed height: a 128px band against a 360px
 * column is a 2.8:1 letterbox, which crops a house in half whatever the
 * photograph is.
 */
const VaultItem: React.FC<VaultItemProps> = ({ vault }) => {
  const navigate = useNavigate();
  const facts = useMemo(() => parseHomeFacts(vault), [vault]);
  const status = vault.status ? getStatusConfig(vault.status) : null;
  const location = facts ? formatLocation(facts) : "";

  return (
    <button
      onClick={() => navigate(`${appRoutes.vaultDetail.name}${vault.id}`)}
      className="group flex h-full w-full min-w-[280px] max-w-[400px] cursor-pointer flex-col overflow-hidden rounded-xl border border-line bg-surface-raised text-left transition-colors duration-200 hover:border-line-strong"
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
          {facts?.address ?? vault.name}
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
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" aria-hidden />
                {formatDate(vault.created_at)}
              </span>
            )}
            {vault.streams && vault.streams.length > 0 && (
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" aria-hidden />
                {vault.streams.length} section
                {vault.streams.length !== 1 ? "s" : ""}
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

export default VaultItem;
