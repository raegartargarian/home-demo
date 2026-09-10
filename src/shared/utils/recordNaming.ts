/**
 * The document naming convention:
 *
 *   MM-DD-YY - Type - Reason - Doc Name
 *   10-07-25 - Receipt - New Carpeting - HOME DEPOT carpeting.pdf
 *
 * The convention is implemented as a *projection*, not a rule people follow.
 * Asking a homeowner to hand-type a four-part filename at upload time is asking
 * for four chances to get it wrong, and a vault full of near-misses is not
 * searchable. Every part is already structured data on the capture form, so the
 * name is composed from those fields rather than typed.
 *
 * The projection reaches the files too, not just the record. The first three
 * segments describe the upload and so are shared; each file supplies the last
 * one, seeded from the name it arrived with. A record filed without touching
 * that field still comes out named — which is the point, because the review
 * that prompted this found every file inside a record still called
 * `screenshot1241.png`.
 *
 * (The architecture sketch writes the example date as `10/07/2025`. Slashes are
 * illegal in filenames on every platform the app targets, so the separator is a
 * hyphen; the date is otherwise read exactly as written. An unpunctuated
 * `100725` is six digits a reader has to decode, and the first review of the
 * built form said so — `parseRecordDate` still accepts that older form, because
 * files named under it are already filed.)
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
  // The escape hatch, offered last in every section. A homeowner holding
  // something the list does not name should still be able to file it, rather
  // than picking the nearest wrong type and making it unfindable.
  "Other",
] as const;

export type RecordDocType = (typeof RECORD_DOC_TYPES)[number];

/** Always offered, always last. Not one of a section's own types. */
export const OTHER_DOC_TYPE: RecordDocType = "Other";

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
  "property-records": [
    "Deed",
    "Permit",
    "Zoning",
    "HOA",
    "Compliance",
    "Survey",
  ],
  "personal-vault": ["Policy", "Claim", "Statement", "Tax", "Mortgage"],
};

/**
 * The types a section offers, with `Other` appended.
 *
 * Falls back to every type for a stream outside the five-section template.
 * `Other` is added here rather than written into each of the five lists so
 * there is one place it can be removed from, and so it cannot drift out of
 * last position in one section.
 */
export const docTypesForSection = (code?: string): readonly RecordDocType[] => {
  const own =
    code && code in DOC_TYPES_BY_SECTION
      ? DOC_TYPES_BY_SECTION[code as StreamCategoryCode]
      : RECORD_DOC_TYPES;

  return own.includes(OTHER_DOC_TYPE) ? own : [...own, OTHER_DOC_TYPE];
};

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

/** "Hill Country final invoice.pdf" → "Hill Country final invoice". */
export const stripExtension = (filename: string): string =>
  filename.replace(/\.[^./\\]+$/, "");

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

/** MM-DD-YY — 7 October 2025 becomes "10-07-25". */
export const formatRecordDate = (date: Date): string => {
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  const yy = `${date.getFullYear()}`.slice(-2);
  return `${mm}-${dd}-${yy}`;
};

/**
 * Which century a two-digit year belongs to.
 *
 * A house outlives the convention that names its paperwork. This app's own
 * worked example opens with an original construction set from 1998, and reading
 * `98` as 2098 filed the oldest documents in the vault seventy years into the
 * future — at the top of every timeline, under a heading no reader could make
 * sense of.
 *
 * So the window slides: a two-digit year lands in the most recent century that
 * does not put the document in the future. One year of slack, because a permit
 * dated slightly ahead is ordinary and a document dated eighty years ahead is
 * not.
 */
const resolveYear = (yy: number, now = new Date()): number => {
  const thisCentury = 2000 + yy;
  return thisCentury > now.getFullYear() + 1 ? 1900 + yy : thisCentury;
};

/**
 * Inverse of `formatRecordDate`.
 *
 * Accepts the unpunctuated `MMDDYY` the convention used first, so a vault
 * filed before the hyphen went in still reads back — the whole point of
 * parsing the name is that old files stay browsable, and a reader that only
 * understood the newer form would quietly drop every one of them into
 * "Unfiled".
 */
