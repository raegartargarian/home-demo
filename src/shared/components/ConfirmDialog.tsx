import { Button } from "@/components/ui/button";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import React, { useEffect, useId } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  /** One sentence: what will happen, and that it can be undone if it can. */
  body: string;
  confirmLabel: string;
  /** `destructive` for something that takes a record away from view. */
  confirmVariant?: "primary" | "destructive";
  /** Disables both buttons while the action runs; the overlay stays put. */
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * A question with two answers.
 *
 * Deliberately small: a title, one sentence, cancel and confirm. The reference
 * app asks the user to retype a record's name before archiving it, which suits
 * an operator managing many streams and is the wrong register for a homeowner
 * putting one receipt out of sight — archiving here is reversible, so the
 * dialog only has to make sure the click was meant.
 *
 * It sits over the page like the file viewer does, but as a card rather than a
 * sheet of glass: glass is for surfaces that float over *moving* content, and
 * nothing moves behind a question.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  body,
  confirmLabel,
  confirmVariant = "primary",
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, isLoading, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
          onClick={() => !isLoading && onClose()}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={bodyId}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{
              duration: reduceMotion ? 0.1 : 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-line bg-surface-raised p-5 shadow-lg"
          >
            <h2
              id={titleId}
              className="text-lg font-medium tracking-tight text-ink"
            >
              {title}
            </h2>
            <p id={bodyId} className="mt-2 text-sm text-ink-muted">
              {body}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
                // Focus lands on the safe answer: Enter on a dialog someone did
                // not read must not archive anything.
                autoFocus
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={confirmVariant}
                size="sm"
                onClick={onConfirm}
                disabled={isLoading}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
