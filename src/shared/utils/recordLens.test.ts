import { describe, expect, it } from "vitest";
import {
  groupByProject,
  groupByYear,
  LensRecord,
  recordMeta,
  recordsInProject,
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

describe("groupByYear", () => {
  it("groups newest year first, by the record's own date", () => {
    const groups = groupByYear([
      KITCHEN_ESTIMATE,
      ROOF_WARRANTY,
      KITCHEN_INVOICE,
      ROOF_PERMIT,
    ]);

    expect(groups.map((group) => group.year)).toEqual([2026, 2024]);
    // Within a year, newest first: the warranty (30 May) precedes the permit (21 May).
    expect(groups[0].records.map((r) => r.id)).toEqual(["4", "3"]);
    expect(groups[1].records.map((r) => r.id)).toEqual(["2", "1"]);
  });

  it("keeps a legacy record visible, dated by created_at", () => {
    const groups = groupByYear([KITCHEN_INVOICE, LEGACY]);
    expect(groups.map((group) => group.year)).toEqual([2025, 2024]);
  });

  it("sorts undated records last rather than dropping them", () => {
    const groups = groupByYear([{ id: "x" }, KITCHEN_INVOICE]);
    expect(groups.map((group) => group.year)).toEqual([2024, null]);
  });

  it("returns nothing for an empty vault", () => {
    expect(groupByYear([])).toEqual([]);
  });
});

describe("groupByProject", () => {
  const groups = groupByProject([
    KITCHEN_ESTIMATE,
    ROOF_WARRANTY,
    LEGACY,
    KITCHEN_INVOICE,
    ROOF_PERMIT,
  ]);

  it("assembles a project from every section it touches", () => {
    const roof = groups.find((group) => group.project === "Roof Replacement");
    expect(roof?.records.map((r) => r.id)).toEqual(["4", "3"]);
    expect(roof?.assetCodes).toEqual(["systems-warranties", "property-records"]);
  });

  it("spans the project from its oldest record to its newest", () => {
    const kitchen = groups.find((group) => group.project === "Kitchen Remodel");
    expect(kitchen?.from).toEqual(new Date(2024, 1, 19));
    expect(kitchen?.to).toEqual(new Date(2024, 5, 28));
  });

  it("orders by most recent activity, with Unfiled always last", () => {
    expect(groups.map((group) => group.project)).toEqual([
      "Roof Replacement",
      "Kitchen Remodel",
      null,
    ]);
  });

  it("collects legacy names under Unfiled instead of inventing a project", () => {
    const unfiled = groups.find((group) => group.project === null);
    expect(unfiled?.records.map((r) => r.id)).toEqual(["5"]);
  });
});

describe("recordsInProject", () => {
  it("finds one project's records again, newest first", () => {
    const found = recordsInProject(
      [KITCHEN_ESTIMATE, ROOF_PERMIT, KITCHEN_INVOICE],
      "Kitchen Remodel"
    );
    expect(found.map((r) => r.id)).toEqual(["2", "1"]);
  });
});
