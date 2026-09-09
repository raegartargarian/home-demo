/**
 * How many of a section's records are archived.
 *
 * The list endpoint has no archived-only mode — `archived=true` means "include
 * the archived ones" — so the number is the difference between two totals:
 * everything, and live only. Each comes from a one-item page, since only its
 * `total_records` is read.
 */

/** The parts of a list response that matter here. */
export interface CountedPage {
  status: number;
  data?: { total_records?: number } | null;
}

/**
 * The backend answers an empty page with 204 and no body rather than 200 with
 * an empty list, so "nothing here" has to count as zero. Anything else is an
 * unknown, not a zero.
 */
export const totalRecordsOf = (page: CountedPage): number | null => {
  if (page.status === 204) return 0;
  if (page.status === 200) return page.data?.total_records ?? 0;
  return null;
};

/**
 * Archived = everything − live. Null when either page could not be read, so a
 * caller keeps the count it had rather than replacing it with a guess.
 */
export const archivedCountOf = (
  everything: CountedPage,
  liveOnly: CountedPage,
): number | null => {
  const total = totalRecordsOf(everything);
  const live = totalRecordsOf(liveOnly);
  if (total === null || live === null) return null;
  return Math.max(0, total - live);
};
