import { OTHER_DOC_TYPE, RECORD_DOC_TYPES } from "@/shared/utils/recordNaming";
import { describe, expect, it } from "vitest";
import {
  facetForLabel,
  facetForType,
  RECORD_FACETS,
  UNFACETED_DOC_TYPES,
} from "./recordFacets";

describe("record facets", () => {
  it("places every document type in a facet", () => {
    // A type with no facet is invisible to every filter in the app. Adding one
    // to RECORD_DOC_TYPES without grouping it should fail here, not in the UI.
    expect(UNFACETED_DOC_TYPES).toEqual([]);
  });

  it("places each type in exactly one facet", () => {
    const seen = RECORD_FACETS.flatMap((facet) => facet.types);
    expect(seen).toHaveLength(new Set(seen).size);
    // Every type but the `Other` escape hatch, which is deliberately unfaceted.
    expect(seen).toHaveLength(RECORD_DOC_TYPES.length - 1);
  });

  it("leaves the escape hatch unfaceted", () => {
    expect(facetForType(OTHER_DOC_TYPE)).toBeNull();
  });

  it("answers the question the filter exists for", () => {
    // "Show me what we paid" is one chip, not six.
    for (const type of ["Invoice", "Receipt", "Estimate", "Statement", "Tax"]) {
      expect(facetForType(type)?.code).toBe("payments");
    }
  });

  it("says Manuals on the chip a Manual is filed under", () => {
    // The chip used to read "Warranties", so a record filed as a Manual looked
    // mislabelled the moment the filter bar drew it.
    expect(facetForType("Manual")?.label).toBe("Manuals & Warranties");
  });

  it("still reads the label that chip used to carry", () => {
    // Already written into the `Contains:` line of records filed before the
    // rename; dropping it would take them out of the filter.
    expect(facetForLabel("Warranties")?.code).toBe("warranties");
    expect(facetForLabel("manuals & warranties")?.code).toBe("warranties");
  });

  it("has no facet for a type it does not know", () => {
    expect(facetForType("Blueprint")).toBeNull();
    expect(facetForType(undefined)).toBeNull();
    expect(facetForType(null)).toBeNull();
  });
});
