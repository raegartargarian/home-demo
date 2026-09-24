import { describe, expect, it } from "vitest";
import { Attachment } from "../types";
import { labelFor, sectionTiles } from "./sectionTiles";

const record = (id: string, name: string, filenames: string[]): Attachment => ({
  id,
  name,
  files: filenames.map((filename, i) => ({ filename, cid: `${id}-${i}` })),
});

describe("sectionTiles", () => {
  it("gives every file in a record its own tile", () => {
    const tiles = sectionTiles([
      record("r1", "Deed transfer", ["deed.pdf", "survey.pdf", "plat.png"]),
    ]);
    expect(tiles).toHaveLength(3);
    expect(tiles.map((t) => t.file.filename)).toEqual([
      "deed.pdf",
      "survey.pdf",
      "plat.png",
    ]);
  });

  it("never tiles the zip bundle, which is packaging rather than content", () => {
    const tiles = sectionTiles([
      record("r1", "Deed transfer", ["deed.pdf", "bundle.zip"]),
    ]);
    expect(tiles.map((t) => t.file.filename)).toEqual(["deed.pdf"]);
  });

  it("never tiles the manifest the capture form packs in with the files", () => {
    const tiles = sectionTiles([
      record("r1", "Deed transfer", [
        "deed.pdf",
        "home_record.json",
        "bundle.zip",
      ]),
    ]);
    expect(tiles.map((t) => t.file.filename)).toEqual(["deed.pdf"]);
  });

  it("gives every tile of a record the record's note, without its tag lines", () => {
    const tiles = sectionTiles([
      {
        ...record("r1", "Deed transfer", ["deed.pdf", "survey.pdf"]),
        description: "Signed at the notary.\n\nRooms: Kitchen",
      },
    ]);
    expect(tiles.map((t) => t.note)).toEqual([
      "Signed at the notary.",
      "Signed at the notary.",
    ]);
  });

  it("flattens records in order, so a card's slice takes whole records first", () => {
    const tiles = sectionTiles([
      record("r1", "A", ["a1.pdf", "a2.pdf"]),
      record("r2", "B", ["b1.pdf", "b2.pdf"]),
      record("r3", "C", ["c1.pdf", "c2.pdf"]),
    ]);
    expect(tiles).toHaveLength(6);
    expect(tiles.map((t) => t.file.filename)).toEqual([
      "a1.pdf",
      "a2.pdf",
      "b1.pdf",
      "b2.pdf",
      "c1.pdf",
      "c2.pdf",
    ]);
  });

  it("keys tiles uniquely so two files of one record both render", () => {
    const tiles = sectionTiles([record("r1", "A", ["a1.pdf", "a2.pdf"])]);
    expect(new Set(tiles.map((t) => t.key)).size).toBe(2);
  });

  it("still tiles a record whose only file is the bundle", () => {
    // Uploads from this app are packed into one zip, so a bundle-only record is
    // the common case, not an oddity — dropping it would empty the section.
    const tiles = sectionTiles([record("r1", "Deed transfer", ["bundle.zip"])]);
    expect(tiles).toHaveLength(1);
    expect(tiles[0].label).toBe("Deed transfer");
  });

  it("survives a record with no files at all", () => {
    expect(sectionTiles([{ id: "r1", name: "Empty" }])).toEqual([]);
  });

  it("carries the record's archived flag onto every one of its tiles", () => {
    const tiles = sectionTiles([
      { ...record("r1", "Old", ["a.pdf", "b.pdf"]), archived: true },
      record("r2", "Live", ["c.pdf"]),
    ]);
    expect(tiles.map((t) => t.archived)).toEqual([true, true, false]);
  });
});

describe("labelFor", () => {
  const canonical = record(
    "r1",
    "100725 - Receipt - New Carpeting - HOME DEPOT",
    ["scan001.pdf"],
  );

  it("uses the record's reason when the record is a single file", () => {
    // "scan001" says nothing; the reason the record exists says everything.
    expect(labelFor(canonical, canonical.files![0], 1)).toBe("New Carpeting");
  });

  it("uses the filename when a record holds several files", () => {
    // The record's name describes all of them equally, so it distinguishes
    // none of them.
    expect(labelFor(canonical, { filename: "before-photo.jpg" }, 3)).toBe(
      "before-photo",
    );
  });

  it("falls back to the record's title when a file has no usable name", () => {
    expect(labelFor(canonical, { filename: "" }, 3)).toBe("New Carpeting");
  });

  it("strips only the extension, not dots inside the name", () => {
    expect(labelFor(canonical, { filename: "a101.rev2.pdf" }, 2)).toBe(
      "a101.rev2",
    );
  });
});
