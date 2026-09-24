import { facetForLabel } from "@/shared/constants/recordFacets";
import { roomForLabel } from "@/shared/constants/rooms";
import { describe, expect, it } from "vitest";
import {
  buildRecordManifest,
  isRecordManifest,
  RECORD_MANIFEST_FILENAME,
  recordManifestFile,
} from "./recordManifest";

const INPUT = {
  project: " Kitchen Remodel ",
  docType: "Invoice",
  date: "2026-09-18",
  note: "  Paid in full.\nAsk for Dana next time.  ",
  rooms: [roomForLabel("Kitchen")!],
  contains: [facetForLabel("Photos")!],
};

describe("buildRecordManifest", () => {
  it("writes the note and the tags down as data", () => {
    expect(buildRecordManifest(INPUT)).toEqual({
      recordInfo: {
        name: "Kitchen Remodel",
        docType: "Invoice",
        date: "2026-09-18",
        rooms: ["Kitchen"],
        contains: ["Photos"],
      },
      notes: "Paid in full.\nAsk for Dana next time.",
    });
  });

  it("leaves out what nobody filled in", () => {
    const text = JSON.stringify(
      buildRecordManifest({ ...INPUT, note: " ", rooms: [], contains: [] }),
    );
    expect(text).not.toContain("notes");
    expect(text).not.toContain("rooms");
    expect(text).not.toContain("contains");
  });
});

describe("recordManifestFile", () => {
  it("is the same bytes every time, so a retried upload can resume", async () => {
    const [first, second] = await Promise.all([
      recordManifestFile(INPUT).text(),
      recordManifestFile(INPUT).text(),
    ]);
    expect(first).toBe(second);
    expect(recordManifestFile(INPUT).name).toBe(RECORD_MANIFEST_FILENAME);
  });
});

describe("isRecordManifest", () => {
  it("knows the manifest by name, wherever in the zip it sits", () => {
    expect(isRecordManifest("home_record.json")).toBe(true);
    expect(isRecordManifest("bundle/Home_Record.JSON")).toBe(true);
  });

  it("leaves the homeowner's own json alone", () => {
    expect(isRecordManifest("091826 - Report - Energy audit - Data.json")).toBe(
      false,
    );
    expect(isRecordManifest(undefined)).toBe(false);
  });
});
