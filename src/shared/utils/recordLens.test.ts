import { describe, expect, it } from "vitest";
import {
  granularityFor,
  groupByPeriod,
  LensRecord,
  recordMeta,
} from "./recordLens";

const record = (
  id: string,
  name: string | undefined,
  created_at?: string,
  assetCode?: string
): LensRecord => ({
  id,
  name,
  created_at,
  stream: assetCode ? { asset_code: assetCode } : undefined,
});

// The seeded events from examples/README.md, which the Projects lens exists to
// draw back together out of the sections they are filed in.
const KITCHEN_ESTIMATE = record(
  "1",
  "021924 - Estimate - Kitchen Remodel - Hill Country Kitchens estimate",
  "2024-03-01T10:00:00Z",
  "maintenance-upgrades"
);
const KITCHEN_INVOICE = record(
  "2",
  "062824 - Invoice - Kitchen Remodel - Hill Country Kitchens final invoice",
  "2024-07-01T10:00:00Z",
  "maintenance-upgrades"
);
const ROOF_PERMIT = record(
  "3",
  "052126 - Permit - Roof Replacement - City of Austin permit",
  "2026-05-22T10:00:00Z",
  "property-records"
);
const ROOF_WARRANTY = record(
  "4",
  "053026 - Warranty - Roof Replacement - Summit Roofing 25-year warranty",
  "2026-05-31T10:00:00Z",
  "systems-warranties"
);
const LEGACY = record("5", "scan0012.pdf", "2025-02-03T10:00:00Z");

describe("recordMeta", () => {
  it("reads date, type and project off a canonical name", () => {
    const meta = recordMeta(KITCHEN_INVOICE);
    expect(meta.isCanonical).toBe(true);
    expect(meta.type).toBe("Invoice");
    expect(meta.project).toBe("Kitchen Remodel");
    expect(meta.title).toBe("Kitchen Remodel");
    expect(meta.date).toEqual(new Date(2024, 5, 28));
  });

  it("falls back to the filing date for a name that predates the convention", () => {
    const meta = recordMeta(LEGACY);
    expect(meta.isCanonical).toBe(false);
    expect(meta.project).toBeNull();
    expect(meta.type).toBeNull();
    expect(meta.title).toBe("scan0012.pdf");
    expect(meta.date).toEqual(new Date("2025-02-03T10:00:00Z"));
  });

  it("survives a record with neither a name nor a filing date", () => {
    expect(recordMeta({ id: "x" })).toMatchObject({
      date: null,
      project: null,
      title: "Home Record",
      isCanonical: false,
    });
  });
});

describe("granularityFor", () => {
  it("splits by year when the records span years", () => {
    expect(granularityFor([KITCHEN_INVOICE, ROOF_PERMIT])).toBe("year");
  });

  it("splits by month inside a single year", () => {
    // A year heading over a section that only has this year is one heading
    // over everything: it costs a row and says nothing. February and June.
    expect(granularityFor([KITCHEN_ESTIMATE, KITCHEN_INVOICE])).toBe("month");
  });

  it("splits by day inside a single month", () => {
    // Both roof records are May 2026 — 21st and 30th.
    expect(granularityFor([ROOF_PERMIT, ROOF_WARRANTY])).toBe("day");
  });

  it("does not let undated records widen the span", () => {
    expect(granularityFor([ROOF_PERMIT, { id: "x" }])).toBe("day");
  });
});

describe("groupByPeriod", () => {
  it("groups newest first, by the record's own date", () => {
    const groups = groupByPeriod([
      KITCHEN_ESTIMATE,
      ROOF_WARRANTY,
      KITCHEN_INVOICE,
      ROOF_PERMIT,
    ]);

    expect(groups.map((group) => group.label)).toEqual(["2026", "2024"]);
    // Within a period, newest first: the warranty (30 May) precedes the permit (21 May).
    expect(groups[0].records.map((r) => r.id)).toEqual(["4", "3"]);
    expect(groups[1].records.map((r) => r.id)).toEqual(["2", "1"]);
  });

  it("labels a single year by month", () => {
    const groups = groupByPeriod([KITCHEN_ESTIMATE, KITCHEN_INVOICE]);
    expect(groups.map((group) => group.label)).toEqual([
      "June 2024",
      "February 2024",
    ]);
  });

  it("labels a single month by day", () => {
    const groups = groupByPeriod([ROOF_PERMIT, ROOF_WARRANTY]);
    expect(groups.map((group) => group.label)).toEqual([
      "May 30, 2026",
      "May 21, 2026",
    ]);
  });

  it("keeps a legacy record visible, dated by created_at", () => {
    const groups = groupByPeriod([KITCHEN_INVOICE, LEGACY]);
    expect(groups.map((group) => group.label)).toEqual(["2025", "2024"]);
  });

  it("sorts undated records last rather than dropping them", () => {
    const groups = groupByPeriod([{ id: "x" }, KITCHEN_INVOICE]);
    expect(groups.map((group) => group.label)).toEqual([
      "June 28, 2024",
      "Undated",
    ]);
  });

  it("returns nothing for an empty vault", () => {
    expect(groupByPeriod([])).toEqual([]);
  });
});
