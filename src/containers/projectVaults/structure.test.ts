import { describe, expect, it } from "vitest";

import { VaultDto } from "@/shared/types/vault";
import {
  buildStructureNode,
  flattenRows,
  hasContent,
  idsNeedingFetch,
  MAX_STRUCTURE_DEPTH,
  nextFocusKey,
  sectionRowKey,
  vaultRowKey,
  type ProjectsByParent,
} from "./structure";
import type { ParentProjects, ProjectVault } from "./types";

const vault = (id: string, streamCodes: string[] = []): VaultDto => ({
  id,
  name: `Vault ${id}`,
  created_at: "2026-01-01T00:00:00Z",
  status: "COMPLETED",
  streams: streamCodes.map((code, index) => ({
    id: `${id}-${code}`,
    asset_code: `${code}-code`,
    mapping: code,
    created_at: `2026-01-0${index + 1}T00:00:00Z`,
  })),
});

const project = (
  id: string,
  label: string,
  streams: string[] = [],
): ProjectVault => ({
  id,
  label,
  templateId: `tpl-${id}`,
  vault: vault(id, streams),
});

const loaded = (projects: ProjectVault[]): ParentProjects => ({
  projects,
  isLoading: false,
  error: null,
  hasLoaded: true,
});

const build = (
  root: VaultDto,
  byParent: ProjectsByParent,
  expanded: string[],
) =>
  buildStructureNode({
    vault: root,
    label: "Home",
    kind: "home",
    byParent,
    expanded: new Set(expanded),
  });

describe("buildStructureNode", () => {
  it("draws a project under a project under a home", () => {
    const home = vault("home");
    const byParent: ProjectsByParent = {
      home: loaded([project("kitchen", "Kitchen Remodel")]),
      kitchen: loaded([project("cabinets", "Cabinets")]),
    };

    const node = build(home, byParent, ["home", "kitchen"]);

    expect(node.children.map((child) => child.label)).toEqual([
      "Kitchen Remodel",
    ]);
    expect(node.children[0].children.map((child) => child.label)).toEqual([
      "Cabinets",
    ]);
    expect(node.children[0].children[0].depth).toBe(2);
  });

  it("calls the root a home and everything under it a project", () => {
    const byParent: ProjectsByParent = { home: loaded([project("p", "P")]) };
    const node = build(vault("home"), byParent, ["home"]);

    expect(node.kind).toBe("home");
    expect(node.children[0].kind).toBe("project");
  });

  it("omits the children of a collapsed node", () => {
    const byParent: ProjectsByParent = { home: loaded([project("p", "P")]) };

    expect(build(vault("home"), byParent, []).children).toEqual([]);
  });

  it("omits children nobody has fetched yet", () => {
    const node = build(vault("home"), {}, ["home"]);

    expect(node.children).toEqual([]);
    expect(node.hasLoadedChildren).toBe(false);
  });

  it("terminates when a template points back up its own branch", () => {
    const byParent: ProjectsByParent = {
      home: loaded([project("kitchen", "Kitchen")]),
      // Malformed: the child claims the home as its own child.
      kitchen: loaded([project("home", "Home again")]),
    };

    const node = build(vault("home"), byParent, ["home", "kitchen"]);

    expect(node.children[0].children).toEqual([]);
  });

  it("stops at the depth cap", () => {
    // A chain far longer than the cap: 0 -> 1 -> 2 -> ...
    const chain = Array.from(
      { length: MAX_STRUCTURE_DEPTH + 4 },
      (_, i) => `v${i}`,
    );
    const byParent: ProjectsByParent = Object.fromEntries(
      chain
        .slice(0, -1)
        .map((id, i) => [id, loaded([project(chain[i + 1], chain[i + 1])])]),
    );

    let node = build(vault("v0"), byParent, chain);
    let depth = 0;
    while (node.children.length > 0) {
      node = node.children[0];
      depth += 1;
    }

    expect(depth).toBe(MAX_STRUCTURE_DEPTH - 1);
  });

  it("sorts sections into reading order and puts an outsider last", () => {
    const home = vault("home", [
      "personal-vault",
      "not-a-section",
      "home-profile",
    ]);

    expect(build(home, {}, ["home"]).sections.map((s) => s.label)).toEqual([
      "Home Profile",
      "My Personal Home Info",
      "Not A Section",
    ]);
  });

  it("carries a section's own category code, for its own accent", () => {
    const node = build(vault("home", ["property-records"]), {}, ["home"]);

    expect(node.sections[0].categoryCode).toBe("property-records");
  });

  it("reports loading and errors only for the node they belong to", () => {
    const byParent: ProjectsByParent = {
      home: { projects: [], isLoading: true, error: null, hasLoaded: false },
      other: {
        projects: [],
        isLoading: false,
        error: "nope",
        hasLoaded: false,
      },
    };

    const node = build(vault("home"), byParent, ["home"]);

    expect(node.isLoadingChildren).toBe(true);
    expect(node.childError).toBeNull();
  });

  it("keeps a collapsed node quiet about its own error", () => {
    const byParent: ProjectsByParent = {
      home: { projects: [], isLoading: true, error: "nope", hasLoaded: false },
    };

    const node = build(vault("home"), byParent, []);

    expect(node.isLoadingChildren).toBe(false);
    expect(node.childError).toBeNull();
  });
});

