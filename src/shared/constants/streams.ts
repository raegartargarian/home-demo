import { Cpu, Home, Landmark, Lock, LucideIcon, Wrench } from "lucide-react";

/**
 * The Filedgr House Template — five-section architecture.
 *
 * Source of truth: "Filedgr Property Vault – Proposed Architecture (MVP &
 * Future Vision)". The taxonomy is fixed at five streams and does not grow;
 * customer-specific structure is expressed by which streams a scenario surfaces
 * and, later, by Event Vaults layered on top (see `transfersOnSale` below).
 *
 * The governing idea is the transfer boundary:
 *
 *   The Vault is attached to the physical property, not the individual owner.
 *   Four permanent streams travel with the property throughout its lifetime;
 *   one private stream belongs to the current homeowner and is detached at sale.
 *
 * That boundary is data, not decoration — `transfersOnSale` drives the badge on
 * every stream, and it is what a future transfer flow will branch on.
 *
 * `code` values are the canonical stream `asset_code` slugs. Seed vaults on the
 * backend with these exact slugs so an incoming stream maps to its section,
 * accent and copy. Streams seeded under the previous six-category taxonomy are
 * still resolved via LEGACY_CODE_ALIASES.
 */

export type StreamCategoryCode =
  | "home-profile"
  | "maintenance-upgrades"
  | "systems-warranties"
  | "property-records"
  | "personal-vault";

export interface StreamCategory {
  code: StreamCategoryCode;
  /** Short display name shown on the stream card. */
  label: string;
  /** One-line description shown under the stream name. */
  description: string;
  /** Icon rendered in the stream's accent tile. */
  icon: LucideIcon;
  /** Ordering on the vault detail page (low = first). */
  order: number;
  /**
   * Representative contents, verbatim from the architecture doc. Shown in empty
   * states so an unpopulated stream still tells the homeowner what belongs in it
   * — an empty card that only says "no records yet" teaches nothing.
   */
  contents: string[];
  /**
   * Whether this stream travels with the property at sale. False for exactly one
   * stream (the Personal Vault), which is detached on transfer: the seller keeps
   * a private archive and the buyer receives a new empty one.
   */
  transfersOnSale: boolean;
}

export const STREAM_CATEGORIES: Record<StreamCategoryCode, StreamCategory> = {
  "home-profile": {
    code: "home-profile",
    label: "Home Profile",
    description: "The original identity of the home.",
    icon: Home,
    order: 1,
    contents: [
      "Floor plans",
      "Builder documents",
      "Material specifications",
      "Paint colours",
      "Certificate of Occupancy",
      "Initial surveys",
    ],
    transfersOnSale: true,
  },
  "maintenance-upgrades": {
    code: "maintenance-upgrades",
    label: "Maintenance & Upgrades",
    description: "The ongoing history of work performed on the property.",
    icon: Wrench,
    order: 2,
    contents: [
      "Repairs",
      "Renovations",
      "Maintenance records",
      "Contractor invoices",
      "Photos",
      "Inspection reports",
    ],
    transfersOnSale: true,
  },
  "systems-warranties": {
    code: "systems-warranties",
    label: "Systems & Warranties",
    description: "Information relating to installed equipment.",
    icon: Cpu,
    order: 3,
    contents: [
      "HVAC",
      "Appliances",
      "Solar",
      "Smart home devices",
      "Manuals",
      "Serial numbers",
      "Warranties",
    ],
    transfersOnSale: true,
  },
  "property-records": {
    code: "property-records",
    label: "Property Records",
    description: "Legal and operational property information.",
    icon: Landmark,
    order: 4,
    contents: [
      "Deeds",
      "Surveys",
      "HOA documentation",
      "Zoning",
      "Permits",
      "Compliance records",
    ],
    transfersOnSale: true,
  },
  "personal-vault": {
    code: "personal-vault",
    label: "Personal Vault",
    description: "Information belonging only to the current homeowner.",
    icon: Lock,
    order: 5,
    contents: [
      "Mortgage documents",
      "Insurance policies",
      "Insurance claims",
      "Property taxes",
      "Financing documents",
    ],
    transfersOnSale: false,
  },
};

export const ALL_STREAM_CODES = (
  Object.keys(STREAM_CATEGORIES) as StreamCategoryCode[]
).sort((a, b) => STREAM_CATEGORIES[a].order - STREAM_CATEGORIES[b].order);

/**
 * Slugs from the earlier six-category taxonomy, mapped onto the five sections.
 * Vaults already seeded on the backend still resolve, so the rename does not
 * require a data migration.
 *
 * Two of these merge rather than rename: the old split between construction and
 * maintenance collapses into Maintenance & Upgrades, and warranties rejoin the
 * equipment they belong to while insurance moves to the Personal Vault.
 */
const LEGACY_CODE_ALIASES: Record<string, StreamCategoryCode> = {
  "home-profile-deed": "home-profile",
  "construction-improvements": "maintenance-upgrades",
  "maintenance-service": "maintenance-upgrades",
  "systems-appliances": "systems-warranties",
  "warranties-insurance": "systems-warranties",
  "financials-tax": "personal-vault",
};

/**
 * Resolve a raw backend `asset_code` to its section (null if unknown).
 *
 * Matching is most-specific-first: exact code, then legacy alias, then a
 * substring match for codes that carry a prefix or suffix (e.g. a per-vault
 * slug like `4412-maple-home-profile`). Legacy aliases are checked before the
 * substring pass so `home-profile-deed` cannot be caught by `home-profile`
 * with the deed context silently dropped.
 */
export const categoryForAssetCode = (
  assetCode?: string
): StreamCategory | null => {
  if (!assetCode) return null;
  const slug = assetCode.trim().toLowerCase();

  if (slug in STREAM_CATEGORIES) {
    return STREAM_CATEGORIES[slug as StreamCategoryCode];
  }

  const alias = LEGACY_CODE_ALIASES[slug];
  if (alias) return STREAM_CATEGORIES[alias];

  const legacyMatch = Object.keys(LEGACY_CODE_ALIASES).find((code) =>
    slug.includes(code)
  );
  if (legacyMatch) return STREAM_CATEGORIES[LEGACY_CODE_ALIASES[legacyMatch]];

  return (
    ALL_STREAM_CODES.map((code) => STREAM_CATEGORIES[code]).find((category) =>
      slug.includes(category.code)
    ) ?? null
  );
};
