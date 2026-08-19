import { Attachment } from "@/containers/vaultDetail/types";
import { describe, expect, it } from "vitest";
import {
  facetOptions,
  filterRecords,
  roomOptions,
  toggle,
} from "./recordFilter";

const record = (
  id: string,
  name: string,
  description?: string,
): Attachment => ({ id, name, description });

// One kitchen invoice, one kitchen photo, one patio invoice, one untagged.
const KITCHEN_INVOICE = record(
  "1",
  "062824 - Invoice - Kitchen Remodel - Final invoice.pdf",
  "Rooms: Kitchen",
);
const KITCHEN_PHOTO = record(
  "2",
  "030424 - Photo - Kitchen Remodel - Before demolition.jpg",
  "Paid in full.\n\nRooms: Kitchen, Dining Room",
);
const PATIO_INVOICE = record(
  "3",
  "051025 - Invoice - Garden Landscaping - Paving invoice.pdf",
  "Rooms: Patio",
);
const UNTAGGED_DEED = record(
  "4",
  "011598 - Deed - Purchase - Warranty deed.pdf",
);

const ALL = [KITCHEN_INVOICE, KITCHEN_PHOTO, PATIO_INVOICE, UNTAGGED_DEED];

const ids = (records: Attachment[]) => records.map((r) => r.id);

describe("filterRecords", () => {
  it("returns everything when nothing is selected", () => {
    expect(filterRecords(ALL, { facets: [], rooms: [] })).toHaveLength(4);
  });

  it("unions within one axis", () => {
    // "kitchen or patio" — three of the four.
    expect(
      ids(filterRecords(ALL, { facets: [], rooms: ["kitchen", "patio"] })),
    ).toEqual(["1", "2", "3"]);
  });

  it("groups six document types under one Payments chip", () => {
    expect(
      ids(filterRecords(ALL, { facets: ["payments"], rooms: [] })),
    ).toEqual(["1", "3"]);
  });

  it("intersects across axes rather than unioning them", () => {
    // Payments AND kitchen: the kitchen photo is a kitchen record but not a
    // payment, and the patio invoice is a payment but not a kitchen one.
    expect(
      ids(filterRecords(ALL, { facets: ["payments"], rooms: ["kitchen"] })),
    ).toEqual(["1"]);
  });

  it("drops untagged records from a room filter without hiding them otherwise", () => {
    expect(
      ids(filterRecords(ALL, { facets: [], rooms: ["kitchen"] })),
    ).not.toContain("4");
    expect(ids(filterRecords(ALL, { facets: ["legal"], rooms: [] }))).toEqual([
      "4",
    ]);
  });
});

describe("options", () => {
  it("offers only facets that are present", () => {
    const codes = facetOptions(ALL, { facets: [], rooms: [] }).map(
      (o) => o.code,
    );
    expect(codes.sort()).toEqual(["legal", "payments", "photos"]);
  });

  it("counts a room once per record, not once per tag", () => {
    const kitchen = roomOptions(ALL, { facets: [], rooms: [] }).find(
      (o) => o.room.code === "kitchen",
    );
    expect(kitchen?.count).toBe(2);
  });

  it("measures each axis against the other's selection", () => {
    // With Payments on, the Kitchen chip should promise one record, not two —
    // the kitchen photo is not a payment.
    const kitchen = roomOptions(ALL, { facets: ["payments"], rooms: [] }).find(
      (o) => o.room.code === "kitchen",
    );
    expect(kitchen?.count).toBe(1);
  });
});

describe("toggle", () => {
  it("adds and removes", () => {
    expect(toggle(["a"], "b")).toEqual(["a", "b"]);
    expect(toggle(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("records that hold more than one kind of document", () => {
  // One upload, one zip: the contractor's invoice and the photos of the work.
  const INVOICE_WITH_PHOTOS = record(
    "5",
    "081525 - Invoice - Roof Replacement - Summit Roofing final.pdf",
    "Rooms: Roof\nContains: Photos",
  );
  const MIXED = [...ALL, INVOICE_WITH_PHOTOS];

  it("is found by the facet its type names", () => {
    expect(
      ids(filterRecords(MIXED, { facets: ["payments"], rooms: [] })),
    ).toContain("5");
  });

  it("is also found by what its files contain", () => {
    expect(
      ids(filterRecords(MIXED, { facets: ["photos"], rooms: [] })),
    ).toContain("5");
  });

  it("is counted under both chips, so the row can exceed the page", () => {
    const counts = new Map(
      facetOptions(MIXED, { facets: [], rooms: [] }).map((option) => [
        option.code,
        option.count,
      ]),
    );
    expect(counts.get("payments")).toBe(3); // two invoices + this one
    expect(counts.get("photos")).toBe(2); // the photo record + this one
  });

  it("is returned once, not twice, when both its facets are selected", () => {
    const matched = ids(
      filterRecords(MIXED, { facets: ["payments", "photos"], rooms: [] }),
    );
    expect(matched.filter((id) => id === "5")).toHaveLength(1);
  });
});
