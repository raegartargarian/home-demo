import { RECORD_DOC_TYPES } from "@/shared/utils/recordNaming";
import { describe, expect, it } from "vitest";
import {
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
    expect(seen).toHaveLength(RECORD_DOC_TYPES.length);
  });

  it("answers the question the filter exists for", () => {
    // "Show me what we paid" is one chip, not six.
    for (const type of ["Invoice", "Receipt", "Estimate", "Statement", "Tax"]) {
      expect(facetForType(type)?.code).toBe("payments");
    }
  });

  it("has no facet for a type it does not know", () => {
    expect(facetForType("Blueprint")).toBeNull();
    expect(facetForType(undefined)).toBeNull();
    expect(facetForType(null)).toBeNull();
  });
});
