import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { streamDetailPath } from "@/shared/constants/routes";
import type { UploadPhase } from "@filedgr/web-core/upload";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { CheckCircle2, Loader2, Pause, Play, X } from "lucide-react";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { OriginRect } from "../originRect";
import { uploadSelectors } from "../selectors";
import { uploadActions } from "../slice";
import type { UploadCard } from "../types";

const PHASE_LABEL: Record<UploadPhase, string> = {
  creating: "Preparing the record…",
  reviewing: "Reviewing the files…",
  uploading: "Uploading…",
  completing: "Finalising the upload…",
  confirming: "Anchoring to the blockchain…",
  done: "Done",
};

// The card's resting place, which is also what the tray is laid out to. Kept as
// numbers because the entry animation has to know where it is landing before
// the card has been measured.
const TRAY_INSET = 24; // bottom-6 / right-6
const CARD_WIDTH = 360;
const CARD_HEIGHT_ESTIMATE = 96;

/**
 * How far the card starts from its slot, so it can fly out of the button that
 * submitted it. Null when it should just fade in where it belongs.
 *
 * Computed synchronously from the tray's own geometry rather than measured:
 * only the destination *centre* matters, and waiting for a layout pass would
 * let framer-motion commit an animation from the wrong place first.
 */
const swooshDelta = (origin: OriginRect): { x: number; y: number } | null => {
  if (typeof window === "undefined") return null;
  const cardCenterX = window.innerWidth - TRAY_INSET - CARD_WIDTH / 2;
  const cardCenterY = window.innerHeight - TRAY_INSET - CARD_HEIGHT_ESTIMATE / 2;
  const x = origin.x + origin.width / 2 - cardCenterX;
  const y = origin.y + origin.height / 2 - cardCenterY;
  // On a small viewport the button already sits roughly where the card will
  // land, and a 40px flight reads as a jitter rather than a journey.
  return Math.hypot(x, y) < 80 ? null : { x, y };
};

/**
 * The card itself.
 *
 * Its own component so the flight path is captured when the card appears, not
 * when the tray does — AnimatePresence mounts this once per run, which is
 * exactly the lifetime the origin rect is valid for.
 */
const UploadCardView: React.FC<{ card: UploadCard }> = ({ card }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const succeeded = useSelector(uploadSelectors.succeeded);
  const status = useSelector(uploadSelectors.status);
  const phase = useSelector(uploadSelectors.phase);
  const progress = useSelector(uploadSelectors.progress);
  const parts = useSelector(uploadSelectors.parts);
  const reduceMotion = useReducedMotion();

  const [delta] = useState(() =>
    card.originRect && !reduceMotion ? swooshDelta(card.originRect) : null,
  );

  const isPaused = status === "paused";

  const initial = delta
    ? { opacity: 0, x: delta.x, y: delta.y, scale: 1.05 }
    : reduceMotion
      ? { opacity: 0 }
      : { opacity: 0, y: 16, scale: 0.96 };

  const animate = delta
    ? {
        // Three frames, keyed by `times` below:
        //  0%   appear over the submit button, slightly large
        //  18%  fade-in done, still there — overlaps the form leaving
        //  100% land in the tray slot at rest size
        opacity: [0, 1, 1],
        x: [delta.x, delta.x, 0],
        y: [delta.y, delta.y, 0],
        scale: [1.05, 1.05, 1],
      }
    : { opacity: 1, x: 0, y: 0, scale: 1 };

  const transition: Transition = delta
    ? {
        duration: 0.7,
        times: [0, 0.18, 1],
        ease: ["easeOut", [0.32, 0.72, 0, 1]],
      }
    : { duration: reduceMotion ? 0.15 : 0.2, ease: "easeOut" };

  return (
    <motion.div
      initial={initial}
      animate={animate}
      exit={{ opacity: 0, y: 16, scale: 0.96 }}
      transition={transition}
      role="status"
      aria-live="polite"
      // Glass, like the header and the menus: every surface that floats over
      // the page is the same material.
      className="glass pointer-events-auto rounded-xl p-4"
    >
      <div className="flex items-start gap-3">
        <div
          className={
            succeeded
              ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cat-surface text-cat-ink"
              : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-inset text-ink-muted"
          }
        >
          {succeeded ? (
            <CheckCircle2 className="h-[18px] w-[18px]" aria-hidden />
          ) : (
            <Loader2
              className={`h-[18px] w-[18px] ${isPaused ? "" : "animate-spin"}`}
              aria-hidden
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
              {succeeded ? "Record filed" : "Filing a record"}
            </p>
            {succeeded && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => dispatch(uploadActions.dismissTray())}
                aria-label="Dismiss"
                className="-mr-1 -mt-1 shrink-0"
              >
                <X aria-hidden />
              </Button>
            )}
          </div>

          <p className="mt-0.5 truncate text-xs text-ink-subtle">
            {card.subtitle ? `${card.subtitle} · ` : ""}
            {card.title}
          </p>

          {succeeded ? (
            <Button
              type="button"
              size="sm"
              className="mt-3"
              onClick={() => {
                navigate(streamDetailPath(card.vaultId, card.assetCode));
                dispatch(uploadActions.dismissTray());
              }}
            >
              View the section
            </Button>
          ) : (
            <>
              <p className="mt-2 truncate text-xs text-ink-muted">
                {isPaused ? "Paused" : (phase && PHASE_LABEL[phase]) || "Uploading…"}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <Progress
                  value={progress}
                  className="h-1.5 flex-1 bg-surface-inset"
                />
                <span className="shrink-0 text-xs tabular-nums text-ink-subtle">
                  {progress}%
                </span>
              </div>
              {parts && (
                <p className="mt-1 text-xs text-ink-subtle">
                  Part {parts.current} of {parts.total}
                </p>
              )}

              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                 
                  onClick={() =>
                    dispatch(
                      isPaused
                        ? uploadActions.resumeUpload()
                        : uploadActions.pauseUpload(),
                    )
                  }
                >
                  {isPaused ? (
                    <Play className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Pause className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                 
                  onClick={() => dispatch(uploadActions.cancelUpload())}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * The upload's own corner of the screen.
 *
 * Filing a record is slow — five phases, a multipart PUT and a blockchain
 * confirmation — and holding a full-page form open for all of it makes the app
 * feel stuck. The form hands the run over to this card on submit, so the
 * homeowner can carry on browsing while it finishes.
 *
 * A failed run is *not* shown here: the form comes back with the error and
 * everything still typed into it, which is the only place a retry can happen.
 */
export const UploadTray: React.FC = () => {
  const card = useSelector(uploadSelectors.card);

  return (
    // No `overflow: hidden` anywhere in this tree: the card's entry animation
    // starts most of a viewport away, and any clipping ancestor would swallow
    // it mid-flight.
    <div className="pointer-events-none fixed bottom-6 right-6 z-[70] w-[360px] max-w-[calc(100vw-3rem)]">
      <AnimatePresence>
        {card && <UploadCardView card={card} />}
      </AnimatePresence>
    </div>
  );
};

export default UploadTray;
