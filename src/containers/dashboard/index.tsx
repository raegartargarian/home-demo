import axonometric from "@/assets/drawings/exploded-axonometric.svg";
import kitchenAfter from "@/assets/drawings/kitchen-after.svg";
import kitchenBefore from "@/assets/drawings/kitchen-before.svg";
import floorPlan from "@/assets/drawings/floor-plan-a101.svg";
import roofStormDamage from "@/assets/drawings/roof-storm-damage.svg";
import {
  BeforeAfterCarousel,
  type BeforeAfterItem,
} from "@/shared/components/BeforeAfterCarousel";
import { SectionFileGrid } from "@/shared/components/SectionFileGrid";
import { appRoutes } from "@/shared/constants/routes";
import {
  ALL_STREAM_CODES,
  STREAM_CATEGORIES,
} from "@/shared/constants/streams";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * The landing page.
 *
 * Three rules from `docs/design-direction.md` do most of the work here:
 * colour is functional and never decorative, so the page is carried by warm
 * neutrals and the drawings; there are two weights of text, not five; and
 * anything above 2.4rem gets negative tracking.
 *
 * The copy follows §6 — say the thing rather than describe it, name real
 * artefacts, and keep the chain a footnote rather than the headline.
 */

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
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

const Dashboard = () => {
  return (
    <div className="bg-surface">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-10 md:pb-28 md:pt-16">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-[2.75rem] font-medium leading-[1.05] tracking-tighter text-ink md:text-6xl lg:text-[4.2rem]">
              Your whole house,
              <br />
              in one place.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-muted">
              Every plan, permit, renovation and receipt, from the first sketch
              to the final walkthrough. Verified, and yours to hand on.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to={appRoutes.vaults.path}
                className="inline-flex items-center justify-center rounded-full bg-brand px-7 py-3.5 text-base font-medium text-ink-inverse transition-colors hover:bg-brand-hover"
              >
                View your homes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <span className="text-sm text-ink-subtle sm:ml-4">
                4412 Maple Ridge Drive · 22 records on file
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-3xl"
          >
            <img
              src={axonometric}
              alt="Exploded axonometric drawing of the property: foundation, first floor, systems and roof, each annotated with the record that documents it"
              className="block h-full w-full object-cover"
              draggable={false}
            />
          </motion.div>
        </div>
      </section>

      {/* The story, as drawings */}
      <section className="border-t border-line bg-surface-sunken py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div {...fadeInUp} className="mb-10 max-w-xl">
            <h2 className="text-3xl font-medium tracking-tight text-ink md:text-4xl">
              From the first sketch to the last receipt.
            </h2>
            <p className="mt-3 text-ink-muted">
              A house is not one moment. It is every phase that got it here —
              and each one leaves paper behind.
            </p>
          </motion.div>
        </div>
        {/* Full-bleed: the next card stays partly visible, and that peek is
            what invites the drag. */}
        <BeforeAfterCarousel items={STORY} className="px-4" />
      </section>

      {/* What's on the record — driven by the real taxonomy, not a copy of it */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div {...fadeInUp} className="mb-10 max-w-xl">
            <h2 className="text-3xl font-medium tracking-tight text-ink md:text-4xl">
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
                  className="rounded-2xl border border-line bg-surface-raised p-6"
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
                  <SectionFileGrid code={code} className="mt-4" />
                  {!category.transfersOnSale && (
                    <p className="mt-4 border-t border-line pt-3 text-xs text-ink-subtle">
                      Private — detached at sale
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-line bg-surface-sunken py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4">
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
        </div>
      </section>

      {/* Closing */}
      <section className="py-20 md:py-28">
        <motion.div {...fadeInUp} className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-medium tracking-tight text-ink md:text-5xl">
            Hand over the keys.
            <br />
            And the history.
          </h2>
          <Link
            to={appRoutes.vaults.path}
            className="mt-10 inline-flex items-center justify-center rounded-full bg-brand px-8 py-4 text-base font-medium text-ink-inverse transition-colors hover:bg-brand-hover"
          >
            View your homes
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Dashboard;
