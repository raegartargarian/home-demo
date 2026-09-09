import { Chip } from "@/shared/components/Chip";
import { VaultImage } from "@/shared/components/VaultImage";
import { vaultDetailPath } from "@/shared/constants/routes";
import { formatDate } from "@/shared/utils/dateFormatter";
import { getStatusConfig } from "@/shared/utils/statusConfig";
import { ArrowRight, Calendar, Layers } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import type { ProjectVault } from "../types";

/** Weighted to the bottom, where the status chip sits — as on the homes list. */
const SCRIM =
  "linear-gradient(to bottom," +
  "rgba(24,23,21,0) 45%," +
  "rgba(24,23,21,0.35) 100%)";

/**
 * One project, in the grid under its home.
 *
 * The homes-list card at a smaller scale: a project is a vault like the home
 * is, and drawing it as one says so. The label comes from the template name,
 * not the vault's — they are the same string today, and the template is what
 * declares the link.
 */
export const ProjectVaultCard: React.FC<{ project: ProjectVault }> = ({
  project,
}) => {
  const navigate = useNavigate();
  const { vault, label } = project;
  const status = vault.status ? getStatusConfig(vault.status) : null;
  const sectionCount = vault.streams?.length ?? 0;

  return (
    <button
      type="button"
      onClick={() => navigate(vaultDetailPath(vault.id))}
      aria-label={`Open ${label}`}
      className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-line bg-surface-raised text-left transition-colors duration-200 hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative flex aspect-[3/2] items-center justify-center overflow-hidden bg-surface-inset">
        <VaultImage
          vault={vault}
          imgClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          iconClassName="h-8 w-8 text-ink-subtle"
        />
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
          {label}
        </h3>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <div className="flex items-center gap-3 text-xs text-ink-subtle">
            {vault.created_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" aria-hidden />
                {formatDate(vault.created_at)}
              </span>
            )}
            {sectionCount > 0 && (
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" aria-hidden />
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

export default ProjectVaultCard;
