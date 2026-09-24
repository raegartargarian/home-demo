import { RecordFacet } from "@/shared/constants/recordFacets";
import { Room } from "@/shared/constants/rooms";
import { HomeRecordManifest } from "@/shared/types/home";

/**
 * The `home_record.json` the capture form packs in beside the homeowner's
 * files.
 *
 * The description on the API row is what the app reads — it comes back on every
 * list row, so it is what a filter can afford (`recordTags.ts`). This file is
 * the same facts for whoever holds the bundle *without* the app: it travels
 * inside the zip, so it is anchored with the documents it describes and still
 * says what they are once they have been downloaded, forwarded or unpacked
 * somewhere else. Structured, because nobody else should have to parse
 * "Rooms: Kitchen, Patio" back out of a sentence.
 *
 * It is packaging in the same sense the zip is, so it is never a tile on a
 * shelf — see `recordFiles.ts`.
 */

export const RECORD_MANIFEST_FILENAME = "home_record.json";

/** Matched on the bare name, so a manifest inside a folder of a hand-made zip counts. */
export const isRecordManifest = (filename?: string | null): boolean =>
  (filename ?? "").split(/[/\\]/).pop()?.toLowerCase() ===
  RECORD_MANIFEST_FILENAME;

export interface RecordManifestInput {
  project: string;
  docType: string;
  /** ISO date of the work — the form's own `YYYY-MM-DD`. */
  date: string;
  note?: string;
  rooms?: Room[];
  contains?: RecordFacet[];
}

/** Absent rather than empty: `"rooms": []` says someone looked and found none. */
const orUndefined = <T>(values: T[]): T[] | undefined =>
  values.length > 0 ? values : undefined;

export const buildRecordManifest = ({
  project,
  docType,
  date,
  note,
  rooms = [],
  contains = [],
}: RecordManifestInput): HomeRecordManifest => ({
  recordInfo: {
    name: project.trim(),
    docType,
    date,
    rooms: orUndefined(rooms.map((room) => room.label)),
    contains: orUndefined(contains.map((facet) => facet.label)),
  },
  notes: note?.trim() || undefined,
});

/**
 * The manifest as a file for the zip.
 *
 * Nothing in it comes from the clock. The zip has to come out byte-identical
 * for an interrupted upload to resume, and a "created at" in here would make
 * every retry a different archive.
 */
export const recordManifestFile = (input: RecordManifestInput): File =>
  new File(
    [`${JSON.stringify(buildRecordManifest(input), null, 2)}\n`],
    RECORD_MANIFEST_FILENAME,
    { type: "application/json" },
  );
