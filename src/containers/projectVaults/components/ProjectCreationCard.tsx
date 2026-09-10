import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { VAULT_CARD_MIN_HEIGHT } from "@/shared/components/VaultCard";
import { vaultDetailPath } from "@/shared/constants/routes";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { projectVaultsActions } from "../slice";
import type { ProjectCreation } from "../types";

/**
 * The card a project occupies in the grid while it is being made.
 *
 * It takes the slot the finished card will fill, so creating a project reads
 * as the grid growing rather than as a status line somewhere else on the page.
 * Same three states as the upload tray — running, done, failed — and the same
 * spinner, tick and warning, so the two flows feel like one app.
 */
export const ProjectCreationCard: React.FC<{ creation: ProjectCreation }> = ({
  creation,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { input, step, progress, status, error, vaultId } = creation;

  const dismiss = () => dispatch(projectVaultsActions.dismissCreation());
  const retry = () => dispatch(projectVaultsActions.createProject(input));

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${VAULT_CARD_MIN_HEIGHT} flex h-full w-full max-w-[400px] flex-col justify-between gap-4 rounded-xl border border-line bg-surface-raised p-4`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-inset text-ink-muted">
          {status === "done" ? (
            <CheckCircle2 className="h-4 w-4 text-verified" aria-hidden />
          ) : status === "failed" ? (
            <AlertCircle className="h-4 w-4 text-alert" aria-hidden />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-medium tracking-tight text-ink">
            {input.label}
          </p>
          <p className="mt-0.5 text-xs text-ink-subtle">
            {status === "done"
              ? "Ready. Its sections are waiting for their first records."
              : status === "failed"
                ? (error ?? "Something went wrong.")
                : step}
          </p>
        </div>
      </div>

      {status === "running" && (
        <Progress
          value={progress ?? undefined}
          // Nothing honest to measure while the chain catches up, so the bar
          // pulses instead of pretending.
          className={progress === null ? "animate-pulse" : undefined}
          aria-label={step}
        />
      )}

      {status !== "running" && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
            Dismiss
          </Button>
          {status === "failed" && (
            <Button type="button" variant="outline" size="sm" onClick={retry}>
              Try again
            </Button>
          )}
          {status === "done" && vaultId && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                dismiss();
                navigate(vaultDetailPath(vaultId));
              }}
            >
              Open project
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectCreationCard;
