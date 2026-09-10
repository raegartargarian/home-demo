import { Button } from "@/components/ui/button";
import { useWeb3Auth } from "@/containers/global/Web3AuthProvider";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { vaultDetailSelectors } from "../selectors";
import { vaultDetailActions } from "../slice";

/** Shaped like a section card, so the grid keeps its rhythm either way. */
const CARD_CLASS = "pane flex min-h-[14rem] w-full flex-col rounded-xl p-4";

/**
 * The end of the sections grid: a section being added, or the offer to add one.
 *
 * Both states are one component because they occupy the same slot — the
 * placeholder takes the position the finished card will appear in, so adding a
 * section reads as the grid growing rather than as a status line somewhere
 * else on the page. The same bargain the projects grid makes with its own
 * creation card.
 *
 * Renders nothing for a visitor who is not signed in: a section is a write,
 * and offering one to someone who cannot make it is a dead end.
 */
export const AddSectionCard: React.FC<{ vaultId: string }> = ({ vaultId }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useWeb3Auth() || {};
  const creation = useSelector(vaultDetailSelectors.sectionCreation);
  const here = creation?.vaultId === vaultId ? creation : null;

  if (!isAuthenticated) return null;

  if (here) {
    const isRunning = here.status === "running";
    return (
      <div role="status" aria-live="polite" className={CARD_CLASS}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-inset text-ink-muted">
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <AlertCircle className="h-4 w-4 text-alert" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {here.label}
            </p>
            <p className="mt-0.5 text-xs text-ink-subtle">
              {isRunning
                ? "Anchoring the section to the blockchain…"
                : (here.error ?? "Something went wrong.")}
            </p>
          </div>
        </div>

        {!isRunning && (
          <div className="mt-auto flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                dispatch(vaultDetailActions.dismissSectionCreation())
              }
            >
              Dismiss
            </Button>
            {here.retryable && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  dispatch(
                    vaultDetailActions.addSectionStart({
                      vaultId,
                      mapping: here.mapping,
                      label: here.label,
                      description: "",
                    }),
                  )
                }
              >
                Try again
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => dispatch(vaultDetailActions.openAddSectionModal(vaultId))}
      className="flex min-h-[14rem] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface-sunken p-4 text-sm font-medium text-ink-muted transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface-raised">
        <Plus className="h-4 w-4" aria-hidden />
      </span>
      Add section
    </button>
  );
};

export default AddSectionCard;
