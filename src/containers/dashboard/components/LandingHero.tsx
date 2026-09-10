import houseFilmDesktop from "@/assets/video/house-demo-desktop.mp4";
import houseFilmMobile from "@/assets/video/house-demo-mobile.mp4";
import houseOpen from "@/assets/video/house-demo-open.jpg";
import houseStill from "@/assets/video/house-demo-poster.jpg";
import { cn } from "@/lib/utils";
import { measureFor } from "@/shared/components/PageContainer";
import { EASE_OUT } from "@/shared/constants/motion";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRef } from "react";
import { ViewHomesLink } from "./ViewHomesLink";

/**
 * The landing page's opening: the house, at full height, with the type on it.
 *
 * The film was the strongest asset on the page and it used to hold about a
 * fifth of the fold, in a card beside the headline, on the warm ground. Given
 * the frame it does the job the copy was doing alone — the page is about a
 * whole house, so the whole house is what you see.
 *
 * It plays once and stops, because the clip is a build sequence rather than a
 * loop. See the `<video>` below.
 *
 * Three things this borrows rather than invents. `PageLayout bleed` already
 * exists for a page that opens on an image and wants to run under the floating
 * header; `PropertyHero` already worked out the scrim, the `svh` clamp and the
 * `measureFor` inner well that lines type over an image up with the content
 * below it; and the curve is the app's one `EASE_OUT`. This is the second page
 * to open on a picture, not a new pattern.
 */

/**
 * Two gradients, because one cannot do both jobs.
 *
 * The bottom stop is for the type block. The left stop covers the copy well
 * specifically, and it exists for one second in particular: the film opens on a
 * near-white blueprint, and white type on a white drawing is the worst frame in
 * the clip. Tuned against that frame and against the dusk house it rests on —
 * heavy enough for the blueprint, light enough that the finished house does not
 * go muddy.
 *
 * The top is deliberately light. The header island is glass, and glass over a
 * scrim is just fog — the film has to still read around it.
 */
const SCRIM_BOTTOM =
  "linear-gradient(to bottom," +
  "rgba(24,23,21,0.34) 0%," +
  "rgba(24,23,21,0.12) 26%," +
  "rgba(24,23,21,0.36) 56%," +
  "rgba(24,23,21,0.80) 86%," +
  "rgba(24,23,21,0.90) 100%)";

const SCRIM_LEFT =
  "linear-gradient(to right," +
  "rgba(24,23,21,0.60) 0%," +
  "rgba(24,23,21,0.30) 40%," +
  "rgba(24,23,21,0) 72%)";

/**
 * Film grain, as one 140px tile of fractal noise.
 *
 * The master is 720p and the hero is full-bleed, so some upscaling is
 * unavoidable however good the encode. `scripts/generateHeroVideo.mjs` does the
 * bulk of the work by upscaling and sharpening ahead of the browser; this is
 * the last few percent. Grain adds no detail back, but it gives the eye
 * something sharp to hold, which is what makes softness read as film rather
 * than as a low bitrate. Kept under 8% — past that it is a texture, not a mask.
 */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** `md` in `src/styles/configs/tailwind-theme.js`. Change both together. */
const DESKTOP = "(min-width: 900px)";

/**
 * The entrance, as an index rather than a variant tree.
 *
 * Four elements arriving 60ms apart. Written as explicit delays because variant
 * propagation through the plain `<h1>` that holds the two headline lines is a
 * thing you have to reason about, and a delay you can read off the call site is
 * worth more here than the machinery.
 *
 * No overshoot anywhere. Nothing on this page was thrown by the reader, and a
 * spring that bounces on arrival is motion admiring itself.
 */
const rise = (index: number, reduced: boolean | null) =>
  reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 },
      }
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: {
          duration: 0.6,
          delay: 0.1 + index * 0.06,
          ease: EASE_OUT,
        },
      };

