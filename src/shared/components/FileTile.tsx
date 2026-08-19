import { cn } from "@/lib/utils";
import React from "react";

/**
 * The face of a file, at thumbnail size.
 *
 * One frame, three interchangeable faces, used in two places: the landing page
 * shows what *belongs* in a section (see `SectionFileGrid`), the vault shows
 * what is actually *filed* in one (see `RecordTile`). Both read as a shelf of
 * files rather than a list of words, and they read as the same shelf because
 * the chrome lives here rather than being written twice.
 *
 * Nothing here carries a colour of its own. The accents come from the `--cat-*`
 * variables the surrounding section sets, so a tile takes on whichever section
 * it is rendered in — a fixed blue face inside an amber Maintenance card reads
 * as a bug.
 */

/**
 * The shelf: three tiles across, whatever is standing on it. Shared so the
 * landing page's promise of a section and the vault's rendering of one cannot
 * drift into two different grids.
 */
export const TILE_GRID_CLASS = "grid list-none grid-cols-3 gap-1.5 pl-0";

/** The frame every face sits in: fixed ratio, so a row of tiles lines up. */
const TILE_CLASS =
  "relative flex aspect-[4/3] flex-col overflow-hidden rounded-lg border border-line bg-surface-raised";

/**
 * Two sizes, because the same tile is rendered at two very different widths:
 * ~90px in a landing-page card three across, ~160px in a vault section six
 * across. One label size for both leaves the text either unreadable or comic.
 *
 * Both give the label two lines at a fixed height, so every tile's face ends at
 * the same place. The heights are the two lines plus their padding — set either
 * tighter and a two-line name gets its descenders sheared off.
 */
const SIZES = {
  sm: {
    label:
      "line-clamp-2 h-[30px] shrink-0 border-t border-line px-1.5 py-[3px] text-[9px] leading-[1.3] text-ink-muted",
    badge:
      "absolute right-1 top-1 rounded bg-cat-surface px-1 text-[7px] font-medium leading-[1.4] text-cat-ink",
  },
  md: {
    label:
      "line-clamp-2 h-[38px] shrink-0 border-t border-line px-2 py-1 text-[11px] leading-[1.35] text-ink-muted",
    badge:
      "absolute right-1.5 top-1.5 rounded bg-cat-surface px-1 py-px text-[9px] font-medium leading-[1.4] text-cat-ink",
  },
} as const;

export type FileTileSize = keyof typeof SIZES;

interface FileTileProps {
  label: string;
  /** Sits top-right over the face: "PDF", "XLS", "IMG". */
  format?: string;
  /** `sm` for the landing-page cards, `md` for the wider vault sections. */
  size?: FileTileSize;
  /** The face itself — one of the `*Face` components below. */
  children: React.ReactNode;
  className?: string;
}

export const FileTile: React.FC<FileTileProps> = ({
  label,
  format,
  size = "sm",
  children,
  className,
}) => (
  <div className={cn(TILE_CLASS, className)}>
    <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    {format && <span className={SIZES[size].badge}>{format}</span>}
    <p className={SIZES[size].label}>{label}</p>
  </div>
);

/** A miniature document: header rule over ruled body. */
export const DocFace: React.FC = () => (
  <div className="h-full p-2">
    <div className="h-1 w-2/3 rounded-full bg-cat/50" />
    <div className="mt-1.5 space-y-1">
      <div className="h-[3px] w-full rounded-full bg-line" />
      <div className="h-[3px] w-11/12 rounded-full bg-line" />
      <div className="h-[3px] w-full rounded-full bg-line" />
      <div className="h-[3px] w-3/4 rounded-full bg-line" />
    </div>
  </div>
);

/** A set of colours — the paint schedule, which reads best as itself. */
export const SwatchFace: React.FC<{ colors: string[] }> = ({ colors }) => (
  <div className="flex h-full">
    {colors.map((color) => (
      <div key={color} className="flex-1" style={{ backgroundColor: color }} />
    ))}
  </div>
);

/**
 * One of the architectural drawings.
 *
 * The drawings are square and the tile is 4:3, so `object-cover` crops a little
 * off the top and bottom — which is what you want, since the drawing's own
 * title block sits in the margin. It is deliberately *not* zoomed further: the
 * lettering inside these SVGs is part of the artwork, and scaling it up crops
 * words mid-letter instead of making them legible.
 */
export const DrawingFace: React.FC<{ src: string; alt: string }> = ({
  src,
  alt,
}) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    className="h-full w-full object-cover"
  />
);
