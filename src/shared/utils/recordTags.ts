import {
  FacetCode,
  facetForLabel,
  facetForType,
  RecordFacet,
  sortFacets,
} from "@/shared/constants/recordFacets";
import { Room, roomForLabel, sortRooms } from "@/shared/constants/rooms";
import { parseRecordName } from "./recordNaming";

/**
 * Everything a record's `description` carries besides the homeowner's note, and
 * how to read it back.
 *
 * Why there: the backend stores no metadata. `AddDataAttachmentRequest` accepts
 * `name`, `description`, `stream_id`, `ledger`, `filename`, `upload_as_zip` and
 * a `config` that holds one boolean — there is no tags field and no JSON blob.
 * A `home_record.json` inside the record zip is opaque bytes to the API, so
 * reading it costs a download per record: fine for a detail view, useless for
 * filtering a list. `description` is the only free-form field that comes back
 * on every row of `/streams/{code}/attachments`, so that is where anything
 * filterable has to live.
 *
 * Why sentences and not JSON: a record's description reaches a person in
 * exactly one place today — the exported proof PDF
 * (`generateVaultProofPdf.ts`), which prints it verbatim. "Rooms: Kitchen,
 * Patio" reads as prose there. The vault's description is already overloaded
 * with JSON by `homeFacts.ts`, and that same PDF prints *it* raw, which is the
 * mistake this format exists to avoid.
 *
 * Tag lines are appended after the homeowner's own note, always last, so
 * `stripTagLines` can hand the note back unchanged for display or editing.
 */

/**
 * Every prefix the format defines. `stripTagLines` works from this list rather
 * than from a "any Word:" pattern, so a note that happens to start a line with
 * "Note:" survives being stored and read back.
 */
export const TAG_PREFIXES = ["Rooms", "Contains"] as const;
export type TagPrefix = (typeof TAG_PREFIXES)[number];

/** Matches one tag line anywhere in the description, on its own line. */
const tagLine = (prefix: TagPrefix) =>
  new RegExp(`^${prefix}:[ \\t]*(.*)$`, "m");

/** Renders one line. Empty for no values — a bare `Rooms:` would be noise. */
const formatTagLine = (prefix: TagPrefix, labels: string[]): string =>
  labels.length > 0 ? `${prefix}: ${labels.join(", ")}` : "";

/**
 * The raw labels on one line, in written order. Left unresolved on purpose:
 * each vocabulary decides what a label means, and what to do with one it does
 * not recognise.
 */
const parseTagLine = (
  prefix: TagPrefix,
  description?: string | null,
): string[] => {
  const line = description ? tagLine(prefix).exec(description) : null;
  if (!line) return [];
  return line[1]
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
};

/**
 * The homeowner's own note, without any tag line — what an edit form should
 * show, and what a reader should see where the tags are rendered as chips.
 */
export const stripTagLines = (description?: string | null): string =>
  TAG_PREFIXES.reduce(
    (text, prefix) => text.replace(tagLine(prefix), ""),
    description ?? "",
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * Puts a note and its tags back together for storage. Kept here so the
 * separator between note and tags is defined once, next to the parser that has
 * to survive it. Re-storing an already-tagged note replaces its lines rather
 * than stacking a second copy.
 */
export const withRecordTags = (
  note: string | undefined,
  tags: { rooms?: Room[]; contains?: RecordFacet[] },
): string | undefined => {
  const body = stripTagLines(note);
  const lines = [
    formatRoomTags(tags.rooms ?? []),
    formatContainsTags(tags.contains ?? []),
  ].filter(Boolean);

  if (lines.length === 0) return body || undefined;
  const suffix = lines.join("\n");
  return body ? `${body}\n\n${suffix}` : suffix;
};

// -- rooms -------------------------------------------------------------------

export const formatRoomTags = (rooms: Room[]): string =>
  formatTagLine(
    "Rooms",
    sortRooms(rooms).map((room) => room.label),
  );

/**
 * Reads the rooms back out. Unknown names are dropped rather than guessed at,
 * for the same reason `parseRecordName` returns null on a name it does not
 * recognise: a tag nobody can filter by is worse than no tag.
 */
export const parseRoomTags = (description?: string | null): Room[] => {
  const rooms = parseTagLine("Rooms", description)
    .map((name) => roomForLabel(name))
    .filter((room): room is Room => room !== null);

  // De-duplicated: "Kitchen, Kitchen" is one chip, not two.
  return sortRooms([
    ...new Map(rooms.map((room) => [room.code, room])).values(),
  ]);
};

// -- contents ----------------------------------------------------------------

export const formatContainsTags = (facets: RecordFacet[]): string =>
  formatTagLine(
    "Contains",
    sortFacets(facets).map((facet) => facet.label),
  );

/** The same read-back rule as rooms: an unrecognised label is dropped. */
export const parseContainsTags = (
  description?: string | null,
): RecordFacet[] => {
  const facets = parseTagLine("Contains", description)
    .map((label) => facetForLabel(label))
    .filter((facet): facet is RecordFacet => facet !== null);

  return sortFacets([
    ...new Map(facets.map((facet) => [facet.code, facet])).values(),
  ]);
};

/**
 * Everything a record can be found under, not just what it is *called*.
 *
 * A record carries one document type, because its name has one Type segment —
 * but one upload is one zip, and a zip holding the contractor's invoice *and*
 * the photos of the finished work genuinely belongs under both Payments and
 * Photos. The name settles what the record is; these tags add what else is
 * inside it, and the filter bar unions the two.
 *
 * The typed facet always leads, so a record's primary identity stays first
 * wherever this is rendered in order.
 */
export const facetsForRecord = (record: {
  name?: string;
  description?: string | null;
}): FacetCode[] => {
  const named = record.name ? parseRecordName(record.name) : null;
  const typed = facetForType(named?.type);
  const also = parseContainsTags(record.description).filter(
    (facet) => facet.code !== typed?.code,
  );

  return [...(typed ? [typed.code] : []), ...also.map((facet) => facet.code)];
};
