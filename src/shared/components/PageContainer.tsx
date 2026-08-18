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
 */
export type PageMeasure = "wide" | "standard" | "prose";

const MEASURE: Record<PageMeasure, string> = {
  wide: "max-w-6xl",
  standard: "max-w-4xl",
  prose: "max-w-3xl",
};

/** The width class alone, for a full-bleed band's inner well. */
export const measureFor = (measure: PageMeasure): string => MEASURE[measure];

interface PageContainerProps {
  measure?: PageMeasure;
  /** Vertical rhythm. `none` for a band that sets its own. */
  padding?: "page" | "none";
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
      "mx-auto w-full px-4",
      padding === "page" && "py-8",
      MEASURE[measure],
      className,
    )}
  >
    {children}
  </Tag>
);

export default PageContainer;
