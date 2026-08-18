/**
 * The document naming convention:
 *
 *   MMDDYY - Type - Reason - Doc Name
 *   100725 - Receipt - New Carpeting - HOME DEPOT carpeting.pdf
 *
 * The convention is implemented as a *projection*, not a rule people follow.
 * Asking a homeowner to hand-type a four-part filename at upload time is asking
 * for four chances to get it wrong, and a vault full of near-misses is not
 * searchable. Every part is already structured data on the record manifest, so
 * the canonical name is derived from the manifest and the file the user picked
 * keeps its original name underneath.
 *
 * (The architecture sketch writes the example date as `10/07/2025`; slashes are
 * illegal in filenames on every platform the app targets, so MMDDYY is taken as
 * the governing form and the example as shorthand.)
 */

import { StreamCategoryCode } from "@/shared/constants/streams";

export const RECORD_DOC_TYPES = [
  // Home Profile
  "Plan",
  "Spec",
  "Certificate",
  "Survey",
  // Maintenance & Upgrades
  "Estimate",
  "Invoice",
  "Receipt",
  "Report",
  "Photo",
  // Systems & Warranties
  "Manual",
  "Warranty",
  // Property Records
  "Deed",
  "Permit",
  "Zoning",
  "HOA",
  "Compliance",
  // Personal Vault
  "Policy",
  "Claim",
  "Statement",
  "Tax",
  "Mortgage",
] as const;

export type RecordDocType = (typeof RECORD_DOC_TYPES)[number];

/**
 * Which document types belong in which section.
 *
 * The list above is already grouped this way in reading order; this makes the
 * grouping data, so the capture form can offer the four or five types that are
 * plausible for the section being filed into rather than all twenty. Types
 * appear in more than one section where they genuinely do (a Survey is both a
 * Home Profile document and a Property Record).
 */
const DOC_TYPES_BY_SECTION: Record<StreamCategoryCode, RecordDocType[]> = {
  "home-profile": ["Plan", "Spec", "Certificate", "Survey"],
  "maintenance-upgrades": ["Estimate", "Invoice", "Receipt", "Report", "Photo"],
  "systems-warranties": ["Manual", "Warranty", "Spec", "Report"],
  "property-records": ["Deed", "Permit", "Zoning", "HOA", "Compliance", "Survey"],
  "personal-vault": ["Policy", "Claim", "Statement", "Tax", "Mortgage"],
};

/** Falls back to every type for a stream outside the five-section template. */
export const docTypesForSection = (
  code?: string
): readonly RecordDocType[] =>
  code && code in DOC_TYPES_BY_SECTION
    ? DOC_TYPES_BY_SECTION[code as StreamCategoryCode]
    : RECORD_DOC_TYPES;

export interface RecordNameParts {
  /** Date the document is *about*, not the upload date. */
  date: Date;
  type: RecordDocType;
  /** Why the document exists: "New Carpeting", "Annual HVAC Service". */
  reason: string;
  /** What the file is: "HOME DEPOT carpeting". Extension excluded. */
  docName: string;
  /** File extension without the dot. Omitted when the name is used as a title. */
  extension?: string;
}

const SEGMENT_SEPARATOR = " - ";

/** Characters no major filesystem accepts, plus the separator itself. */
const ILLEGAL_FILENAME_CHARS = /[/\\:*?"<>|]/g;

/**
 * Makes a free-text value safe to sit inside a separator-delimited name.
 * The spaced hyphen collapses to a plain space so `parseRecordName` can split on
 * the separator without ambiguity — "Repair - Kitchen" would otherwise produce a
 * five-segment name that no longer round-trips.
 */
export const sanitizeSegment = (value: string): string =>
  value
    .replace(ILLEGAL_FILENAME_CHARS, "")
    .replace(/\s+-\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** MMDDYY — 7 October 2025 becomes "100725". */
export const formatRecordDate = (date: Date): string => {
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  const yy = `${date.getFullYear()}`.slice(-2);
  return `${mm}${dd}${yy}`;
};

/** Inverse of `formatRecordDate`. Two-digit years resolve to 2000-2099. */
export const parseRecordDate = (value: string): Date | null => {
  const match = /^(\d{2})(\d{2})(\d{2})$/.exec(value);
  if (!match) return null;

  const [, mm, dd, yy] = match;
  const month = Number(mm);
  const day = Number(dd);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(2000 + Number(yy), month - 1, day);
  // Rejects overflow like 023125 (31 February), which Date would roll forward.
  return date.getMonth() === month - 1 && date.getDate() === day ? date : null;
};

/** Builds the canonical filename from structured parts. */
export const buildRecordName = (parts: RecordNameParts): string => {
  const stem = [
    formatRecordDate(parts.date),
    sanitizeSegment(parts.type),
    sanitizeSegment(parts.reason),
    sanitizeSegment(parts.docName),
  ].join(SEGMENT_SEPARATOR);

  return parts.extension ? `${stem}.${parts.extension}` : stem;
};

/**
 * Reads a canonical name back into parts, or null if it does not follow the
 * convention — which is the expected answer for the many files that were named
 * by hand before the vault existed.
 */
export const parseRecordName = (filename: string): RecordNameParts | null => {
  const lastDot = filename.lastIndexOf(".");
  const hasExtension = lastDot > 0 && lastDot < filename.length - 1;
  const stem = hasExtension ? filename.slice(0, lastDot) : filename;
  const extension = hasExtension ? filename.slice(lastDot + 1) : undefined;

  const segments = stem.split(SEGMENT_SEPARATOR);
  if (segments.length < 4) return null;

  const date = parseRecordDate(segments[0].trim());
  if (!date) return null;

  const type = segments[1].trim() as RecordDocType;
  if (!RECORD_DOC_TYPES.includes(type)) return null;

  return {
    date,
    type,
    reason: segments[2].trim(),
    // Any surplus separators belong to the document name, not the convention.
    docName: segments.slice(3).join(SEGMENT_SEPARATOR).trim(),
    extension,
  };
};
