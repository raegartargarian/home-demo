import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeb3Auth } from "@/containers/global/Web3AuthProvider";
import { VaultDto } from "@/shared/types/vault";
import { RootState } from "@/store/types";
import { AlertCircle, Plus } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { projectVaultsSelectors } from "../selectors";
import { projectVaultsActions } from "../slice";
import { ProjectCreationCard } from "./ProjectCreationCard";
import { ProjectVaultCard } from "./ProjectVaultCard";

const GRID_CLASS = "grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4";

/**
 * The home's projects, under its five sections.
 *
 * A section answers "where is the deed"; a project answers "show me the
 * kitchen remodel" — the estimate, the photos, the permit and the warranty,
 * whichever section each was filed in. This is the architecture doc's Event
 * Vault: a smaller vault of its own under the home, with the same sections.
 */
export const ProjectsSection: React.FC<{ home: VaultDto }> = ({ home }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useWeb3Auth() || {};
  const { projects, isLoading, error, hasLoaded } = useSelector(
    (state: RootState) => projectVaultsSelectors.forParent(state, home.id),
  );
  const creation = useSelector(projectVaultsSelectors.creation);
  const creationHere =
    creation?.input.parentVaultId === home.id ? creation : null;
  const isCreating = creation?.status === "running";

  // Asked for at most once per home per mount, and not at all when the store
  // already has it. The structure sidebar opens this home's node and asks for
  // the same thing, and discovery is a paged template scan that the saga takes
  // every one of — so whichever of the two gets there first, only one request
  // goes out. The ref is what keeps this from firing again when `isLoading`
  // flips back to false.
  const requestedFor = useRef<string | null>(null);
  useEffect(() => {
    if (requestedFor.current === home.id) return;
    requestedFor.current = home.id;
    if (isLoading || hasLoaded) return;
    dispatch(projectVaultsActions.fetchProjects({ parentVaultId: home.id }));
  }, [dispatch, home.id, isLoading, hasLoaded]);

  const openCreate = () =>
    dispatch(projectVaultsActions.openCreateModal(home.id));

  const newProjectCard = isAuthenticated && (
    <button
      type="button"
      onClick={openCreate}
      disabled={isCreating}
      className="flex min-h-[14rem] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface-sunken p-4 text-sm font-medium text-ink-muted transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface-raised">
        <Plus className="h-4 w-4" aria-hidden />
      </span>
      New project
    </button>
  );

  return (
    <section aria-labelledby="projects-heading" className="mt-10">
      <div className="mb-4">
        <h2
          id="projects-heading"
          className="text-lg font-medium tracking-tight text-ink"
        >
          Projects
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Everything about one job in one place — the estimate, the photos, the
          permit and the warranty, whichever section each was filed in.
        </p>
      </div>

      {isLoading && !hasLoaded ? (
        <div className={GRID_CLASS}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-56 w-full rounded-xl bg-surface-inset"
            />
          ))}
        </div>
      ) : error && !hasLoaded ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-alert-line bg-alert-surface p-3 text-sm text-alert">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1">{error}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              dispatch(
                projectVaultsActions.fetchProjects({ parentVaultId: home.id }),
              )
            }
          >
            Try again
          </Button>
        </div>
      ) : (
        <>
          {projects.length === 0 && !creationHere && (
            <p className="mb-4 text-sm text-ink-subtle">
              No projects yet. Start one when a job begins, and file its
              paperwork there as it arrives.
            </p>
          )}
          <div className={GRID_CLASS}>
            {creationHere && <ProjectCreationCard creation={creationHere} />}
            {projects.map((project) => (
              <ProjectVaultCard key={project.id} project={project} />
            ))}
            {newProjectCard}
          </div>
        </>
      )}
    </section>
  );
};

export default ProjectsSection;
