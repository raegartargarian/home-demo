import { cn } from "@/lib/utils";
import React from "react";

/**
 * The measure of a page.
 *
 * Every page in the app centres its content in one of three widths, and which
 * one it gets is decided by what the content *is* rather than by whoever wrote
 * the page. Before this existed the app used five different measures across six
 * pages — `max-w-4xl` here, `max-w-5xl` there, `max-w-6xl` on the page beside
 * it — so moving between pages shifted the left edge of the text under you.
 *
 * The three, and the rule for choosing:
 *
 * - `wide` — a grid of cards. Two or three columns need the room, and the cards
 *   carry their own internal margin, so a wide well does not read as sprawl.
 * - `standard` — rows, timelines and detail pages. A row is read left to right,
 *   and past roughly this width the eye loses the line on the way back.
 * - `prose` — centred copy. Narrower than anything it sits inside, because a
 *   centred paragraph is read like a paragraph.
 *
 * Full-bleed elements (the vault hero) sit outside the container and take the
 * same measure for their own inner well, so the heading over a photograph lines
 * up with the content beneath it. Pass `measureFor(...)` for that.
 *
 * There is a fourth value, `inherit`, and it is deliberately not a width: it
 * means *a layout above already owns the well*. The vault shell centres one
 * `wide` well and divides it into a structure column and a content column, so a
 * page inside it must not centre itself a second time. It keeps the page's
 * vertical rhythm and gives up the horizontal one.
 */
export type PageMeasure = "wide" | "standard" | "prose";
export type PageWell = PageMeasure | "inherit";

const MEASURE: Record<PageMeasure, string> = {
  wide: "max-w-6xl",
  standard: "max-w-4xl",
  prose: "max-w-3xl",
};

/** The width class alone, for a full-bleed band's inner well. */
export const measureFor = (measure: PageMeasure): string => MEASURE[measure];

/**
 * The rhythm of a landing-page band, as a class string.
 *
 * Exported for the same reason `measureFor` is: a band that runs full-bleed
 * cannot *be* a `PageContainer` — the carousel has to escape the well to keep
 * the next card peeking — but it still has to breathe at the same rate as the
 * bands above and below it, or the page reads as sections bolted together.
 */
export const BAND_RHYTHM = "py-16 md:py-24";

interface PageContainerProps {
  measure?: PageWell;
  /**
   * Vertical rhythm. `page` for a screen inside the app, `band` for a landing
   * section, `none` for a wrapper that sets its own.
   */
  padding?: "page" | "band" | "none";
  as?: "div" | "main" | "section";
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  measure = "standard",
  padding = "page",
  as: Tag = "div",
  children,
  className,
}) => (
  <Tag
    className={cn(
      "w-full",
      measure !== "inherit" && `mx-auto px-4 ${MEASURE[measure]}`,
      padding === "page" && "py-8",
      padding === "band" && BAND_RHYTHM,
      className,
    )}
  >
    {children}
  </Tag>
);

export default PageContainer;
