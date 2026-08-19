/**
 * The rooms a record can be tagged with.
 *
 * A closed vocabulary, deliberately. Rooms are stored as tags on the record
 * (see `utils/recordTags.ts`) and they are what the section filter chips are
 * built from, so two spellings of one room are two chips and half the records
 * hide behind the wrong one. The free-text `project` field already carries that
 * risk — "Kitchen Remodel" and "kitchen remodel" read as two different jobs —
 * and it is not worth repeating on an axis whose whole job is filtering.
 *
 * Rooms are tags, never the hierarchy: a record lives in one of the five
 * sections (`constants/streams.ts`), and tagging it "Kitchen" does not move it.
 * See the note on `HomeRecordManifest` in `types/home.ts`.
 *
 * The list covers the spaces a homeowner files work against. It is not a
 * floor plan — "Bedroom" is one entry, not four, because a filter with four
 * near-identical chips is worse than one that groups them.
 */

export type RoomCode =
  | "kitchen"
  | "bathroom"
  | "bedroom"
  | "living-room"
  | "dining-room"
  | "garage"
  | "basement"
  | "attic"
  | "utility"
  | "patio"
  | "garden"
  | "roof"
  | "exterior"
  | "whole-home";

export interface Room {
  code: RoomCode;
  /** What the chip says, and what is written into the record's tag line. */
  label: string;
}

/** Reading order: inside first, roughly front to back, then outside. */
export const ROOMS: Room[] = [
  { code: "kitchen", label: "Kitchen" },
  { code: "bathroom", label: "Bathroom" },
  { code: "bedroom", label: "Bedroom" },
  { code: "living-room", label: "Living Room" },
  { code: "dining-room", label: "Dining Room" },
  { code: "utility", label: "Utility" },
  { code: "basement", label: "Basement" },
  { code: "attic", label: "Attic" },
  { code: "garage", label: "Garage" },
  { code: "patio", label: "Patio" },
  { code: "garden", label: "Garden" },
  { code: "roof", label: "Roof" },
  { code: "exterior", label: "Exterior" },
  { code: "whole-home", label: "Whole Home" },
];

const BY_CODE = new Map(ROOMS.map((room) => [room.code, room]));
const BY_LABEL = new Map(ROOMS.map((room) => [room.label.toLowerCase(), room]));

/** The room for a code, or null — an unknown code is ignored, never guessed. */
export const roomForCode = (code?: string): Room | null =>
  (code && BY_CODE.get(code as RoomCode)) || null;

/**
 * The room for a written label. Case-insensitive because the label is read back
 * out of a description line that a person can edit by hand.
 */
export const roomForLabel = (label?: string): Room | null =>
  (label && BY_LABEL.get(label.trim().toLowerCase())) || null;

/** Sorts a set of rooms into the canonical reading order above. */
export const sortRooms = (rooms: Room[]): Room[] =>
  [...rooms].sort(
    (a, b) =>
      ROOMS.findIndex((room) => room.code === a.code) -
      ROOMS.findIndex((room) => room.code === b.code),
  );
