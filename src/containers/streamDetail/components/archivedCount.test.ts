import { describe, expect, it } from "vitest";
import { archivedCountOf, totalRecordsOf } from "./archivedCount";

const page = (status: number, total?: number) => ({
  status,
  data: total === undefined ? undefined : { total_records: total },
});

describe("totalRecordsOf", () => {
  it("reads the total off a full page", () => {
    expect(totalRecordsOf(page(200, 12))).toBe(12);
  });

  it("counts the backend's bodiless 204 as zero", () => {
    expect(totalRecordsOf(page(204))).toBe(0);
  });

  it("treats anything else as unknown rather than zero", () => {
    expect(totalRecordsOf(page(500))).toBeNull();
    expect(totalRecordsOf(page(403, 3))).toBeNull();
  });
});

describe("archivedCountOf", () => {
  it("is the difference between everything and the live records", () => {
    expect(archivedCountOf(page(200, 12), page(200, 9))).toBe(3);
  });

  it("is zero for a section with nothing archived", () => {
    expect(archivedCountOf(page(200, 9), page(200, 9))).toBe(0);
  });

  it("is the whole total when every record is archived", () => {
    // Live-only comes back empty, which the backend sends as 204.
    expect(archivedCountOf(page(200, 4), page(204))).toBe(4);
  });

  it("is unknown when either page could not be read", () => {
    expect(archivedCountOf(page(500), page(200, 9))).toBeNull();
    expect(archivedCountOf(page(200, 12), page(500))).toBeNull();
  });

  it("never goes negative when the totals disagree", () => {
    expect(archivedCountOf(page(200, 5), page(200, 7))).toBe(0);
  });
});
