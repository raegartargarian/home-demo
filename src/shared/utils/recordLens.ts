import { parseRecordName, RecordDocType } from "./recordNaming";

/**
 * What a record's *name* says about it, and how a set of them groups.
 *
 * A record is stored in one of the five sections — that is a transfer fact, not
 * a display choice (see `constants/streams.ts`). Everything here is derived
 * from `MM-DD-YY - Type - Reason - Doc Name` via `parseRecordName`, so reading it
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

export type Granularity = "year" | "month" | "day";

export interface PeriodGroup<T extends LensRecord> {
  /** Stable key for React, and the sort order. Null for undated records. */
  key: string | null;
  /** "2026", "August 2026", "August 18, 2026". */
  label: string;
  records: T[];
}

const YEAR = new Intl.DateTimeFormat("en-US", { year: "numeric" });
const MONTH = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const DAY = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

/**
 * How finely a set of records is worth splitting.
 *
 * A heading earns its place by telling the reader something the next heading
 * does not. A section whose records all landed this year, grouped by year, is
 * one heading over everything — it says nothing, and it costs a row. The rule
 * is simply to go one step finer than the coarsest axis that would collapse:
 * several years, group by year; one year, group by month; one month, by day.
 */
export const granularityFor = <T extends LensRecord>(
  records: T[]
): Granularity => {
  const dates = records
    .map((record) => recordMeta(record).date)
    .filter((date): date is Date => date !== null);

  const years = new Set(dates.map((date) => date.getFullYear()));
  if (years.size > 1) return "year";

  const months = new Set(
    dates.map((date) => `${date.getFullYear()}-${date.getMonth()}`)
  );
  return months.size > 1 ? "month" : "day";
};

const periodKey = (date: Date, granularity: Granularity): string => {
  const year = date.getFullYear();
  if (granularity === "year") return `${year}`;
  const month = `${date.getMonth()}`.padStart(2, "0");
  return granularity === "month"
    ? `${year}-${month}`
    : `${year}-${month}-${`${date.getDate()}`.padStart(2, "0")}`;
};

const periodLabel = (date: Date, granularity: Granularity): string =>
  granularity === "year"
    ? YEAR.format(date)
    : granularity === "month"
      ? MONTH.format(date)
      : DAY.format(date);

/**
 * Records grouped into periods, newest first, at whatever granularity the set
 * actually warrants. Undated records collect under one group at the end rather
 * than disappearing — the same contract `groupByYear` keeps.
 */
export const groupByPeriod = <T extends LensRecord>(
  records: T[],
  granularity: Granularity = granularityFor(records)
): PeriodGroup<T>[] => {
  const groups = new Map<string | null, PeriodGroup<T>>();

  for (const record of [...records].sort(byDateDesc)) {
    const date = recordMeta(record).date;
    const key = date ? periodKey(date, granularity) : null;
    const existing = groups.get(key);

    if (existing) existing.records.push(record);
    else {
      groups.set(key, {
        key,
        label: date ? periodLabel(date, granularity) : "Undated",
        records: [record],
      });
    }
  }

  return [...groups.values()];
};

/**
 * The same records grouped by the project they belong to, newest project first.
 *
 * Time is what a person remembers *about a document*; the project is what they
 * remember about a *job*. "Show me the kitchen remodel" is one question, and
 * answering it from a timeline means reading four years of headings and picking
 * the kitchen rows out of each. Both axes are already in the name, so this
 * costs no extra request — it reads `reason`, the same segment the record's
 * title comes from.
 *
 * A record whose name predates the convention has no project. Those collect at
 * the end under one group rather than disappearing, exactly as undated records
 * do above.
 */
export const groupByProject = <T extends LensRecord>(
  records: T[]
): PeriodGroup<T>[] => {
  const groups = new Map<string | null, PeriodGroup<T>>();

  for (const record of [...records].sort(byDateDesc)) {
    const project = recordMeta(record).project?.trim() || null;
    // Keyed case-insensitively so "Kitchen Remodel" and "Kitchen remodel" are
    // one project, not two — the capture form asks people to reuse the wording,
    // and this is what makes reusing it *nearly* right still work.
    const key = project ? project.toLowerCase() : null;
    const existing = groups.get(key);

    if (existing) existing.records.push(record);
    else {
      groups.set(key, {
        key,
        // The first spelling seen wins the heading, and because the records are
        // sorted newest-first that is the most recent one.
        label: project ?? "No project",
        records: [record],
      });
    }
  }

  return [...groups.values()];
};
