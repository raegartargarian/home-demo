import axonometric from "@/assets/drawings/exploded-axonometric.svg";
import floorPlan from "@/assets/drawings/floor-plan-a101.svg";
import kitchenAfter from "@/assets/drawings/kitchen-after.svg";
import kitchenBefore from "@/assets/drawings/kitchen-before.svg";
import roofStormDamage from "@/assets/drawings/roof-storm-damage.svg";
import { cn } from "@/lib/utils";
import {
  DocFace,
  DrawingFace,
  FileTile,
  SwatchFace,
  TILE_GRID_CLASS,
  type FileTileSize,
} from "@/shared/components/FileTile";
import {
  isKnownSection,
  StreamCategory,
  StreamCategoryCode,
} from "@/shared/constants/streams";
import React from "react";

/**
 * What a section holds, shown as files rather than listed as words.
 *
 * A bulleted list of "Floor plans · Builder documents · Paint colours" tells
 * you what belongs in a section; a grid of file faces shows you what having one
 * is actually like. Same information, and the second one is the product.
 *
 * Everything here is drawn, not photographed: the five architectural SVGs the
 * repo already ships, plus document tiles rendered in CSS. Nothing is a stock
 * photo standing in for a real home — and because each tile takes its accent
 * from the `--cat-*` variables the parent card sets, the five sections read as
 * five distinct things without a single per-section colour in this file.
 */

type PreviewTile =
  | { kind: "drawing"; src: string; label: string; alt: string }
  | { kind: "doc"; label: string; format: string }
  | { kind: "swatch"; label: string; colors: string[] };

/**
 * Six per section — two rows of three, so all five cards stand the same height.
 * The labels are the section's own `contents`, kept verbatim, so the grid still
 * teaches what belongs where.
 */
const TILES: Record<StreamCategoryCode, PreviewTile[]> = {
  "home-profile": [
    {
      kind: "drawing",
      src: floorPlan,
      label: "Floor plan A-101",
      alt: "Architectural floor plan",
    },
    { kind: "doc", label: "Builder documents", format: "PDF" },
    {
      kind: "swatch",
      label: "Paint colours",
      // Warm neutrals and a single deep accent — the palette a spec sheet for
      // this kind of house actually carries.
      colors: ["#EDE7DE", "#D8CFC2", "#A9A093", "#4A5A50"],
    },
    { kind: "doc", label: "Material specifications", format: "PDF" },
    { kind: "doc", label: "Certificate of Occupancy", format: "PDF" },
    { kind: "doc", label: "Initial surveys", format: "PDF" },
  ],
  "maintenance-upgrades": [
    {
      kind: "drawing",
      src: kitchenBefore,
      label: "Before demolition",
      alt: "Kitchen elevation before the remodel",
    },
    {
      kind: "drawing",
      src: kitchenAfter,
      label: "After completion",
      alt: "Kitchen elevation after the remodel",
    },
    {
      kind: "drawing",
      src: roofStormDamage,
      label: "Storm damage",
      alt: "Roof plan marking storm damage",
    },
    { kind: "doc", label: "Contractor invoices", format: "PDF" },
    { kind: "doc", label: "Inspection reports", format: "PDF" },
    { kind: "doc", label: "Maintenance records", format: "XLS" },
  ],
  "systems-warranties": [
    {
      kind: "drawing",
      src: axonometric,
      label: "Systems axonometric",
      alt: "Exploded axonometric drawing of the house systems",
    },
    { kind: "doc", label: "HVAC manual", format: "PDF" },
    { kind: "doc", label: "Appliance warranties", format: "PDF" },
    { kind: "doc", label: "Solar specification", format: "PDF" },
    { kind: "doc", label: "Serial numbers", format: "XLS" },
    { kind: "doc", label: "Smart home devices", format: "PDF" },
  ],
  "property-records": [
    { kind: "doc", label: "Deed", format: "PDF" },
    {
      kind: "drawing",
      src: floorPlan,
      label: "Boundary survey",
      alt: "Survey drawing of the property boundary",
    },
    { kind: "doc", label: "HOA documentation", format: "PDF" },
    { kind: "doc", label: "Zoning", format: "PDF" },
    { kind: "doc", label: "Permits", format: "PDF" },
    { kind: "doc", label: "Compliance records", format: "PDF" },
  ],
  "personal-vault": [
    { kind: "doc", label: "Mortgage documents", format: "PDF" },
    { kind: "doc", label: "Insurance policies", format: "PDF" },
    { kind: "doc", label: "Insurance claims", format: "PDF" },
    { kind: "doc", label: "Property taxes", format: "XLS" },
    { kind: "doc", label: "Financing documents", format: "PDF" },
    { kind: "doc", label: "Statements", format: "PDF" },
  ],
};

/**
 * The set a section gets when the taxonomy does not name one.
 *
 * The five are specific because the architecture doc says what is in them; a
 * section someone added is specific to their house and nothing here knows what
 * that is. What *is* knowable is the paperwork any job leaves behind, so the
 * template is the six document types every trade produces, carrying the
 * section's own name so the grid reads as belonging to it rather than as a
 * stock list dropped in.
 *
 * Same six every time, which is the point of a template: two rows of three, so
 * a named section stands the same height as the five beside it.
 */
const standardTiles = (label: string): PreviewTile[] => [
  { kind: "doc", label: `${label} photos`, format: "IMG" },
  { kind: "doc", label: `${label} quote`, format: "PDF" },
  { kind: "doc", label: `${label} invoice`, format: "PDF" },
  { kind: "doc", label: `${label} warranty`, format: "PDF" },
  { kind: "doc", label: `${label} permit`, format: "PDF" },
  { kind: "doc", label: `${label} receipts`, format: "XLS" },
];

interface SectionFileGridProps {
  /** The section itself: one of the five has its own set, and so does anything
   *  else, built from its name. */
  category: StreamCategory;
  /** `sm` for the landing-page cards, `md` for the wider vault sections. */
  size?: FileTileSize;
  className?: string;
}

export const SectionFileGrid: React.FC<SectionFileGridProps> = ({
  category,
  size,
  className,
}) => (
  <ul className={cn(TILE_GRID_CLASS, className)}>
    {(isKnownSection(category)
      ? TILES[category.code]
      : standardTiles(category.label)
    ).map((tile) => (
      <li key={tile.label}>
        <FileTile
          label={tile.label}
          format={tile.kind === "doc" ? tile.format : undefined}
          size={size}
        >
          {tile.kind === "drawing" ? (
            <DrawingFace src={tile.src} alt={tile.alt} />
          ) : tile.kind === "swatch" ? (
            <SwatchFace colors={tile.colors} />
          ) : (
            <DocFace />
          )}
        </FileTile>
      </li>
    ))}
  </ul>
);

export default SectionFileGrid;
