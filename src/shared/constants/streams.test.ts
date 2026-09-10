import { describe, expect, it } from "vitest";

import {
  customCategoryFor,
  isKnownSection,
  knownSectionFor,
  knownSectionForTypedName,
  SECTION_SLUG_MAX_LENGTH,
  STREAM_CATEGORIES,
  toSectionSlug,
} from "./streams";
import { categoryForStream } from "@/shared/utils/streamHelpers";

describe("toSectionSlug", () => {
  it("takes a typed name to the shape the five already use", () => {
    expect(toSectionSlug("Landscaping")).toBe("landscaping");
    expect(toSectionSlug("Kitchen Cabinets")).toBe("kitchen-cabinets");
  });

  it("lowercases, because one backend path compares lowercased and one does not", () => {
    expect(toSectionSlug("ROOF WORK")).toBe("roof-work");
  });

  it("collapses whatever separators were typed", () => {
    expect(toSectionSlug("Roof / Gutters & Fascia")).toBe(
      "roof-gutters-fascia",
    );
    expect(toSectionSlug("  spaced   out  ")).toBe("spaced-out");
    expect(toSectionSlug("under_scored")).toBe("under-scored");
  });

  it("folds accents so one name cannot become two sections", () => {
    expect(toSectionSlug("Dépôt")).toBe(toSectionSlug("Depot"));
  });

  it("clamps length without leaving a trailing separator", () => {
    const slug = toSectionSlug(`${"a".repeat(SECTION_SLUG_MAX_LENGTH)} tail`);
    expect(slug).toHaveLength(SECTION_SLUG_MAX_LENGTH);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("returns nothing for a name with nothing usable in it", () => {
    expect(toSectionSlug("!!!")).toBe("");
    expect(toSectionSlug("   ")).toBe("");
  });
});

describe("knownSectionForTypedName", () => {
  it("recognises every one of the five by the name the app shows", () => {
    for (const category of Object.values(STREAM_CATEGORIES)) {
      expect(knownSectionForTypedName(category.label)).toBe(category);
    }
  });

  it("recognises the three whose label does not slugify onto their code", () => {
    expect(knownSectionForTypedName("Maintenance and Upgrades")?.code).toBe(
      "maintenance-upgrades",
    );
    expect(knownSectionForTypedName("Home Systems and Appliances")?.code).toBe(
      "systems-warranties",
    );
    expect(knownSectionForTypedName("My Personal Home Info")?.code).toBe(
      "personal-vault",
    );
  });

  it("recognises a code typed directly, and ignores casing", () => {
    expect(knownSectionForTypedName("property-records")?.code).toBe(
      "property-records",
    );
    expect(knownSectionForTypedName("  PROPERTY records ")?.code).toBe(
      "property-records",
    );
  });

  it("returns nothing for a name that is genuinely new", () => {
    expect(knownSectionForTypedName("Landscaping")).toBeNull();
    expect(knownSectionForTypedName("!!!")).toBeNull();
  });
});

describe("customCategoryFor", () => {
  it("is stable, so a section is the same colour everywhere at once", () => {
    expect(customCategoryFor("landscaping")).toEqual(
      customCategoryFor("landscaping"),
    );
  });

  it("takes one of the spare accent slots", () => {
    expect(customCategoryFor("landscaping").code).toMatch(/^custom-[1-6]$/);
  });

  it("reads the slug back as a name", () => {
    expect(customCategoryFor("kitchen-cabinets").label).toBe(
      "Kitchen Cabinets",
    );
  });

  it("sorts behind all five", () => {
    const five = Object.values(STREAM_CATEGORIES).map((c) => c.order);
    expect(customCategoryFor("landscaping").order).toBeGreaterThan(
      Math.max(...five),
    );
  });

  it("spreads different names across the slots", () => {
    const names = ["landscaping", "pool", "fencing", "solar", "attic", "deck"];
    const used = new Set(names.map((n) => customCategoryFor(n).code));
    expect(used.size).toBeGreaterThan(1);
  });

  it("travels at sale, like everything except the Personal Vault", () => {
    expect(customCategoryFor("landscaping").transfersOnSale).toBe(true);
  });
});

describe("isKnownSection and knownSectionFor", () => {
  it("separates the five from a named one", () => {
    expect(isKnownSection(STREAM_CATEGORIES["home-profile"])).toBe(true);
    expect(isKnownSection(customCategoryFor("landscaping"))).toBe(false);
    expect(isKnownSection(null)).toBe(false);
  });

  it("resolves an accent code back only when it is one of the five", () => {
    expect(knownSectionFor("home-profile")).toBe(
      STREAM_CATEGORIES["home-profile"],
    );
    expect(knownSectionFor("custom-3")).toBeNull();
    expect(knownSectionFor(undefined)).toBeNull();
  });
});

describe("categoryForStream", () => {
  const stream = (mapping: string, assetCode = "ABCDE") => ({
    id: "s1",
    mapping,
    asset_code: assetCode,
  });

  it("still resolves the five from the mapping", () => {
    expect(categoryForStream(stream("property-records"))?.label).toBe(
      "Property Records",
    );
  });

  it("gives a named section a look instead of leaving it anonymous", () => {
    const category = categoryForStream(stream("landscaping"));

    expect(category?.label).toBe("Landscaping");
    expect(category?.isCustom).toBe(true);
    expect(category?.code).toMatch(/^custom-[1-6]$/);
  });

  it("is null only when the backend has given the stream no slug at all", () => {
    expect(categoryForStream({ id: "s1", mapping: "" })).toBeNull();
  });
});
