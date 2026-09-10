import {
  ClipboardList,
  Cpu,
  Hammer,
  Home,
  Landmark,
  Leaf,
  Lock,
  LucideIcon,
  Package,
  Ruler,
  Sparkles,
  Wrench,
} from "lucide-react";

/**
 * The Filedgr House Template — five-section architecture.
 *
 * Source of truth: the "Initial Demo Structure" column of the demo/product
 * structure sketch — its five section names and their example contents are
 * reproduced verbatim below. The taxonomy is fixed at five streams and does not
 * grow;
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

/**
 * The six spare accent slots a named section can take.
 *
 * The five sections are the taxonomy and do not grow. A section someone typed
 * themselves is not part of it, but it still has to look like something, so it
 * borrows one of these. They are declared in `main.scss` beside the five, and
 * a section is assigned one from its own slug, so the same name always comes
 * back the same colour — on the card, in the sidebar and on the page at once.
 */
export type CustomAccentCode =
  | "custom-1"
  | "custom-2"
  | "custom-3"
  | "custom-4"
  | "custom-5"
  | "custom-6";

/** What `data-category` may be set to: one of the five, or a spare slot. */
export type SectionAccent = StreamCategoryCode | CustomAccentCode;

export interface StreamCategory {
  code: SectionAccent;
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
  /** True for a section someone named, false for the five. */
  isCustom?: boolean;
}

