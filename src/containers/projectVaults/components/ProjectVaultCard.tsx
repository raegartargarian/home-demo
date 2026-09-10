import { VaultCard } from "@/shared/components/VaultCard";
import { vaultDetailPath } from "@/shared/constants/routes";
import React from "react";
import { useNavigate } from "react-router-dom";
import type { ProjectVault } from "../types";

/**
 * One project, in the grid under its home.
 *
 * Literally the homes-list card: a project is a vault like the home is, and
 * drawing it with the same component says so — and keeps the two grids from
 * drifting apart again. The label comes from the template name rather than the
 * vault's; they are the same string today, and the template is what declares
 * the link.
 */
export const ProjectVaultCard: React.FC<{ project: ProjectVault }> = ({
  project,
}) => {
  const navigate = useNavigate();

  return (
    <VaultCard
      vault={project.vault}
      title={project.label}
      onOpen={() => navigate(vaultDetailPath(project.vault.id))}
    />
  );
};

export default ProjectVaultCard;
