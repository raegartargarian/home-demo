import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/shared/constants/motion";
import React from "react";

interface DropHintProps {
  /** Held mid-air while something is over the zone. */
  isDragActive: boolean;
  /** Landed and still once the zone has done its job. */
  hasFiles?: boolean;
}

/**
 * A photo and two documents, dropping onto a shelf.
 *
 * The empty zone had a cloud icon, which says "upload" but not how. This says
 * how — and says the other two things the copy underneath has to spell out in
 * words. That several files are filed as *one* record: they arrive one after
 * another and settle into a single fanned stack. And that a record is not only
 * paperwork: the middle one is a photograph, because "photos, invoices or
 * manuals" is the actual mix, and three identical pages would quietly say
 * otherwise.
 *
 * The shadow is the trick that makes it read as falling rather than sliding:
 * it is wide and faint while a page is in the air and tightens as the stack
 * builds, so the pages read as approaching a surface.
 *
 * Everything is driven off one cycle length with `times` offsets rather than
 * per-element delays, because framer-motion applies `delay` only to the first
 * iteration — staggering an infinite loop with it drifts into sync after the
 * first pass.
 */

/** Seconds for one full build-and-clear. */
const CYCLE = 3.4;

/** Where each page comes to rest — a fan, so three pages still read as three. */
const PAGES = [
  { x: -7, rotate: -8, start: 0.04, kind: "doc" },
  { x: 0, rotate: 0, start: 0.18, kind: "photo" },
  { x: 7, rotate: 8, start: 0.32, kind: "doc" },
] as const;

/** Fade the whole stack out at the end, so the loop has somewhere to restart. */
const CLEAR_FROM = 0.84;

export const DropHint: React.FC<DropHintProps> = ({
  isDragActive,
  hasFiles = false,
}) => {
  const reduceMotion = useReducedMotion();

  // It loops only while it is still asking for something. Once files are in, or
  // while one is being held over the zone, the stack rests — and under reduced
  // motion it never falls at all, a looping drop being exactly the repetitive
  // motion that setting exists to switch off.
  const still = reduceMotion || isDragActive || hasFiles;

  const loop = { duration: CYCLE, repeat: Infinity, ease: "easeOut" as const };

  return (
    <div
      aria-hidden
      className="relative flex h-[72px] w-24 flex-col items-center justify-end"
    >
      {PAGES.map((page, index) => {
        const land = page.start + 0.16;

        return (
          <motion.div
            key={index}
            className="absolute left-1/2 top-2 h-9 w-7 origin-bottom rounded-[3px] border border-line-strong bg-surface-raised"
            style={{ marginLeft: -14 }}
            animate={
              still
                ? {
                    // Held: the stack lifts and fans wider, which is the frame
                    // just before the one the gesture will produce.
                    x: isDragActive ? page.x * 1.5 : page.x,
                    y: isDragActive ? -8 : 0,
                    rotate: isDragActive ? page.rotate * 1.4 : page.rotate,
                    opacity: 1,
                  }
                : {
                    x: [page.x, page.x, page.x, page.x],
                    y: [-22, -22, 0, 0],
                    rotate: [
                      page.rotate - 10,
                      page.rotate - 10,
                      page.rotate,
                      page.rotate,
                    ],
                    opacity: [0, 0, 1, 0],
                  }
            }
            transition={
              still
                ? { type: "spring", stiffness: 320, damping: 26 }
                : {
                    ...loop,
                    times: [0, page.start, land, 1],
                    // Each page lands with the app's own settle curve; the rest
                    // of the cycle is it simply waiting to be cleared.
                    ease: ["linear", EASE_OUT, "easeIn"],
                  }
            }
          >
            {page.kind === "photo" ? (
              /* A horizon and a sun: the smallest drawing that reads as a
                 photograph at 28px, and it takes the section's own accent. */
              <span className="absolute inset-[3px] overflow-hidden rounded-[2px] bg-cat-surface">
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-cat/70" />
                <span className="absolute inset-x-0 bottom-0 h-3.5 bg-cat/40 [clip-path:polygon(0_100%,32%_38%,58%_100%)]" />
                <span className="absolute inset-x-0 bottom-0 h-2.5 bg-cat/25 [clip-path:polygon(30%_100%,70%_30%,100%_100%)]" />
              </span>
            ) : (
              <>
                {/* Ruled lines, so it reads as a document, not a blank card. */}
                <span className="absolute inset-x-1.5 top-2 h-px w-4 bg-cat/50" />
                <span className="absolute inset-x-1.5 top-[15px] h-px bg-line-strong" />
                <span className="absolute inset-x-1.5 top-[21px] h-px bg-line-strong" />
                <span className="absolute inset-x-1.5 top-[27px] h-px w-3 bg-line-strong" />
              </>
            )}
          </motion.div>
        );
      })}

      {/* Contact shadow: wide and faint under a page in the air, tight and dark
          under a stack that has landed. */}
      <motion.div
        className="absolute bottom-[7px] left-1/2 h-1 -translate-x-1/2 rounded-full bg-ink/25 blur-[3px]"
        animate={
          still
            ? {
                width: isDragActive ? 46 : 34,
                opacity: isDragActive ? 0.3 : 0.65,
              }
            : {
                width: [40, 40, 26, 34, 34],
                opacity: [0, 0.25, 0.6, 0.65, 0],
              }
        }
        transition={
          still
            ? { duration: 0.25 }
            : {
                ...loop,
                times: [
                  0,
                  PAGES[0].start,
                  PAGES[0].start + 0.16,
                  CLEAR_FROM,
                  1,
                ],
              }
        }
      />

      {/* The shelf they land on. */}
      <span className="h-[3px] w-16 rounded-full bg-line-strong" />
    </div>
  );
};

export default DropHint;
