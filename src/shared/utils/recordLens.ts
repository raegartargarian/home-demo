import { parseRecordName, RecordDocType } from "./recordNaming";

/**
 * What a record's *name* says about it, and how a set of them groups.
 *
 * A record is stored in one of the five sections — that is a transfer fact, not
 * a display choice (see `constants/streams.ts`). Everything here is derived
 * from `MMDDYY - Type - Reason - Doc Name` via `parseRecordName`, so reading it
 * costs no extra requests, and a record whose name predates the convention
 * still appears — dated by `created_at` and titled by its raw name. This
 * degrades; it never hides.
 */

/** The part of an attachment a lens reads. Structural, so both the vault-wide
 *  list and the per-stream list satisfy it without a shared DTO. */
export interface LensRecord {
  id: string;
  name?: string;
  created_at?: string;
  stream_id?: string;
  /** Embedded by the vault-wide endpoint; absent on the per-stream list. */
  stream?: { asset_code?: string };
}

export interface RecordMeta {
  /** The date the record is *about*, falling back to when it was filed. */
  date: Date | null;
  /** Document type, when the name follows the convention. */
  type: RecordDocType | null;
  /** The project/event the record belongs to. Null for a legacy name. */
  project: string | null;
  /** What to show in a list. */
  title: string;
  /** Whether the name parsed — drives the "Unfiled" grouping. */
  isCanonical: boolean;
}

/**
 * One record's browsing metadata. Never null: an unparseable name still yields
 * a date and a title, which is what keeps legacy records visible.
 */
export const recordMeta = (record: LensRecord): RecordMeta => {
  const named = record.name ? parseRecordName(record.name) : null;
  const filedAt = record.created_at ? new Date(record.created_at) : null;

  return {
    date: named?.date ?? filedAt,
    type: named?.type ?? null,
    project: named?.reason ?? null,
    title: named?.reason ?? record.name ?? "Home Record",
    isCanonical: named !== null,
  };
};

const time = (date: Date | null) => date?.getTime() ?? -Infinity;

/** Newest first. Undated records sort last rather than disappearing. */
const byDateDesc = (a: LensRecord, b: LensRecord) =>
  time(recordMeta(b).date) - time(recordMeta(a).date);

export interface YearGroup<T extends LensRecord> {
  /** Null for records with neither a parsed date nor a `created_at`. */
  year: number | null;
  records: T[];
}

/** Records by year, newest first — how a section lists its own history. */
export const groupByYear = <T extends LensRecord>(
  records: T[]
): YearGroup<T>[] => {
  const groups = new Map<number | null, T[]>();

  for (const record of [...records].sort(byDateDesc)) {
    const year = recordMeta(record).date?.getFullYear() ?? null;
    const existing = groups.get(year);
    if (existing) existing.push(record);
    else groups.set(year, [record]);
  }

  return [...groups].map(([year, grouped]) => ({ year, records: grouped }));
};