export const LandingHero = () => {
  const heroRef = useRef<HTMLElement>(null);

  // Someone who has asked their system for less motion gets the last frame
  // rather than nothing: the finished house, which is where the film ends and
  // what the page is about.
  const reduceMotion = useReducedMotion();
  const isDesktop = useMediaQuery(DESKTOP);

  // Measured from the hero's own top hitting the viewport top, to its bottom
  // doing the same — so progress is 1 exactly as the hero finishes leaving.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // The film lags the page and pushes in; the copy leaves early and upward. The
  // pair is what makes the handoff to the section below read as a camera move
  // instead of a cut. Both are `transform`/`opacity` only, so none of it lands
  // on the main thread.
  const filmScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const filmY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  // Hooks run either way; only the styles are withheld. Scroll-linked motion is
  // exactly the vestibular kind reduced motion is asking us to drop.
  const filmStyle = reduceMotion
    ? undefined
    : { scale: filmScale, y: filmY, willChange: "transform" };
  const copyStyle = reduceMotion
    ? undefined
    : { opacity: copyOpacity, y: copyY };

  return (
    <section
      ref={heroRef}
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-surface-inset"
    >
      <motion.div
        aria-hidden
        style={filmStyle}
        className="absolute inset-0 -z-10"
      >
        {reduceMotion ? (
          <img
            src={houseStill}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <video
            // Chosen here rather than with `<source media>`: that attribute is
            // only honoured inside `<picture>`, so a phone would quietly take
            // the desktop cut. Rendering one element also means the other never
            // exists to fetch — hiding it would not have been enough.
            src={isDesktop ? houseFilmDesktop : houseFilmMobile}
            // The opening frame, so the first paint is where playback begins
            // rather than somewhere else in the clip.
            poster={houseOpen}
            autoPlay
            // Deliberately not `loop`. The clip is a build sequence — blueprint,
            // slab, framing, cladding, finished house — so looping it un-builds
            // the house every seven seconds behind the headline, forever. It
            // plays once and holds on the last frame, which is the state the
            // page is actually about.
            muted
            playsInline
            // Above the fold and wanted immediately; the poster covers the gap.
            preload="auto"
            // Decorative: the copy over it already says what the page is about,
            // and a caption describing the build sequence would be read out
            // on every visit.
            tabIndex={-1}
            className="h-full w-full object-cover"
          />
        )}
      </motion.div>

      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ backgroundImage: SCRIM_BOTTOM }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 hidden md:block"
        style={{ backgroundImage: SCRIM_LEFT }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />

      <motion.div
        style={copyStyle}
        className={cn(
          "mx-auto w-full px-4 pt-28",
          // The mobile nav pill floats at the bottom of the viewport and would
          // otherwise land on the call to action.
          "pb-[calc(env(safe-area-inset-bottom,0px)+7rem)] md:pb-24",
          measureFor("wide"),
        )}
      >
        {/* White, not `text-ink-inverse`: that token flips with the theme, and
            the ground here is a film either way. No width cap — the well is the
            measure, and a `ch` cap chosen for one size breaks the line
            somewhere different at every other size. */}
        <h1 className="text-display-lg font-medium text-white drop-shadow-sm">
          <motion.span {...rise(0, reduceMotion)} className="block">
            Your whole house,
          </motion.span>
          <motion.span {...rise(1, reduceMotion)} className="block">
            in one place.
          </motion.span>
        </h1>

        <motion.p
          {...rise(2, reduceMotion)}
          className="mt-6 max-w-xl text-lg leading-relaxed text-white/80"
        >
          Every plan, permit, renovation and receipt, from the first sketch to
          the final walkthrough. Verified, and yours to hand on.
        </motion.p>

        <motion.div
          {...rise(3, reduceMotion)}
          className="mt-10 flex items-center gap-6"
        >
          <ViewHomesLink tone="film" />

          {/* A full-height opening owes the reader a note that there is more
              below it. Right-aligned rather than centred, because centre-bottom
              is where the mobile nav pill lives. */}
          <motion.span
            aria-hidden
            className="ml-auto hidden items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/60 md:flex"
            animate={reduceMotion ? undefined : { y: [0, 6, 0] }}
            transition={
              reduceMotion
                ? undefined
                : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
            }
          >
            Scroll
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default LandingHero;
