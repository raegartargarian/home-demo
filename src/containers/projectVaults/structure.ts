/**
 * The shape of a home: what the structure sidebar draws.
 *
 * `naming.ts` says how a vault is linked to its parent; this says what that
 * chain looks like once it is on screen. A node is a vault, its five sections,
 * and the vaults filed under it — the same recursion at every level, because
 * the backend has no notion of depth and neither should this.
 *
 * The reference app builds a *forest* instead: one eager fetch of every
 * `NV::` template and every vault behind them, assembled client-side. Two
 * reasons not to do that here. Discovery is a paged template scan per parent
 * (see `api.ts`), so hydrating a whole tree up front is expensive in a way that
 * grows with the account; and its builder only ever looks up roots as parents,
 * which quietly turns a grandchild into an orphan. Reading straight off the
 * per-parent store instead makes the lazy fetch and the arbitrary depth fall
 * out for free: a node has the children the store happens to hold for it, and
 * expanding one is what asks for the next level.
 *
 * Every function here is pure — no store, no API, no React — so the shape can
 * be tested on its own.
 */

import { SectionAccent, StreamCategory } from "@/shared/constants/streams";
import { VaultDto, VaultStreamDto } from "@/shared/types/vault";
import { formatStreamName, sortedSections } from "@/shared/utils/streamHelpers";
import type { ParentProjects } from "./types";

/**
 * How deep the tree will draw.
 *
 * Matches the ancestor walk's cap in `vaultDetail/saga.ts`: past this, a chain
 * is a mistake rather than a very organised homeowner, and the cap is what
 * keeps a malformed one from expanding forever.
 */
export const MAX_STRUCTURE_DEPTH = 8;

/** One of the five sections, as a row. */
export interface StructureSection {
  streamId: string;
  /** What the section's URL is built from; absent means it is not reachable. */
  assetCode?: string;
  label: string;
  /** Drives the row's own `data-category`, so each section keeps its accent. */
  categoryCode?: SectionAccent;
  category: StreamCategory | null;
}

/** One vault, and everything currently known to sit under it. */
export interface StructureNode {
  vaultId: string;
  label: string;
  /** A home is the top of its own tree; everything below it is a project. */
  kind: "home" | "project";
  depth: number;
  sections: StructureSection[];
  /** Populated only where the node is expanded *and* its children have landed. */
  children: StructureNode[];
  isLoadingChildren: boolean;
  childError: string | null;
  hasLoadedChildren: boolean;
}

/** What the store holds per parent, keyed by parent vault id. */
export type ProjectsByParent = Record<string, ParentProjects>;

const toSection = ({
  stream,
  category,
}: {
  stream: VaultStreamDto;
  category: StreamCategory | null;
}): StructureSection => ({
  streamId: stream.id,
  assetCode: stream.asset_code,
  label: category?.label ?? formatStreamName(stream),
  categoryCode: category?.code,
  category,
});

/** The sections of one vault, in the reading order the page uses. */
const sectionsOf = (vault: VaultDto): StructureSection[] =>
  sortedSections(vault.streams ?? []).map(toSection);

interface BuildArgs {
  vault: VaultDto;
  label: string;
  kind: "home" | "project";
  byParent: ProjectsByParent;
  expanded: ReadonlySet<string>;
  depth?: number;
  /** Ids already on this branch, so a template edited into a loop terminates. */
  seen?: ReadonlySet<string>;
}

const NOT_LOADED: ParentProjects = {
  projects: [],
  isLoading: false,
  error: null,
  hasLoaded: false,
};

/**
 * One node and, where it is open and loaded, everything under it.
 *
 * Children are omitted while the node is collapsed. That is not an
 * optimisation: a collapsed node is not asking for its children, and building
 * them anyway is what would make the tree hydrate itself all the way down.
 */
