import { parseRecordName, RecordDocType } from "./recordNaming";

/**
 * The browsing lenses.
 *
 * A record is *stored* in one of the five sections — that is a transfer fact, not
 * a display choice (see `constants/streams.ts`). But a homeowner arrives with a
 * question ("when was the roof done?"), and the answer is scattered across four
 * sections by design. These functions regroup the same records along the axes
 * people actually ask about, without moving or duplicating any of them.
 *
 * Everything here is derived from `MMDDYY - Type - Reason - Doc Name` via
 * `parseRecordName`, so a lens costs no extra requests. A record whose name
 * predates the convention still appears — dated by `created_at` and collected
 * under "Unfiled". A lens degrades; it never hides.
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

/** The Timeline lens: the house's biography, newest year first. */
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

/** Oldest and newest dated record in a set — a project's span. */
export const spanOf = <T extends LensRecord>(
  records: T[]
): { from: Date | null; to: Date | null } => {
  const dates = records
    .map((record) => recordMeta(record).date)
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  return { from: dates[0] ?? null, to: dates[dates.length - 1] ?? null };
};

export interface ProjectGroup<T extends LensRecord> {
  /** Null is the "Unfiled" bucket — names that predate the convention. */
  project: string | null;
  records: T[];
  /** Span of the project, oldest to newest. Null when nothing is dated. */
  from: Date | null;
  to: Date | null;
  /** Asset codes of every section the project draws from, in first-seen order. */
  assetCodes: string[];
}

/**
 * The Projects lens: one event ("Kitchen Remodel") assembled from however many
 * sections it touches. Ordered by most recent activity, with Unfiled last.
 */
export const groupByProject = <T extends LensRecord>(
  records: T[]
): ProjectGroup<T>[] => {
  const groups = new Map<string | null, T[]>();

  for (const record of [...records].sort(byDateDesc)) {
    const { project } = recordMeta(record);
    const existing = groups.get(project);
    if (existing) existing.push(record);
    else groups.set(project, [record]);
  }

  const summarised = [...groups].map(([project, grouped]) => {
    const { from, to } = spanOf(grouped);

    return {
      project,
      records: grouped,
      from,
      to,
      assetCodes: [
        ...new Set(
          grouped
            .map((record) => record.stream?.asset_code)
            .filter((code): code is string => !!code)
        ),
      ],
    };
  });

  // Unfiled is a leftovers bucket, not a project — it sorts last however recent
  // its contents are.
  return summarised.sort((a, b) => {
    if (a.project === null) return 1;
    if (b.project === null) return -1;
    return time(b.to) - time(a.to);
  });
};

/** Finds one project's records again after a page reload or a deep link. */
export const recordsInProject = <T extends LensRecord>(
  records: T[],
  project: string
): T[] =>
  [...records]
    .filter((record) => recordMeta(record).project === project)
    .sort(byDateDesc);
