import { Attachment } from "@/containers/vaultDetail/types";
import { FacetCode } from "@/shared/constants/recordFacets";
import { Room, RoomCode } from "@/shared/constants/rooms";
import { facetsForRecord, parseRoomTags } from "@/shared/utils/recordTags";

/**
 * Filtering one section's records by what a document is and where the work was.
 *
 * Both axes are read off data the record already carries: the facets from the
 * document type in its name plus the `Contains:` tag line, the rooms from the
 * `Rooms:` line (`recordTags.ts`). Neither costs a request, and neither moves a
 * record out of the section it is filed in.
 *
 * A record can sit under more than one facet — one zip holding an invoice and
 * the photos of the work is both a payment and a photo — so a facet chip counts
 * records that *include* it, and the counts across the row can exceed the
 * number of records on the page.
 *
 * The two axes intersect and the values within one axis union — "payments, in
 * the kitchen or the patio" is one question, and it is the one people ask.
 */

export interface RecordFilter {
  facets: FacetCode[];
  rooms: RoomCode[];
}

export const EMPTY_FILTER: RecordFilter = { facets: [], rooms: [] };

export const isFilterActive = (filter: RecordFilter): boolean =>
  filter.facets.length > 0 || filter.rooms.length > 0;

const matchesFacets = (record: Attachment, facets: FacetCode[]): boolean =>
  facets.length === 0 ||
  facetsForRecord(record).some((code) => facets.includes(code));

const matchesRooms = (record: Attachment, rooms: RoomCode[]): boolean =>
  rooms.length === 0 ||
  parseRoomTags(record.description).some((room) => rooms.includes(room.code));

export const filterRecords = (
  records: Attachment[],
  filter: RecordFilter,
): Attachment[] =>
  !isFilterActive(filter)
    ? records
    : records.filter(
        (record) =>
          matchesFacets(record, filter.facets) &&
          matchesRooms(record, filter.rooms),
      );

export interface FacetOption {
  code: FacetCode;
  count: number;
}

export interface RoomOption {
  room: Room;
  count: number;
}

/**
 * The chips worth offering, and what each would leave behind.
 *
 * Only values actually present are returned, so the bar never offers a filter
 * that empties the page. Counts are measured against the *other* axis' current
 * selection — with "Kitchen" on, the Payments chip says how many kitchen
 * payments there are, not how many payments the section holds. A count that
 * ignored the rest of the filter would be a number the next click disproves.
 */
export const facetOptions = (
  records: Attachment[],
  filter: RecordFilter,
): FacetOption[] => {
  const counts = new Map<FacetCode, number>();

  for (const record of records) {
    if (!matchesRooms(record, filter.rooms)) continue;
    for (const code of facetsForRecord(record)) {
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }

  return [...counts].map(([code, count]) => ({ code, count }));
};

export const roomOptions = (
  records: Attachment[],
  filter: RecordFilter,
): RoomOption[] => {
  const counts = new Map<RoomCode, { room: Room; count: number }>();

  for (const record of records) {
    if (!matchesFacets(record, filter.facets)) continue;
    for (const room of parseRoomTags(record.description)) {
      const seen = counts.get(room.code);
      if (seen) seen.count += 1;
      else counts.set(room.code, { room, count: 1 });
    }
  }

  return [...counts.values()];
};

/** Adds or removes one value, which is all a chip ever does. */
export const toggle = <T>(values: T[], value: T): T[] =>
  values.includes(value)
    ? values.filter((existing) => existing !== value)
    : [...values, value];
