import { RECORD_DOC_TYPES, RecordDocType } from "@/shared/utils/recordNaming";
import {
  Camera,
  FileText,
  Hammer,
  LucideIcon,
  Receipt,
  Ruler,
  Scale,
  ShieldCheck,
} from "lucide-react";

/**
 * The twenty-one document types, grouped into the handful of things people
 * actually ask a vault for.
 *
 * "Show me what we paid" is one question, not six — nobody filters for
 * Invoice, then Receipt, then Estimate, then Statement, then Tax, then
 * Mortgage. The document type stays the precise thing stored in the record's
 * name (`recordNaming.ts`); a facet is the coarser handle the filter bar
 * offers over it.
 *
 * Every type belongs to exactly one facet. `recordFacets.test.ts` asserts the
 * mapping is total, so adding a doc type without placing it here fails the
 * suite rather than silently dropping it out of every filter.
 */

export type FacetCode =
  | "payments"
  | "photos"
  | "plans"
  | "warranties"
  | "legal"
  | "insurance"
  | "reports";

export interface RecordFacet {
  code: FacetCode;
  /** What the filter chip says. */
  label: string;
  icon: LucideIcon;
  types: RecordDocType[];
}

/** Ordered by how often a homeowner reaches for them. */
export const RECORD_FACETS: RecordFacet[] = [
  {
    code: "payments",
    label: "Payments",
    icon: Receipt,
    types: ["Invoice", "Receipt", "Estimate", "Statement", "Tax", "Mortgage"],
  },
  { code: "photos", label: "Photos", icon: Camera, types: ["Photo"] },
  {
    code: "plans",
    label: "Plans & Specs",
    icon: Ruler,
    types: ["Plan", "Spec", "Survey", "Certificate"],
  },
  {
    code: "warranties",
    label: "Warranties",
    icon: ShieldCheck,
    types: ["Warranty", "Manual"],
  },
  {
    code: "legal",
    label: "Legal",
    icon: Scale,
    types: ["Deed", "Permit", "Zoning", "HOA", "Compliance"],
  },
  {
    code: "insurance",
    label: "Insurance",
    icon: FileText,
    types: ["Policy", "Claim"],
  },
  { code: "reports", label: "Reports", icon: Hammer, types: ["Report"] },
];

const FACET_FOR_TYPE = new Map<RecordDocType, RecordFacet>(
  RECORD_FACETS.flatMap((facet) =>
    facet.types.map((type) => [type, facet] as const),
  ),
);

const FACET_FOR_LABEL = new Map(
  RECORD_FACETS.map((facet) => [facet.label.toLowerCase(), facet]),
);

/** The facet a document type falls under, or null for an unrecognised type. */
export const facetForType = (type?: string | null): RecordFacet | null =>
  (type && FACET_FOR_TYPE.get(type as RecordDocType)) || null;

/**
 * The facet for a written label. Case-insensitive because the label is read
 * back out of a description line a person can edit by hand — the same contract
 * `roomForLabel` keeps.
 */
export const facetForLabel = (label?: string | null): RecordFacet | null =>
  (label && FACET_FOR_LABEL.get(label.trim().toLowerCase())) || null;

/** Sorts a set of facets into the reading order declared above. */
export const sortFacets = (facets: RecordFacet[]): RecordFacet[] =>
  [...facets].sort(
    (a, b) =>
      RECORD_FACETS.findIndex((facet) => facet.code === a.code) -
      RECORD_FACETS.findIndex((facet) => facet.code === b.code),
  );

/** Exposed for the coverage test — every doc type must map somewhere. */
export const UNFACETED_DOC_TYPES = RECORD_DOC_TYPES.filter(
  (type) => !FACET_FOR_TYPE.has(type),
);
