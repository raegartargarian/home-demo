import kitchenAfter from "@/assets/drawings/kitchen-after.svg";
import kitchenBefore from "@/assets/drawings/kitchen-before.svg";
import floorPlan from "@/assets/drawings/floor-plan-a101.svg";
import roofStormDamage from "@/assets/drawings/roof-storm-damage.svg";
import { cn } from "@/lib/utils";
import {
  BeforeAfterCarousel,
  type BeforeAfterItem,
} from "@/shared/components/BeforeAfterCarousel";
import {
  BAND_RHYTHM,
  measureFor,
  PageContainer,
} from "@/shared/components/PageContainer";
import { SectionFileGrid } from "@/shared/components/SectionFileGrid";
import { EASE_OUT } from "@/shared/constants/motion";
import {
  ALL_STREAM_CODES,
  STREAM_CATEGORIES,
} from "@/shared/constants/streams";
import { motion } from "framer-motion";
import { LandingHero } from "./components/LandingHero";
import { ViewHomesLink } from "./components/ViewHomesLink";

/**
 * The landing page.
 *
 * Three rules from `docs/design-direction.md` do most of the work here:
 * colour is functional and never decorative, so the page is carried by warm
 * neutrals and the drawings; there are two weights of text, not five; and
 * anything above 2.4rem gets negative tracking — which is now the `display-*`
 * sizes' own business rather than each heading's, so no call site here spells
 * out a size, a leading or a tracking.
 *
 * The copy follows §6 — say the thing rather than describe it, name real
 * artefacts, and keep the chain a footnote rather than the headline.
 *
 * The opening lives in `components/LandingHero`. Everything below it is bands
 * on the warm ground, all breathing at `BAND_RHYTHM`.
 */

/** A band that steps back from the ground: hairline, sunken fill, page rhythm. */
const SUNKEN_BAND = `border-t border-line bg-surface-sunken ${BAND_RHYTHM}`;

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.5, ease: EASE_OUT },
};

/**
 * The peek carousel. Two of the three slides carry a `sketchSrc`, so they wipe
 * from drawing to finished state as they scroll in — plan → built, which is
 * the product's own story told without a line of copy.
 */
const STORY: BeforeAfterItem[] = [
  {
    src: kitchenBefore,
    sketchSrc: floorPlan,
    eyebrow: "1998 → 2024",
    caption: "The kitchen as built, before demolition",
    alt: "Kitchen elevation before the 2024 remodel",
  },
  {
    src: kitchenAfter,
    sketchSrc: kitchenBefore,
    eyebrow: "Kitchen remodel · 2024",
    caption: "The same wall at final walkthrough",
    alt: "Kitchen elevation after the 2024 remodel",
  },
  {
    src: roofStormDamage,
    eyebrow: "Storm damage · May 2026",
    caption: "Surveyed, permitted, replaced and warranted",
    alt: "Roof survey showing storm damage",
  },
];

const STEPS = [
  {
    title: "Everything goes in",
    body: "Plans, permits, invoices, warranties, walkthrough video, before-and-after photos — whatever the work produced.",
  },
  {
    title: "Every file is fixed to the record",
    body: "Each document is hashed and written to a ledger, so a receipt from 1998 is as provable as one from this morning.",
  },
  {
    title: "It transfers with the house",
    body: "Four of the five sections travel with the property at sale. The buyer inherits the history; your private vault stays yours.",
  },
];

const Dashboard = () => (
  <div className="bg-surface">
    <LandingHero />

    {/* The story, as drawings */}
    <section className={SUNKEN_BAND}>
      <PageContainer measure="wide" padding="none">
        <motion.div {...fadeInUp} className="mb-10 max-w-xl">
          <h2 className="text-display-sm font-medium text-ink">
            From the first sketch to the last receipt.
          </h2>
          <p className="mt-3 text-ink-muted">
            A house is not one moment. It is every phase that got it here — and
            each one leaves paper behind.
          </p>
        </motion.div>
      </PageContainer>
      {/* Full-bleed: the next card stays partly visible, and that peek is
          what invites the drag. */}
      <BeforeAfterCarousel items={STORY} className="px-4" />
    </section>

    {/* What's on the record — driven by the real taxonomy, not a copy of it */}
    <section className={BAND_RHYTHM}>
      <PageContainer measure="wide" padding="none">
        <motion.div {...fadeInUp} className="mb-10 max-w-xl">
          <h2 className="text-display-sm font-medium text-ink">
            Five sections. One house.
          </h2>
          <p className="mt-3 text-ink-muted">
            Every property vault carries the same five sections, whether the
            house is new or ninety years old.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_STREAM_CODES.map((code, index) => {
            const category = STREAM_CATEGORIES[code];
            return (
              <motion.div
                key={code}
                data-category={code}
                {...fadeInUp}
                transition={{ ...fadeInUp.transition, delay: index * 0.06 }}
                className="rounded-xl border border-line bg-surface-raised p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-cat-line bg-cat-surface">
                  <category.icon className="h-5 w-5 text-cat" aria-hidden />
                </div>
                <h3 className="text-base font-medium text-ink">
                  {category.label}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  {category.description}
                </p>
                <SectionFileGrid category={category} className="mt-4" />
                {!category.transfersOnSale && (
                  <p className="mt-4 border-t border-line pt-3 text-xs text-ink-subtle">
                    Private — detached at sale
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </PageContainer>
    </section>

    {/* How it works */}
    <section className={SUNKEN_BAND}>
      <PageContainer measure="wide" padding="none">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.title}
              {...fadeInUp}
              transition={{ ...fadeInUp.transition, delay: index * 0.1 }}
            >
              <span className="text-sm font-medium text-ink-subtle">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-lg font-medium tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </PageContainer>
    </section>

    {/* Closing */}
    <section className="py-20 md:py-28">
      <motion.div
        {...fadeInUp}
        className={cn("mx-auto w-full px-4 text-center", measureFor("prose"))}
      >
        <h2 className="text-display-md font-medium text-ink">
          Hand over the keys.
          <br />
          And the history.
        </h2>
        <ViewHomesLink tone="ground" className="mt-10" />
      </motion.div>
    </section>
  </div>
);

export default Dashboard;
