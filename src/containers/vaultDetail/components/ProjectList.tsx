import { LoadingIndicator } from "@/shared/components/LoadingIndicator";
import { projectDetailPath } from "@/shared/constants/routes";
import { categoryForAssetCode } from "@/shared/constants/streams";
import { formatDateSpan } from "@/shared/utils/dateFormatter";
import { groupByProject, ProjectGroup } from "@/shared/utils/recordLens";
import { ArrowRight, FolderOpen, Hammer } from "lucide-react";
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Attachment } from "../types";
import RecordThumbnail from "./RecordThumbnail";

/** How many record faces a card shows before it starts counting instead. */
const THUMBNAIL_COUNT = 4;

interface ProjectListProps {
  vaultId: string;
  records: Attachment[];
  isLoading: boolean;
}

const ProjectCard: React.FC<{
  vaultId: string;
  group: ProjectGroup<Attachment>;
}> = ({ vaultId, group }) => {
  const navigate = useNavigate();
  const { project, records, from, to, assetCodes } = group;
  const span = formatDateSpan(from, to);
  const isUnfiled = project === null;

  const sections = assetCodes
    .map((code) => categoryForAssetCode(code))
    .filter((category): category is NonNullable<typeof category> => !!category);

  return (
    <button
      onClick={() => project && navigate(projectDetailPath(vaultId, project))}
      disabled={isUnfiled}
      className="group w-full rounded-xl border border-line bg-surface-raised p-5 text-left shadow-sm transition-all duration-200 enabled:hover:border-cat-line enabled:hover:shadow-md disabled:cursor-default"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-base font-medium text-ink">
            {isUnfiled ? (
              <FolderOpen className="h-4 w-4 text-ink-subtle" aria-hidden />
            ) : (
              <Hammer className="h-4 w-4 text-ink-subtle" aria-hidden />
            )}
            {project ?? "Unfiled"}
          </h3>
          <p className="mt-1 text-sm text-ink-muted">
            {isUnfiled
              ? "Records filed before the naming convention — still here, just not yet part of a job."
              : span}
          </p>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-ink-subtle">
          {records.length} record{records.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Which sections this one job reaches into — the whole point of the lens. */}
      {sections.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {sections.map((category) => (
            <li
              key={category.code}
              data-category={category.code}
              className="flex items-center gap-1 rounded border border-cat-line bg-cat-surface px-1.5 py-0.5 text-[11px] font-medium text-cat-ink"
            >
              <category.icon className="h-3 w-3" aria-hidden />
              {category.label}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {records.slice(0, THUMBNAIL_COUNT).map((record) => (
            <RecordThumbnail
              key={record.id}
              attachment={record}
              className="size-10"
            />
          ))}
          {records.length > THUMBNAIL_COUNT && (
            <span className="text-xs tabular-nums text-ink-subtle">
              +{records.length - THUMBNAIL_COUNT}
            </span>
          )}
        </div>

        {!isUnfiled && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors group-hover:text-ink">
            Open
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        )}
      </div>
    </button>
  );
};

/**
 * The Projects lens.
 *
 * A roof replacement leaves an invoice in Maintenance, a permit in Property
 * Records, a warranty in Systems and a claim in the Personal Vault — filed
 * apart, by design, because they transfer differently. This is the view that
 * puts the job back together without moving or copying a single record.
 */
export const ProjectList: React.FC<ProjectListProps> = ({
  vaultId,
  records,
  isLoading,
}) => {
  const projects = useMemo(() => groupByProject(records), [records]);

  if (records.length === 0) {
    return isLoading ? (
      <div className="flex w-full items-center justify-center py-12">
        <LoadingIndicator />
      </div>
    ) : (
      <div className="rounded-xl border border-line bg-surface-raised p-12 text-center shadow-sm">
        <Hammer className="mx-auto mb-3 h-10 w-10 text-ink-subtle" />
        <h3 className="text-base font-medium tracking-tight text-ink">
          No projects yet
        </h3>
        <p className="mt-1 text-sm text-ink-muted">
          Records filed under the same job — "Kitchen Remodel", "Roof
          Replacement" — are gathered here, whichever section each one lives in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((group) => (
        <ProjectCard
          key={group.project ?? "unfiled"}
          vaultId={vaultId}
          group={group}
        />
      ))}

      {/* Grouping is only right once the whole vault is in — say so while it isn't. */}
      {isLoading && (
        <div className="flex w-full items-center justify-center py-4">
          <LoadingIndicator />
        </div>
      )}
    </div>
  );
};

export default ProjectList;
