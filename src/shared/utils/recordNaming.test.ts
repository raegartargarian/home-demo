import { describe, expect, it } from "vitest";
import {
  buildRecordName,
  documentNameFrom,
  formatRecordDate,
  isMeaningfulFilename,
  readableDocName,
  parseRecordDate,
  parseRecordName,
  sanitizeSegment,
} from "./recordNaming";

describe("formatRecordDate", () => {
  it("pads month and day, truncates the year, and separates them", () => {
    expect(formatRecordDate(new Date(2025, 9, 7))).toBe("10-07-25");
    expect(formatRecordDate(new Date(2026, 0, 1))).toBe("01-01-26");
  });
});

describe("parseRecordDate", () => {
  it("round-trips a formatted date", () => {
    const date = new Date(2025, 9, 7);
    expect(parseRecordDate(formatRecordDate(date))).toEqual(date);
  });

  it("still reads the unpunctuated form files were filed under before", () => {
    expect(parseRecordDate("100725")).toEqual(new Date(2025, 9, 7));
  });

  it("puts a last-century year in the last century", () => {
    // The worked example's original construction set is from 1998. Read as
    // 2098 it sorted above everything and headed the timeline with a year
    // that has not happened.
    expect(parseRecordDate("04-16-98")?.getFullYear()).toBe(1998);
    expect(parseRecordDate("033098")?.getFullYear()).toBe(1998);
  });

  it("keeps a year that has plausibly already happened in this century", () => {
    const thisYear = new Date().getFullYear();
    const yy = `${thisYear}`.slice(-2);
    expect(parseRecordDate(`06-01-${yy}`)?.getFullYear()).toBe(thisYear);
  });

  it("rejects malformed and overflowing dates", () => {
    expect(parseRecordDate("10-25")).toBeNull();
    expect(parseRecordDate("13-25-25")).toBeNull();
    // 31 February would otherwise silently roll forward to 3 March.
    expect(parseRecordDate("02-31-25")).toBeNull();
    // An ISO date is a different shape and must not be mistaken for this one.
    expect(parseRecordDate("2025-10-07")).toBeNull();
  });
});

describe("sanitizeSegment", () => {
  it("strips characters that are illegal in filenames", () => {
    expect(sanitizeSegment("HVAC: repair/service?")).toBe("HVAC repairservice");
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
      }),
    ).toBe("10-07-25 - Receipt - New Carpeting - HOME DEPOT carpeting.pdf");
  });

  it("omits the extension when used as a title", () => {
    expect(
      buildRecordName({
        date: new Date(2026, 2, 14),
        type: "Permit",
        reason: "Roof Replacement",
        docName: "City of Austin permit",
      }),
    ).toBe("03-14-26 - Permit - Roof Replacement - City of Austin permit");
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

  it("still reads a name filed under the unpunctuated date", () => {
    expect(
      parseRecordName("100725 - Receipt - New Carpeting - HOME DEPOT.pdf")
        ?.date,
    ).toEqual(new Date(2025, 9, 7));
  });

  it("returns null for an unrecognised document type", () => {
    expect(
      parseRecordName("10-07-25 - Thingummy - New Carpeting - receipt.pdf"),
    ).toBeNull();
  });

  it("assigns surplus separators to the document name", () => {
    const parsed = parseRecordName(
      "10-07-25 - Receipt - New Carpeting - HOME DEPOT - order 44.pdf",
    );
    expect(parsed?.docName).toBe("HOME DEPOT - order 44");
  });

  it("handles a name with no extension", () => {
    expect(
      parseRecordName("10-07-25 - Deed - Purchase - Warranty deed"),
    ).toEqual({
      date: new Date(2025, 9, 7),
      type: "Deed",
      reason: "Purchase",
      docName: "Warranty deed",
      extension: undefined,
    });
  });
});

describe("isMeaningfulFilename", () => {
  it("keeps a name a person would recognise", () => {
    expect(isMeaningfulFilename("Summit Roofing invoice.pdf")).toBe(true);
    expect(isMeaningfulFilename("Invoice2026Q3.pdf")).toBe(true);
  });

  it("rejects a generated token even among real words", () => {
    expect(
      isMeaningfulFilename("content-credentials-pfau-43-CzJwG5YE.jpg"),
    ).toBe(false);
    expect(isMeaningfulFilename("689b37ee6ea3b020.pdf")).toBe(false);
    expect(isMeaningfulFilename("photo-779842473-of-the-roof.jpg")).toBe(false);
  });
});

