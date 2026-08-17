import { describe, expect, it } from "vitest";
import {
  buildRecordName,
  formatRecordDate,
  parseRecordDate,
  parseRecordName,
  sanitizeSegment,
} from "./recordNaming";

describe("formatRecordDate", () => {
  it("pads month and day and truncates the year", () => {
    expect(formatRecordDate(new Date(2025, 9, 7))).toBe("100725");
    expect(formatRecordDate(new Date(2026, 0, 1))).toBe("010126");
  });
});

describe("parseRecordDate", () => {
  it("round-trips a formatted date", () => {
    const date = new Date(2025, 9, 7);
    expect(parseRecordDate(formatRecordDate(date))).toEqual(date);
  });

  it("rejects malformed and overflowing dates", () => {
    expect(parseRecordDate("1025")).toBeNull();
    expect(parseRecordDate("132525")).toBeNull();
    // 31 February would otherwise silently roll forward to 3 March.
    expect(parseRecordDate("023125")).toBeNull();
  });
});

describe("sanitizeSegment", () => {
  it("strips characters that are illegal in filenames", () => {
    expect(sanitizeSegment('HVAC: repair/service?')).toBe("HVAC repairservice");
  });

  it("collapses the spaced hyphen that would break parsing", () => {
    expect(sanitizeSegment("Repair - Kitchen")).toBe("Repair Kitchen");
  });

  it("keeps hyphens that are part of a word", () => {
    expect(sanitizeSegment("Built-in oven")).toBe("Built-in oven");
  });
});

describe("buildRecordName", () => {
  it("produces the documented example", () => {
    expect(
      buildRecordName({
        date: new Date(2025, 9, 7),
        type: "Receipt",
        reason: "New Carpeting",
        docName: "HOME DEPOT carpeting",
        extension: "pdf",
      })
    ).toBe("100725 - Receipt - New Carpeting - HOME DEPOT carpeting.pdf");
  });

  it("omits the extension when used as a title", () => {
    expect(
      buildRecordName({
        date: new Date(2026, 2, 14),
        type: "Permit",
        reason: "Roof Replacement",
        docName: "City of Austin permit",
      })
    ).toBe("031426 - Permit - Roof Replacement - City of Austin permit");
  });
});

describe("parseRecordName", () => {
  it("round-trips a built name", () => {
    const parts = {
      date: new Date(2025, 9, 7),
      type: "Receipt" as const,
      reason: "New Carpeting",
      docName: "HOME DEPOT carpeting",
      extension: "pdf",
    };
    expect(parseRecordName(buildRecordName(parts))).toEqual(parts);
  });

  it("returns null for names that predate the convention", () => {
    expect(parseRecordName("scan_0001.pdf")).toBeNull();
    expect(parseRecordName("2025-10-07 receipt.pdf")).toBeNull();
  });

  it("returns null for an unrecognised document type", () => {
    expect(
      parseRecordName("100725 - Thingummy - New Carpeting - receipt.pdf")
    ).toBeNull();
  });

  it("assigns surplus separators to the document name", () => {
    const parsed = parseRecordName(
      "100725 - Receipt - New Carpeting - HOME DEPOT - order 44.pdf"
    );
    expect(parsed?.docName).toBe("HOME DEPOT - order 44");
  });

  it("handles a name with no extension", () => {
    expect(parseRecordName("100725 - Deed - Purchase - Warranty deed")).toEqual({
      date: new Date(2025, 9, 7),
      type: "Deed",
      reason: "Purchase",
      docName: "Warranty deed",
      extension: undefined,
    });
  });
});
