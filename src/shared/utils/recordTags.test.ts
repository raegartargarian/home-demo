import { facetForLabel } from "@/shared/constants/recordFacets";
import { roomForCode, ROOMS } from "@/shared/constants/rooms";
import { describe, expect, it } from "vitest";
import {
  facetsForRecord,
  formatRoomTags,
  parseContainsTags,
  parseRoomTags,
  stripTagLines,
  withRecordTags,
} from "./recordTags";

const rooms = (...codes: string[]) =>
  codes.map((code) => roomForCode(code)!).filter(Boolean);

const facets = (...labels: string[]) =>
  labels.map((label) => facetForLabel(label)!).filter(Boolean);

/** The tag helpers take a note plus rooms; most cases only vary the rooms. */
const withRooms = (note: string | undefined, picked: ReturnType<typeof rooms>) =>
  withRecordTags(note, { rooms: picked });

describe("formatRoomTags", () => {
  it("writes one readable line, in the canonical order", () => {
    // Passed patio-first; comes back in ROOMS order.
    expect(formatRoomTags(rooms("patio", "kitchen"))).toBe(
      "Rooms: Kitchen, Patio",
    );
  });

  it("writes nothing at all for no rooms", () => {
    // An empty "Rooms:" line would show up in the proof PDF as noise.
    expect(formatRoomTags([])).toBe("");
  });
});

describe("parseRoomTags", () => {
  it("round-trips every room in the vocabulary", () => {
    const parsed = parseRoomTags(formatRoomTags(ROOMS));
    expect(parsed.map((room) => room.code)).toEqual(
      ROOMS.map((room) => room.code),
    );
  });

  it("reads the line out from under the homeowner's note", () => {
    const stored = withRooms("Hill Country did the work.", rooms("kitchen"));
    expect(parseRoomTags(stored).map((r) => r.label)).toEqual(["Kitchen"]);
  });

  it("ignores a room nobody can filter by", () => {
    expect(parseRoomTags("Rooms: Kitchen, Wine Cellar")).toHaveLength(1);
  });

  it("is case-insensitive — the line is hand-editable", () => {
    expect(parseRoomTags("Rooms: kitchen, PATIO").map((r) => r.code)).toEqual([
      "kitchen",
      "patio",
    ]);
  });

  it("collapses a room repeated on the line", () => {
    expect(parseRoomTags("Rooms: Kitchen, Kitchen")).toHaveLength(1);
  });

  it("finds nothing in a description that carries no tags", () => {
    expect(parseRoomTags("Just a note about the work.")).toEqual([]);
    expect(parseRoomTags(undefined)).toEqual([]);
    expect(parseRoomTags(null)).toEqual([]);
  });
});

describe("stripTagLines", () => {
  it("hands the note back untouched when there is no tag line", () => {
    expect(stripTagLines("Hill Country did the work.")).toBe(
      "Hill Country did the work.",
    );
  });

  it("removes the tag line and the gap it left behind", () => {
    const stored = withRooms("Hill Country did the work.", rooms("kitchen"));
    expect(stripTagLines(stored)).toBe("Hill Country did the work.");
  });

  it("is empty for a description that was only ever tags", () => {
    expect(stripTagLines("Rooms: Kitchen")).toBe("");
  });
});

describe("withRecordTags", () => {
  it("leaves the description unset when there is neither note nor room", () => {
    expect(withRooms(undefined, [])).toBeUndefined();
    expect(withRooms("", [])).toBeUndefined();
  });

  it("stores tags alone when there is no note", () => {
    expect(withRooms(undefined, rooms("roof"))).toBe("Rooms: Roof");
  });

  it("does not stack a second tag line when re-applied", () => {
    const once = withRooms("Note.", rooms("kitchen"));
    const twice = withRooms(once, rooms("patio"));
    expect(twice).toBe("Note.\n\nRooms: Patio");
    expect(parseRoomTags(twice)).toHaveLength(1);
  });
});

describe("parseContainsTags", () => {
  it("round-trips through storage", () => {
    const stored = withRecordTags("Hill Country did the work.", {
      rooms: rooms("kitchen"),
      contains: facets("Photos"),
    });
    expect(parseContainsTags(stored).map((f) => f.code)).toEqual(["photos"]);
    // The two lines are independent — neither swallows the other.
    expect(parseRoomTags(stored).map((r) => r.code)).toEqual(["kitchen"]);
    expect(stripTagLines(stored)).toBe("Hill Country did the work.");
  });

  it("returns them in the taxonomy's order, whatever order they were written", () => {
    expect(parseContainsTags("Contains: Photos, Payments").map((f) => f.code))
      .toEqual(["payments", "photos"]);
  });

  it("drops a label it does not recognise", () => {
    expect(parseContainsTags("Contains: Photos, Blueprints")).toHaveLength(1);
  });

  it("finds nothing in a description with no tag line", () => {
    expect(parseContainsTags("Just a note.")).toEqual([]);
    expect(parseContainsTags(undefined)).toEqual([]);
  });
});

describe("facetsForRecord", () => {
  const INVOICE = "100725 - Invoice - New Carpeting - HOME DEPOT carpeting";

  it("is the typed facet alone when nothing else is tagged", () => {
    expect(facetsForRecord({ name: INVOICE })).toEqual(["payments"]);
  });

  it("unions the typed facet with what the files also contain", () => {
    // The case this whole mechanism exists for: one zip, invoice plus photos.
    expect(
      facetsForRecord({ name: INVOICE, description: "Contains: Photos" }),
    ).toEqual(["payments", "photos"]);
  });

  it("leads with the typed facet", () => {
    const codes = facetsForRecord({
      name: INVOICE,
      description: "Contains: Plans & Specs, Photos",
    });
    expect(codes[0]).toBe("payments");
  });

  it("does not repeat a facet the type already covers", () => {
    expect(
      facetsForRecord({ name: INVOICE, description: "Contains: Payments" }),
    ).toEqual(["payments"]);
  });

  it("is only the tagged facets for a name that predates the convention", () => {
    expect(
      facetsForRecord({ name: "scan001.pdf", description: "Contains: Photos" }),
    ).toEqual(["photos"]);
  });

  it("is empty for a record with neither", () => {
    expect(facetsForRecord({ name: "scan001.pdf" })).toEqual([]);
  });
});
