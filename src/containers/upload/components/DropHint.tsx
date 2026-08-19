import { motion, useReducedMotion } from "framer-motion";
import React from "react";

interface DropHintProps {
  /** Held mid-air while something is over the zone. */
  isDragActive: boolean;
  /** Landed and still once the zone has done its job. */
  hasFiles?: boolean;
}

/**
 * A document, dropping.
 *
 * The empty drop zone had a cloud icon, which says "upload" but not *how*. This
 * says how: a page falls onto a shelf, over and over, and while a file is
 * actually over the zone it holds mid-air with its shadow spread — the frame
 * just before the one the gesture will produce.
 *
 * Deliberately one beat. `onmint`'s dropzone runs a four-stage walkthrough of
 * its whole pipeline; that earns its length there because the pipeline is the
 * product. Here the only thing worth telegraphing is where the file goes.
 *
 * The shadow is the whole trick: it tightens and darkens as the page lands, so
 * the page reads as falling towards a surface rather than sliding down a plane.
 */
export const DropHint: React.FC<DropHintProps> = ({
  isDragActive,
  hasFiles = false,
}) => {
  const reduceMotion = useReducedMotion();

  // It loops only while it is still asking for something. Once files are in, or
  // while one is being held over the zone, the page rests — and under reduced
  // motion it never falls at all, a looping drop being exactly the repetitive
  // motion that setting exists to switch off.
  const still = reduceMotion || isDragActive || hasFiles;

  const fall = { duration: 1.6, repeat: Infinity, repeatDelay: 0.5, times: [0, 0.55, 1] };

  return (
    <div
      aria-hidden
      className="relative flex h-[62px] w-16 flex-col items-center justify-end"
    >
      <motion.div
        className="absolute left-1/2 top-[6px] h-9 w-7 -translate-x-1/2 rounded-[3px] border border-line-strong bg-surface-raised"
        animate={
          still
            ? { y: isDragActive ? -6 : 0, rotate: 0 }
            : { y: [-14, 0, 0], rotate: [-4, 0, 0] }
        }
        transition={
          still
            ? { type: "spring", stiffness: 300, damping: 24 }
            : { ...fall, ease: [0.32, 0.72, 0, 1] }
        }
      >
        {/* Ruled lines, so it reads as a document rather than a blank card. */}
        <span className="absolute inset-x-1.5 top-2 h-px bg-line-strong" />
        <span className="absolute inset-x-1.5 top-[15px] h-px bg-line-strong" />
        <span className="absolute inset-x-1.5 top-[22px] h-px w-3 bg-line-strong" />
      </motion.div>

      {/* Contact shadow: wide and soft in the air, tight and dark on landing. */}
      <motion.div
        className="absolute bottom-[7px] left-1/2 h-1 -translate-x-1/2 rounded-full bg-ink/20 blur-[2px]"
        animate={
          still
            ? { width: isDragActive ? 30 : 22, opacity: isDragActive ? 0.35 : 0.6 }
            : { width: [30, 22, 22], opacity: [0.3, 0.6, 0.6] }
        }
        transition={still ? { duration: 0.2 } : fall}
      />

      {/* The shelf it lands on. */}
      <span className="h-[3px] w-14 rounded-full bg-line-strong" />
    </div>
  );
};

export default DropHint;