export const STREAM_CATEGORIES: Record<StreamCategoryCode, StreamCategory> = {
  "home-profile": {
    code: "home-profile",
    label: "Home Profile",
    description: "The original identity of the home.",
    icon: Home,
    order: 1,
    contents: ["Original plans", "Builder documents", "Materials", "Surveys"],
    transfersOnSale: true,
  },
  "maintenance-upgrades": {
    code: "maintenance-upgrades",
    label: "Maintenance and Upgrades",
    description: "Captures events and projects done on the property.",
    icon: Wrench,
    order: 2,
    contents: ["Repairs", "Renovations", "Receipts"],
    transfersOnSale: true,
  },
  "systems-warranties": {
    code: "systems-warranties",
    label: "Home Systems and Appliances",
    description: "Information relating to installed equipment.",
    icon: Cpu,
    order: 3,
    contents: [
      "HVAC",
      "Appliances",
      "Solar",
      "Manuals",
      "Warranties",
      "Security System",
    ],
    transfersOnSale: true,
  },
  "property-records": {
    code: "property-records",
    label: "Property Records",
    description: "Legal and operational property information.",
    icon: Landmark,
    order: 4,
    contents: ["HOA", "Deeds", "Zoning", "Permits", "Surveys", "Compliance"],
    transfersOnSale: true,
  },
  "personal-vault": {
    code: "personal-vault",
    label: "My Personal Home Info",
    description: "Information belonging only to the current homeowner.",
    icon: Lock,
    order: 5,
    contents: ["Mortgage", "Insurance", "Taxes", "Personal documents"],
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
/**
 * Sort key for the five sections, in the taxonomy's own reading order. A stream
 * outside the template sorts last, so it is still reachable rather than hidden.
 */
export const categoryOrder = (category: StreamCategory | null): number =>
  category?.order ?? Number.MAX_SAFE_INTEGER;

export const categoryForAssetCode = (
  assetCode?: string,
): StreamCategory | null => {
  if (!assetCode) return null;
  const slug = assetCode.trim().toLowerCase();

  if (slug in STREAM_CATEGORIES) {
    return STREAM_CATEGORIES[slug as StreamCategoryCode];
  }

  const alias = LEGACY_CODE_ALIASES[slug];
  if (alias) return STREAM_CATEGORIES[alias];

  const legacyMatch = Object.keys(LEGACY_CODE_ALIASES).find((code) =>
    slug.includes(code),
  );
  if (legacyMatch) return STREAM_CATEGORIES[LEGACY_CODE_ALIASES[legacyMatch]];

  return (
    ALL_STREAM_CODES.map((code) => STREAM_CATEGORIES[code]).find((category) =>
      slug.includes(category.code),
    ) ?? null
  );
};

/**
 * A typed section name, in the shape the backend wants for a stream.
 *
 * A template's `required_streams` is an unvalidated list of strings, and each
 * one is copied verbatim into its stream's `mapping` — which is the field this
 * app reads back to decide what a section is. So the format is ours to choose,
 * and the one worth choosing is the one the five already use: lowercase,
 * hyphenated, nothing else. Lowercase in particular is not cosmetic; one
 * backend path lowercases these strings before matching and another does not,
 * so sending anything else invites the two to disagree.
 *
 * Returns "" for a name with nothing usable in it, which callers treat as
 * "not a section" rather than creating a stream with an empty mapping.
 */
export const SECTION_SLUG_MAX_LENGTH = 48;

export const toSectionSlug = (name: string): string =>
  name
    .toLowerCase()
    .normalize("NFKD")
    // Strip accents, so "Dépôt" and "Depot" do not become two sections.
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SECTION_SLUG_MAX_LENGTH)
    .replace(/-+$/, "");

/**
 * The five, indexed by their own display names in slug form.
 *
 * `categoryForAssetCode` matches slugs against the taxonomy's *codes*, and
 * three of the five have a label that does not slugify onto its code —
 * "Maintenance and Upgrades" is `maintenance-upgrades`, "Home Systems and
 * Appliances" is `systems-warranties`, "My Personal Home Info" is
 * `personal-vault`. So somebody typing a section's name exactly as the app
 * shows it would otherwise get a second, nearly identical section of their own
 * beside the real one.
 */
const BY_LABEL_SLUG = new Map<string, StreamCategoryCode>(
  (Object.keys(STREAM_CATEGORIES) as StreamCategoryCode[]).map((code) => [
    toSectionSlug(STREAM_CATEGORIES[code].label),
    code,
  ]),
);

/**
 * What a typed section name means: one of the five, or nothing.
 *
 * Checked before a name is accepted as new, so typing what is already on the
 * form ticks that section rather than duplicating it.
 */
export const knownSectionForTypedName = (
  name: string,
): StreamCategory | null => {
  const slug = toSectionSlug(name);
  if (!slug) return null;

  const byLabel = BY_LABEL_SLUG.get(slug);
  if (byLabel) return STREAM_CATEGORIES[byLabel];

  return categoryForAssetCode(slug);
};

const CUSTOM_ACCENTS: CustomAccentCode[] = [
  "custom-1",
  "custom-2",
  "custom-3",
  "custom-4",
  "custom-5",
  "custom-6",
];

/**
 * Icons for named sections. Generic on purpose: they say "a section" without
 * claiming to know what is in it, which a wrong specific glyph would.
 */
const CUSTOM_ICONS: LucideIcon[] = [
  ClipboardList,
  Hammer,
  Package,
  Ruler,
  Sparkles,
  Leaf,
];

/**
 * Stable, not random. The colour and glyph are picked from the slug's own
 * characters, so a section keeps the same look everywhere it appears and
 * across reloads — a genuinely random pick would have the sidebar and the card
 * disagreeing about the same section on the same screen.
 */
const hashSlug = (slug: string): number => {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return hash;
};

/** Title Case for display, from a slug. */
const titleCase = (slug: string): string =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * The look of a section that is not one of the five.
 *
 * Shaped like a real category so every component that already draws a section
 * can draw this one without a branch. It sorts last, and it carries `isCustom`
 * for the two places that genuinely need to know the difference.
 */
export const customCategoryFor = (slug: string): StreamCategory => {
  const hash = hashSlug(slug);
  return {
    code: CUSTOM_ACCENTS[hash % CUSTOM_ACCENTS.length],
    label: titleCase(slug),
    // Empty rather than filler. The five describe what belongs in them, which
    // is the taxonomy talking; a section someone named describes itself by its
    // name, and "a section added to this vault" underneath it says nothing
    // twice. Empty also beats falling through to the stream's own description,
    // which the backend writes as "The stream mapped to the <slug> field".
    description: "",
    icon: CUSTOM_ICONS[hash % CUSTOM_ICONS.length],
    // Behind all five, so the taxonomy still reads in its own order first.
    order: Number.MAX_SAFE_INTEGER,
    contents: [],
    // Only the Personal Vault is detached at sale, and that is a property of
    // that one stream rather than something a typed section can opt into.
    transfersOnSale: true,
    isCustom: true,
  };
};

/**
 * The category behind an accent code, or null when the code is a spare slot.
 * The one place that turns a `data-category` value back into a section, so the
 * runtime check and the cast live together instead of at every call site.
 */
export const knownSectionFor = (
  code?: SectionAccent | null,
): StreamCategory | null =>
  code && code in STREAM_CATEGORIES
    ? STREAM_CATEGORIES[code as StreamCategoryCode]
    : null;

/** Narrows to the five, for the places that index by the taxonomy's own codes. */
export const isKnownSection = (
  category: StreamCategory | null | undefined,
): category is StreamCategory & { code: StreamCategoryCode } =>
  !!category && !category.isCustom;