export const buildStructureNode = ({
  vault,
  label,
  kind,
  byParent,
  expanded,
  depth = 0,
  seen = new Set<string>(),
}: BuildArgs): StructureNode => {
  const state = byParent[vault.id] ?? NOT_LOADED;
  const isOpen = expanded.has(vault.id);
  const canRecurse = isOpen && depth < MAX_STRUCTURE_DEPTH - 1;
  const branch = new Set(seen).add(vault.id);

  return {
    vaultId: vault.id,
    label,
    kind,
    depth,
    sections: sectionsOf(vault),
    children: canRecurse
      ? state.projects
          .filter((project) => !branch.has(project.id))
          .map((project) =>
            buildStructureNode({
              vault: project.vault,
              label: project.label,
              kind: "project",
              byParent,
              expanded,
              depth: depth + 1,
              seen: branch,
            }),
          )
      : [],
    isLoadingChildren: isOpen && state.isLoading,
    childError: isOpen ? state.error : null,
    hasLoadedChildren: state.hasLoaded,
  };
};

/** A row's identity, stable across renders — the roving tab stop is keyed on it. */
export type StructureRowKey = string;

export const vaultRowKey = (vaultId: string): StructureRowKey => `v:${vaultId}`;
export const sectionRowKey = (
  vaultId: string,
  streamId: string,
): StructureRowKey => `s:${vaultId}:${streamId}`;

export interface StructureRow {
  key: StructureRowKey;
  kind: "vault" | "section";
  vaultId: string;
  depth: number;
}

/**
 * Every row on screen, top to bottom — a node, then its sections, then its
 * children, which is the order `StructureTree` draws them in.
 *
 * The arrow keys move through what is *visible*, which is a flat list, while
 * the tree is drawn from a nested one. This is the bridge between the two.
 */
export const flattenRows = (
  node: StructureNode,
  expanded: ReadonlySet<string>,
): StructureRow[] => {
  const rows: StructureRow[] = [
    {
      key: vaultRowKey(node.vaultId),
      kind: "vault",
      vaultId: node.vaultId,
      depth: node.depth,
    },
  ];

  if (!expanded.has(node.vaultId)) return rows;

  for (const section of node.sections) {
    rows.push({
      key: sectionRowKey(node.vaultId, section.streamId),
      kind: "section",
      vaultId: node.vaultId,
      depth: node.depth + 1,
    });
  }
  for (const child of node.children) {
    rows.push(...flattenRows(child, expanded));
  }

  return rows;
};

/** Whether a node has anything to disclose — what decides chevron or spacer. */
export const hasContent = (node: StructureNode): boolean =>
  node.sections.length > 0 ||
  node.children.length > 0 ||
  node.isLoadingChildren ||
  node.childError !== null ||
  // Unopened and never asked: assume there may be something rather than
  // showing a leaf that turns out to have children the moment it is opened.
  !node.hasLoadedChildren;

/**
 * Where focus goes next.
 *
 * Returns null when the key would run off either end, so the caller can leave
 * focus where it is rather than wrapping — a tree that wraps loses you.
 */
export const nextFocusKey = (
  rows: StructureRow[],
  current: StructureRowKey,
  key: "ArrowUp" | "ArrowDown" | "Home" | "End",
): StructureRowKey | null => {
  if (rows.length === 0) return null;
  if (key === "Home") return rows[0].key;
  if (key === "End") return rows[rows.length - 1].key;

  const index = rows.findIndex((row) => row.key === current);
  if (index === -1) return rows[0].key;

  const target = key === "ArrowDown" ? index + 1 : index - 1;
  return rows[target]?.key ?? null;
};

/**
 * The expanded nodes whose children nobody has gone to get yet.
 *
 * A node that failed is deliberately not included: a tree that retries a failed
 * discovery on every render is a request loop, so the retry is the homeowner's
 * to ask for.
 */
export const idsNeedingFetch = (
  expanded: ReadonlySet<string>,
  byParent: ProjectsByParent,
): string[] =>
  [...expanded].filter((id) => {
    const state = byParent[id];
    if (!state) return true;
    return !state.hasLoaded && !state.isLoading && state.error === null;
  });
