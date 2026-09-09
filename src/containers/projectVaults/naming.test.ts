import { describe, expect, it } from "vitest";

import {
  buildChildTemplateName,
  buildRootTemplateName,
  childTemplateSearchTerm,
  displayNameForTemplate,
  isNestedTemplateName,
  NV_LABEL_MAX_LENGTH,
  parseNestedTemplateName,
  sanitizeNestedLabel,
} from "./naming";

const PARENT = "7f3a1c2e-0b44-4d19-9a77-2f6c8e5b1091";

describe("sanitizeNestedLabel", () => {
  it("replaces the field separator so names round-trip", () => {
    expect(sanitizeNestedLabel("Q1::Filings")).toBe("Q1--Filings");
  });

  it("replaces a lone colon too", () => {
    expect(sanitizeNestedLabel("Acme: Portfolio")).toBe("Acme- Portfolio");
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeNestedLabel("  Acme  ")).toBe("Acme");
  });

  it("clamps to the maximum length", () => {
    const long = "a".repeat(NV_LABEL_MAX_LENGTH + 40);
    expect(sanitizeNestedLabel(long)).toHaveLength(NV_LABEL_MAX_LENGTH);
  });
});

describe("root templates", () => {
  it("round-trips a label", () => {
    const name = buildRootTemplateName("Acme Portfolio");
    expect(name).toBe("NV::root::Acme Portfolio");
    expect(parseNestedTemplateName(name)).toEqual({
      kind: "root",
      label: "Acme Portfolio",
    });
  });

  it("round-trips a label that contained the separator", () => {
    const name = buildRootTemplateName("A::B");
    expect(parseNestedTemplateName(name)).toEqual({
      kind: "root",
      label: "A--B",
    });
  });

  it("rejects an empty label", () => {
    expect(parseNestedTemplateName("NV::root::")).toBeNull();
  });
});

describe("child templates", () => {
  it("round-trips a parent vault id and label", () => {
    const name = buildChildTemplateName(PARENT, "Kitchen Remodel – 2024");
    expect(name).toBe(`NV::child::${PARENT}::Kitchen Remodel – 2024`);
    expect(parseNestedTemplateName(name)).toEqual({
      kind: "child",
      parentVaultId: PARENT,
      label: "Kitchen Remodel – 2024",
    });
  });

  it("keeps the parent id intact when the label had colons", () => {
    const name = buildChildTemplateName(PARENT, "Roof::Replacement");
    expect(parseNestedTemplateName(name)).toEqual({
      kind: "child",
      parentVaultId: PARENT,
      label: "Roof--Replacement",
    });
  });

  it("rejects a missing separator after the parent id", () => {
    expect(parseNestedTemplateName(`NV::child::${PARENT}`)).toBeNull();
  });

  it("rejects an empty parent id", () => {
    expect(parseNestedTemplateName("NV::child::::Q1")).toBeNull();
  });

  it("rejects an empty label", () => {
    expect(parseNestedTemplateName(`NV::child::${PARENT}::`)).toBeNull();
  });

  it("builds a search term that prefixes the full child name", () => {
    const term = childTemplateSearchTerm(PARENT);
    expect(buildChildTemplateName(PARENT, "Q1 Filings").startsWith(term)).toBe(
      true
    );
  });
});

describe("foreign templates are left alone", () => {
  it.each([
    "House Template",
    "",
    "NV::",
    "NV::sibling::x",
    "nv::root::lowercase prefix",
    "prefixed NV::root::not at the start",
  ])("parses %o as null", (name) => {
    expect(parseNestedTemplateName(name)).toBeNull();
  });

  it("is defensive about null and undefined", () => {
    expect(parseNestedTemplateName(null)).toBeNull();
    expect(parseNestedTemplateName(undefined)).toBeNull();
    expect(isNestedTemplateName(null)).toBe(false);
    expect(isNestedTemplateName(undefined)).toBe(false);
  });
});

describe("isNestedTemplateName", () => {
  it("flags anything carrying the prefix, even if unparseable", () => {
    // Deliberately broader than parseNestedTemplateName: a templates list
    // hides everything the feature may have authored, including malformed
    // leftovers, rather than leaking half-written plumbing into the UI.
    expect(isNestedTemplateName("NV::sibling::x")).toBe(true);
    expect(isNestedTemplateName("House Template")).toBe(false);
  });
});

describe("displayNameForTemplate", () => {
  it("unwraps our templates and passes others through", () => {
    expect(displayNameForTemplate(buildRootTemplateName("Acme"))).toBe("Acme");
    expect(
      displayNameForTemplate(buildChildTemplateName(PARENT, "Q1 Filings"))
    ).toBe("Q1 Filings");
    expect(displayNameForTemplate("House Template")).toBe("House Template");
  });
});