export const parseRecordDate = (value: string): Date | null => {
  const match = /^(\d{2})-?(\d{2})-?(\d{2})$/.exec(value);
  if (!match) return null;

  const [, mm, dd, yy] = match;
  const month = Number(mm);
  const day = Number(dd);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(resolveYear(Number(yy)), month - 1, day);
  // Rejects overflow like 02-31-25 (31 February), which Date would roll forward.
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
 * Salvages a Document segment that is itself a collapsed canonical name.
 *
 * Records filed before `documentNameFrom` existed carry the whole of their
 * previous name in the Document slot, separators flattened to spaces:
 *
 *   08-26-26 - Other - Kitchen - 053125 Photo Garden Landscaping Fire pit at dusk
 *                                └──────────── one segment ─────────────────────┘
 *
 * The stored name cannot be repaired — the platform sets an attachment's name
 * at creation and exposes no way to change it — so the only thing left is to
 * read it better. The leading date and type are recoverable exactly: the date
 * has to parse as one, and the word after it has to be a document type this
 * app knows. Both must hold, which is what keeps a real document called
 * "010125 Photo album" from being trimmed to "album".
 *
 * What cannot be recovered is where the old project ended and its document name
 * began — "Garden Landscaping Fire pit at dusk" has no separator left to split
 * on. So the salvage stops there and returns the pair, which is at least two
 * true things about the file rather than six digits and a type the row already
 * shows.
 */
export const readableDocName = (docName: string): string => {
  const match = /^(\d{2}-?\d{2}-?\d{2})\s+(\S+)\s+(.+)$/.exec(docName.trim());
  if (!match) return docName;

  const [, date, type, rest] = match;
  if (!parseRecordDate(date)) return docName;
  if (!RECORD_DOC_TYPES.includes(type as RecordDocType)) return docName;

  return rest;
};

/**
 * Words that are how a device names a file, not what the file is.
 *
 * Kept deliberately tight. A token only belongs here if it says something about
 * the *camera or app* that produced the file — never something about the
 * document. "Final", "new" and "photo" are all things a person might genuinely
 * call a document, so none of them are listed.
 */
const DEVICE_TOKENS = new Set([
  "img",
  "image",
  "images",
  "imgs",
  "dsc",
  "dscn",
  "dcim",
  "pxl",
  "mvimg",
  "gopro",
  "burst",
  "screenshot",
  "screenshots",
  "screen",
  "capture",
  "scan",
  "scanned",
  "scanner",
  "untitled",
  "unnamed",
  "download",
  "downloads",
  "downloaded",
  "copy",
  "whatsapp",
  "messenger",
  "snapchat",
  "facebook",
  "file",
  "doc",
  "docs",
  "attachment",
  "unknown",
  "temp",
  "tmp",
]);

/**
 * Whether a filename says anything a reader could use.
 *
 * `779842473_1597057791975426_6463832288154644721_n`, `IMG_0042` and
 * `screenshot1241` are all names a device chose. Folding one of those into the
 * convention produces `08-26-26 - Plan - Living Room - IMG_0042` — formally
 * filed, and no more findable than it was before, which is the complaint the
 * convention exists to answer. So the capture form leaves the Document field
 * empty for these and asks, rather than pre-filling nonsense that a hurried
 * person will accept.
 *
 * Two tests, and both have to pass. A word has to survive: split on everything
 * that is not a letter, drop anything shorter than three characters (`n`, `of`,
 * `v2`) and anything a device would have put there. One real word is enough —
 * "invoice" is a perfectly good document name. And unless a person clearly
 * typed it, no token may look generated, because a real word standing next to a
 * key does not redeem it. See `looksGenerated`.
 */
/**
 * A token a machine chose: a hash, an id, or a key.
 *
 * The word test below is not enough on its own, because plenty of generated
 * names carry real words around the generated part —
 * `content-credentials-pfau-43-CzJwG5YE` and `ai-escrow-C6F-xlmL` both read as
 * meaningful to it, and land in the Document slot as
 * `08-26-26 - Photo - Kitchen - ai-escrow-C6F-xlmL`: the complaint the
 * convention exists to answer, filed neatly.
 *
 * Three shapes: a long hex run (`689b37ee6ea3b020`), a long digit run
 * (`779842473`), and any token carrying both letters and digits (`C6F`,
 * `CzJwG5YE`). The last one is broad on purpose. An earlier, narrower version
 * asked for six characters and three case changes, which caught `CzJwG5YE` and
 * walked straight past `C6F` — and the point of the rule is that a person
 * looking at their own vault should never meet a token like either.
 */
const looksGenerated = (token: string): boolean =>
  /^[0-9a-f]{12,}$/i.test(token) ||
  /^\d{9,}$/.test(token) ||
  (/[a-zA-Z]/.test(token) && /\d/.test(token));

export const isMeaningfulFilename = (filename: string): boolean => {
  const stem = stripExtension(filename);

  // A space is the tell. Someone naming a file reaches for the space bar and a
  // machine almost never does, so `Roof invoice 2026Q3` keeps its digits where
  // `ai-escrow-C6F-xlmL` loses everything. It is the one signal here that
  // separates a person from a generator without guessing at what the words say.
  const typedByHand = /\s/.test(stem);
  if (!typedByHand && stem.split(/[^a-zA-Z0-9]+/).some(looksGenerated)) {
    return false;
  }

  return stem
    .split(/[^a-zA-Z]+/)
    .some((word) => word.length >= 3 && !DEVICE_TOKENS.has(word.toLowerCase()));
};

/**
 * What to put in a Document field for a file that was just picked.
 *
 * A file dropped into the capture form has often been through here before —
 * re-filed from a previous export, or picked out of the examples folder — and
 * already carries the convention. Seeding the field with its whole stem then
 * applies the convention a second time: the old name lands in the Document
 * slot, and `sanitizeSegment` flattens its separators to spaces on the way in,
 * because a segment containing " - " would not round-trip. The result reads
 * `05-03-25 - Photo - Garden Landscaping - 050325 Photo Garden Landscaping New
 * turf and fence installed` — formally correct, and useless to a reader.
 *
 * So a name that already parses contributes only its own Document segment.
 * Anything else keeps its stem — unless the stem is a device's own naming, in
 * which case there is nothing worth carrying over and the field is left empty
 * for a person to fill. See `isMeaningfulFilename`.
 */
export const documentNameFrom = (filename: string): string => {
  const parsed = parseRecordName(filename);
  if (parsed) return parsed.docName;

  return isMeaningfulFilename(filename) ? stripExtension(filename) : "";
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
