import * as React from "react";
import { ImageOff } from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export type BeforeAfterItem = {
  /** Resolved image URL. Omit (or let it 404) to render the placeholder. */
  src?: string;
  alt?: string;
  /** Small uppercase label above the caption — e.g. "Before" / "After". */
  eyebrow?: string;
  /** Overlaid caption, bottom-left. */
  caption?: string;
  /**
   * Optional plan/sketch/blueprint shown first. When present the slide wipes
   * from sketch to finished photo as it scrolls into view.
   */
  sketchSrc?: string;
};

type BeforeAfterCarouselProps = {
  items: BeforeAfterItem[];
  /** Slide aspect ratio. Defaults to the 4:3 the reference uses. */
  aspect?: string;
  /** Hide the desktop arrows when the surrounding layout supplies its own. */
  showArrows?: boolean;
  className?: string;
};

/** Photos as stored on a home record fixture. */
type RecordPhotos = { before?: string[]; after?: string[] };

/**
 * Adapts a record's `photos` block into slides, interleaved before → after so
 * each pair sits side by side as you scroll.
 */
export const toBeforeAfterItems = (
  photos: RecordPhotos | undefined,
  resolve: (fileName: string) => string | undefined,
  captionFor?: (fileName: string, phase: "before" | "after") => string,
): BeforeAfterItem[] => {
  const { before = [], after = [] } = photos ?? {};

  return Array.from({ length: Math.max(before.length, after.length) }).flatMap(
    (_, i) =>
      (
        [
          ["before", before[i]],
          ["after", after[i]],
        ] as const
      )
        .filter(([, fileName]) => Boolean(fileName))
        .map(([phase, fileName]) => ({
          src: resolve(fileName as string),
          alt: `${phase} — ${fileName}`,
          eyebrow: phase === "before" ? "Before" : "After",
          caption: captionFor?.(fileName as string, phase),
        })),
  );
};

/** preflight is disabled in tailwind.config.js — size images by hand. */
const IMG_CLASS = "block h-full w-full select-none object-cover";

/** Long and eased-out, so the reveal reads as drawn rather than swiped. */
const WIPE = { duration: 1.2, ease: [0.65, 0, 0.35, 1] as const };

const Slide = ({ item, aspect }: { item: BeforeAfterItem; aspect: string }) => {
  const [failed, setFailed] = React.useState(false);
  const showPlaceholder = !item.src || failed;

  const ref = React.useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  // `once` — the reveal is a reward for arriving, not something to re-watch.
  const inView = useInView(ref, { once: true, amount: 0.45 });
  const revealed = inView || reduceMotion;
  const hasSketch = Boolean(item.sketchSrc) && !showPlaceholder;

  return (
    <figure
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-xl bg-surface-sunken",
        aspect,
      )}
    >
      {showPlaceholder ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-subtle">
          <ImageOff className="h-7 w-7" strokeWidth={1.5} />
          <span className="text-xs font-medium">Photo not yet added</span>
        </div>
      ) : (
        <img
          src={item.src}
          alt={item.alt ?? item.caption ?? ""}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={IMG_CLASS}
          draggable={false}
        />
      )}

      {hasSketch && (
        <>
          {/* Sketch sits on top and is wiped away to expose the photo beneath. */}
          <motion.div
            aria-hidden
            className="absolute inset-0"
            initial={false}
            animate={{
              clipPath: revealed
                ? "inset(0% 0% 0% 100%)"
                : "inset(0% 0% 0% 0%)",
            }}
            transition={reduceMotion ? { duration: 0 } : WIPE}
          >
            <img
              src={item.sketchSrc}
              alt=""
              loading="lazy"
              decoding="async"
              className={IMG_CLASS}
              draggable={false}
            />
          </motion.div>

          {/* The travelling edge — the detail that sells it as being drawn. */}
          {!reduceMotion && (
            <motion.div
              aria-hidden
              className="absolute inset-y-0 w-px bg-white/70 shadow-[0_0_12px_2px_rgb(255_255_255/0.45)]"
              initial={false}
              animate={{ left: revealed ? "100%" : "0%", opacity: revealed ? 0 : 1 }}
              transition={{ ...WIPE, opacity: { delay: 1.0, duration: 0.2 } }}
            />
          )}
        </>
      )}

      {(item.eyebrow || item.caption) && (
        <>
          {/* Scrim: only as dark as the caption needs, so the photo stays the subject. */}
          {!showPlaceholder && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent"
            />
          )}
          <figcaption
            className={cn(
              "absolute bottom-0 left-0 p-6 md:p-8",
              showPlaceholder ? "text-ink" : "text-white",
            )}
          >
            {item.eyebrow && (
              <div
                className={cn(
                  "mb-1 text-[11px] font-medium uppercase tracking-[0.14em]",
                  showPlaceholder ? "text-ink-subtle" : "text-white/75",
                )}
              >
                {item.eyebrow}
              </div>
            )}
            {item.caption && (
              <div className="text-lg font-medium tracking-[-0.01em] md:text-xl">
                {item.caption}
              </div>
            )}
          </figcaption>
        </>
      )}
    </figure>
  );
};

/**
 * Horizontal peek carousel — full-bleed rounded cards with the next slide
 * partly visible, captions overlaid bottom-left. Drag, arrow keys and the
 * desktop arrows all scroll it.
 */
export const BeforeAfterCarousel = ({
  items,
  aspect = "aspect-[4/3]",
  showArrows = true,
  className,
}: BeforeAfterCarouselProps) => {
  if (!items.length) return null;

  return (
    <Carousel
      opts={{ align: "start", containScroll: "trimSnaps" }}
      className={cn("group/carousel relative", className)}
    >
      {/* Negative margin cancels the first slide's gutter so it aligns flush. */}
      <CarouselContent className="-ml-4 md:-ml-6">
        {items.map((item, i) => (
          <CarouselItem
            key={`${item.eyebrow ?? ""}-${item.src ?? i}`}
            className="basis-[86%] pl-4 sm:basis-[70%] md:basis-[56%] md:pl-6 lg:basis-[46%]"
          >
            <Slide item={item} aspect={aspect} />
          </CarouselItem>
        ))}
      </CarouselContent>

      {showArrows && (
        <>
          <CarouselPrevious className="left-4 hidden h-10 w-10 border-white/50 bg-white/70 text-ink opacity-0 shadow-lg backdrop-blur-xl backdrop-saturate-150 transition-opacity group-hover/carousel:opacity-100 focus-visible:opacity-100 disabled:opacity-0 md:flex" />
          <CarouselNext className="right-4 hidden h-10 w-10 border-white/50 bg-white/70 text-ink opacity-0 shadow-lg backdrop-blur-xl backdrop-saturate-150 transition-opacity group-hover/carousel:opacity-100 focus-visible:opacity-100 disabled:opacity-0 md:flex" />
        </>
      )}
    </Carousel>
  );
};