describe("documentNameFrom", () => {
  it("takes only the document segment from a name that already parses", () => {
    expect(
      documentNameFrom(
        "05-03-25 - Photo - Garden Landscaping - New turf and fence installed.jpg",
      ),
    ).toBe("New turf and fence installed");
  });

  it("reads a file filed under the older unpunctuated date the same way", () => {
    expect(
      documentNameFrom(
        "050325 - Photo - Garden Landscaping - New turf and fence installed.jpg",
      ),
    ).toBe("New turf and fence installed");
  });

  it("keeps the whole stem of a name that does not follow the convention", () => {
    expect(documentNameFrom("Summit Roofing invoice.pdf")).toBe(
      "Summit Roofing invoice",
    );
    expect(documentNameFrom("kitchen-after.png")).toBe("kitchen-after");
  });

  it("does not let the convention be applied to itself twice", () => {
    // Re-filing an already-named file used to fold its whole name into the
    // Document slot, with the separators flattened to spaces on the way in:
    //   "… - Garden Landscaping - 050325 Photo Garden Landscaping New turf …"
    // Formally a valid name, and unreadable.
    const dropped =
      "050325 - Photo - Garden Landscaping - New turf and fence installed.jpg";

    const refiled = buildRecordName({
      date: new Date(2025, 4, 3),
      type: "Photo",
      reason: "Garden Landscaping",
      docName: documentNameFrom(dropped),
      extension: "jpg",
    });

    expect(refiled).toBe(
      "05-03-25 - Photo - Garden Landscaping - New turf and fence installed.jpg",
    );
    // And filing it again is a fixed point, not a third round of nesting.
    expect(documentNameFrom(refiled)).toBe("New turf and fence installed");
  });
});

describe("readableDocName", () => {
  it("drops the date and type a legacy double-named record repeats", () => {
    expect(
      readableDocName(
        "053125 Photo Garden Landscaping Fire pit detail at dusk",
      ),
    ).toBe("Garden Landscaping Fire pit detail at dusk");
  });

  it("handles the hyphenated date the same way", () => {
    expect(
      readableDocName("05-31-25 Photo Garden Landscaping Rear garden"),
    ).toBe("Garden Landscaping Rear garden");
  });

  it("leaves an ordinary document name alone", () => {
    expect(readableDocName("Fire pit detail at dusk")).toBe(
      "Fire pit detail at dusk",
    );
    expect(readableDocName("Summit Roofing final invoice")).toBe(
      "Summit Roofing final invoice",
    );
  });

  it("does not trim a name whose leading digits are not a date", () => {
    // 34 is not a day, so this is a document called exactly that.
    expect(readableDocName("123456 Photo album")).toBe("123456 Photo album");
  });

  it("does not trim a name whose second word is not a document type", () => {
    expect(readableDocName("053125 Garden Landscaping photos")).toBe(
      "053125 Garden Landscaping photos",
    );
  });
});

describe("isMeaningfulFilename", () => {
  it("rejects a name that is essentially random numbers", () => {
    // The case that prompted this: a photo saved off a social feed.
    expect(
      isMeaningfulFilename(
        "779842473_1597057791975426_6463832288154644721_n.jpeg",
      ),
    ).toBe(false);
    expect(isMeaningfulFilename("20240815_143022.jpg")).toBe(false);
    expect(isMeaningfulFilename("12345.png")).toBe(false);
  });

  it("rejects the names cameras and apps give files", () => {
    for (const name of [
      "IMG_0042.HEIC",
      "DSC00123.JPG",
      "PXL_20240101_120000.jpg",
      "screenshot1241.png",
      "Screenshot 2026-08-26 at 13.04.11.png",
      "images (6).jpeg",
      "scan_0001.pdf",
      "untitled.pdf",
      "download.pdf",
    ]) {
      expect(isMeaningfulFilename(name), name).toBe(false);
    }
  });

  it("keeps a name a person would recognise", () => {
    for (const name of [
      "Completed living room.jpg",
      "Empty room before fireplace wall.jpg",
      "Hill Country Kitchens final invoice.pdf",
      "kitchen-after.png",
      "invoice.pdf",
    ]) {
      expect(isMeaningfulFilename(name), name).toBe(true);
    }
  });

  it("is not fooled by a device word sitting next to a real one", () => {
    // "Kitchen" survives, so the name says something even though "IMG" does not.
    expect(isMeaningfulFilename("IMG_kitchen_after.jpg")).toBe(true);
  });
});

describe("documentNameFrom, on device-named files", () => {
  it("returns nothing to pre-fill, rather than nonsense", () => {
    expect(
      documentNameFrom("779842473_1597057791975426_6463832288154644721_n.jpeg"),
    ).toBe("");
    expect(documentNameFrom("IMG_0042.HEIC")).toBe("");
  });

  it("still carries over a name worth keeping", () => {
    expect(documentNameFrom("Completed living room.jpg")).toBe(
      "Completed living room",
    );
  });
});

describe("filing a set whose files were never named", () => {
  it("names them by position rather than keeping the device's name", () => {
    // The rule this pins: a name not worth pre-filling into the form is not
    // worth writing into the vault either. Keeping
    // `776222620_2322108331861993_…_n` under the convention would be the
    // convention certifying the exact thing it exists to prevent.
    const positional = (type: string, index: number) => `${type} ${index + 1}`;

    const names = [
      "776222620_2322108331861993_6267282462334264398_n.jpeg",
      "776224175_1048969981439902_924453821423057683_n.jpeg",
    ].map((filename, index) =>
      buildRecordName({
        date: new Date(2026, 7, 26),
        type: "Photo",
        reason: "Living Room Renovation",
        docName: documentNameFrom(filename) || positional("Photo", index),
        extension: "jpeg",
      }),
    );

    expect(names).toEqual([
      "08-26-26 - Photo - Living Room Renovation - Photo 1.jpeg",
      "08-26-26 - Photo - Living Room Renovation - Photo 2.jpeg",
    ]);

    // And they read back cleanly, which the hash-named version did not.
    expect(parseRecordName(names[0])?.docName).toBe("Photo 1");
  });
});