describe("flattenRows", () => {
  it("lists a node, then its sections, then its children", () => {
    const home = vault("home", ["home-profile"]);
    const byParent: ProjectsByParent = {
      home: loaded([project("kitchen", "Kitchen")]),
    };
    const expanded = new Set(["home"]);

    const rows = flattenRows(build(home, byParent, [...expanded]), expanded);

    expect(rows.map((row) => row.key)).toEqual([
      vaultRowKey("home"),
      sectionRowKey("home", "home-home-profile"),
      vaultRowKey("kitchen"),
    ]);
  });

  it("stops at a collapsed node", () => {
    const home = vault("home", ["home-profile"]);

    expect(flattenRows(build(home, {}, []), new Set())).toHaveLength(1);
  });
});

describe("nextFocusKey", () => {
  const rows = flattenRows(
    build(vault("home", ["home-profile"]), {}, ["home"]),
    new Set(["home"]),
  );

  it("moves down and back up", () => {
    expect(nextFocusKey(rows, rows[0].key, "ArrowDown")).toBe(rows[1].key);
    expect(nextFocusKey(rows, rows[1].key, "ArrowUp")).toBe(rows[0].key);
  });

  it("stops rather than wrapping at either end", () => {
    expect(nextFocusKey(rows, rows[0].key, "ArrowUp")).toBeNull();
    expect(
      nextFocusKey(rows, rows[rows.length - 1].key, "ArrowDown"),
    ).toBeNull();
  });

  it("jumps to the ends", () => {
    expect(nextFocusKey(rows, rows[1].key, "Home")).toBe(rows[0].key);
    expect(nextFocusKey(rows, rows[0].key, "End")).toBe(
      rows[rows.length - 1].key,
    );
  });

  it("falls back to the first row when the current one is gone", () => {
    expect(nextFocusKey(rows, "v:vanished", "ArrowDown")).toBe(rows[0].key);
  });
});

describe("hasContent", () => {
  it("assumes a node nobody has asked about may have something", () => {
    expect(hasContent(build(vault("bare"), {}, []))).toBe(true);
  });

  it("is false for a loaded node with no sections and no children", () => {
    expect(
      hasContent(build(vault("bare"), { bare: loaded([]) }, ["bare"])),
    ).toBe(false);
  });
});

describe("idsNeedingFetch", () => {
  const expanded = new Set(["fresh", "loading", "loaded", "failed"]);
  const byParent: ProjectsByParent = {
    loading: { projects: [], isLoading: true, error: null, hasLoaded: false },
    loaded: loaded([]),
    failed: { projects: [], isLoading: false, error: "nope", hasLoaded: false },
  };

  it("asks only for what nobody has gone to get", () => {
    expect(idsNeedingFetch(expanded, byParent)).toEqual(["fresh"]);
  });

  it("never retries a failure on its own", () => {
    expect(idsNeedingFetch(new Set(["failed"]), byParent)).toEqual([]);
  });
});
