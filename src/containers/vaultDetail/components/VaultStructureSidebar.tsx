import { projectVaultsSelectors } from "@/containers/projectVaults/selectors";
import { projectVaultsActions } from "@/containers/projectVaults/slice";
import {
  buildStructureNode,
  flattenRows,
  nextFocusKey,
  idsNeedingFetch,
  vaultRowKey,
  type StructureRowKey,
} from "@/containers/projectVaults/structure";
import { parseHomeFacts } from "@/shared/utils/homeFacts";
import { VaultDto } from "@/shared/types/vault";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ListTree, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { StructureTree } from "./StructureTree";

const nameOf = (vault: VaultDto): string =>
  parseHomeFacts(vault)?.address ?? vault.name ?? "Untitled";

/**
 * What opens the tree on a phone, where there is no room to dock it.
 *
 * It lives in the provenance bar rather than beside the page's own action:
 * this is navigation for the subject that bar describes, and putting it on the
 * right would have it competing with "Add record".
 */
export const StructureTrigger: React.FC<{
  isOpen: boolean;
  onOpen: () => void;
}> = ({ isOpen, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    aria-expanded={isOpen}
    aria-haspopup="dialog"
    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised px-3 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
  >
    <ListTree className="h-4 w-4" aria-hidden />
    Structure
  </button>
);

interface VaultStructureSidebarProps {
  vault: VaultDto;
  /** Root-first, excluding `vault`. Empty means `vault` is its own root. */
  ancestors: VaultDto[];
  /** The `asset_code` of the open section, when the route names one. */
  activeStreamCode?: string;
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
}

/**
 * The shape of a home, as navigation.
 *
 * Mounted by `VaultShell`, which is a layout route, so this survives every move
 * between the home, its sections and its projects — the expand state and the
 * discovery it has already paid for both stay put, which is the whole reason
 * the column is worth having over a block at the bottom of a page.
 *
 * It renders twice from one piece of state: docked at `md` and up, and inside
 * a drawer below it. Two instances rather than one moved around, because the
 * app already does exactly this with the two nav pills, and because a single
 * instance would have to be torn out of the layout to be re-parented.
 */
export const VaultStructureSidebar: React.FC<VaultStructureSidebarProps> = ({
  vault,
  ancestors,
  activeStreamCode,
  isDrawerOpen,
  onCloseDrawer,
}) => {
  const dispatch = useDispatch();
  const byParent = useSelector(projectVaultsSelectors.byParent);
  const reduceMotion = useReducedMotion();

  const root = ancestors[0] ?? vault;

  // Seeded, not filled by an effect. Starting empty and opening the path
  // afterwards means a fresh load renders a shut tree and then animates it
  // open, which reads as the whole column flying apart on arrival.
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set([...ancestors.map((a) => a.id), vault.id]),
  );

  // The node whose chevron was last clicked, and the only one allowed to
  // animate. A disclosure is a response to a gesture; a level opening because
  // its children just arrived from the network is not one, and animating it
  // makes the column move under the cursor while you are reading it.
  const [openedBy, setOpenedBy] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState<StructureRowKey>(() =>
    vaultRowKey(vault.id),
  );

  // Open the path down to wherever you are. Union only: it must never close
  // something the homeowner opened themselves just because they navigated.
  useEffect(() => {
    const path = [...ancestors.map((a) => a.id), vault.id];
    setExpanded((prev) => {
      if (path.every((id) => prev.has(id))) return prev;
      const next = new Set(prev);
      path.forEach((id) => next.add(id));
      return next;
    });
  }, [ancestors, vault.id]);

  // Keep the tab stop on the vault you are actually looking at. Arriving
  // somewhere also ends any gesture that was in flight, so a level opened by
  // the navigation itself cannot inherit the last click's animation.
  useEffect(() => {
    setFocusKey(vaultRowKey(vault.id));
    setOpenedBy(null);
  }, [vault.id]);

  const node = useMemo(
    () =>
      buildStructureNode({
        vault: root,
        label: nameOf(root),
        kind: "home",
        byParent,
        expanded,
      }),
    [root, byParent, expanded],
  );

  const rows = useMemo(() => flattenRows(node, expanded), [node, expanded]);

  // Only what is open *and* on screen. The expanded set is never pruned — it
  // has to outlive a navigation, which is the whole point — so after a move to
  // another home it still names nodes from the last one, and asking for their
  // children would be a request for something nobody is looking at.
  const openOnScreen = useMemo(
    () =>
      new Set(
        rows
          .filter((row) => row.kind === "vault" && expanded.has(row.vaultId))
          .map((row) => row.vaultId),
      ),
    [rows, expanded],
  );

  // One pass per change rather than a fetch inside each row: expanding a node
  // deep in the tree should ask for one level, and re-rooting should ask for
  // the levels the chain just revealed.
  useEffect(() => {
    idsNeedingFetch(openOnScreen, byParent).forEach((parentVaultId) =>
      dispatch(projectVaultsActions.fetchProjects({ parentVaultId })),
    );
  }, [openOnScreen, byParent, dispatch]);

  const toggle = useCallback((vaultId: string) => {
    setOpenedBy(vaultId);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(vaultId)) next.add(vaultId);
      return next;
    });
  }, []);

  const retry = useCallback(
    (parentVaultId: string) =>
      dispatch(projectVaultsActions.fetchProjects({ parentVaultId })),
    [dispatch],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent, key: StructureRowKey) => {
      const row = rows.find((entry) => entry.key === key);

      // Searched inside the tree the key was pressed in, not the document.
      // The docked column and the drawer render the same rows with the same
      // keys, so a document-wide lookup would always find the docked one —
      // which is hidden while the drawer is the thing being used.
      const moveTo = (direction: "ArrowUp" | "ArrowDown" | "Home" | "End") => {
        const target = nextFocusKey(rows, key, direction);
        if (!target) return;
        setFocusKey(target);
        event.currentTarget
          .closest('[role="tree"]')
          ?.querySelector<HTMLElement>(`[data-row-key="${target}"]`)
          ?.focus();
      };

      switch (event.key) {
        case "ArrowDown":
        case "ArrowUp":
        case "Home":
        case "End":
          event.preventDefault();
          moveTo(event.key);
          return;

        case "ArrowRight":
          if (row?.kind !== "vault") return;
          event.preventDefault();
          // Closed: open it. Already open: step into what it opened onto.
          if (expanded.has(row.vaultId)) moveTo("ArrowDown");
          else toggle(row.vaultId);
          return;

        case "ArrowLeft":
          event.preventDefault();
          // Open: close it. Otherwise fall back a row, which lands on the
          // parent for the first child and reads the same for the rest.
          if (row?.kind === "vault" && expanded.has(row.vaultId)) {
            toggle(row.vaultId);
          } else {
            moveTo("ArrowUp");
          }
          return;

        case "Enter":
        case " ":
          event.preventDefault();
          event.currentTarget.querySelector<HTMLElement>("a")?.click();
          return;

        default:
      }
    },
    [rows, expanded, toggle],
  );

  // One tree, two places to put it. The drawer's copy closes itself on the way
  // out; the docked one has nothing to close.
  const renderTree = (onNavigate?: () => void) => (
    <StructureTree
      root={node}
      activeVaultId={vault.id}
      activeStreamCode={activeStreamCode}
      expanded={expanded}
      focusKey={focusKey}
      onFocusRow={setFocusKey}
      onKeyDown={onKeyDown}
      onToggle={toggle}
      onRetry={retry}
      onNavigate={onNavigate}
      animatingVaultId={openedBy}
    />
  );

  return (
    <>
      {/* Docked. Not glass: it sits *in* the page, so it is a surface with a
          hairline, which is what the rest of the app's structure uses.
          `self-start` is load-bearing — a stretched grid item cannot stick. */}
      <aside className="sticky top-20 mt-8 hidden max-h-[calc(100svh-7rem)] flex-col self-start overflow-hidden rounded-xl border border-line bg-surface-raised md:flex">
        <p className="shrink-0 border-b border-line px-3 py-2.5 text-xs text-ink-subtle">
          Structure
        </p>
        {/* A plain scroller, not the Radix one. That primitive lays its
            viewport out as a table, which shrink-wraps to the longest label:
            rows then overflow sideways instead of truncating, and the column
            has nothing to scroll vertically because it is already as wide as
            its content. `min-w-0` keeps the truncation honest at every depth. */}
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {renderTree()}
        </div>
      </aside>

      <StructureDrawer
        isOpen={isDrawerOpen}
        onClose={onCloseDrawer}
        reduceMotion={!!reduceMotion}
      >
        {renderTree(onCloseDrawer)}
      </StructureDrawer>
    </>
  );
};

interface StructureDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reduceMotion: boolean;
  children: React.ReactNode;
}

/**
 * The same tree, over the page, on a phone.
 *
 * Hand-rolled rather than a dialog primitive, because that is what every other
 * overlay in this app is and pulling in a new one for this would be the odd
 * thing out. Glass is allowed here and not on the docked column: this floats.
 */
const StructureDrawer: React.FC<StructureDrawerProps> = ({
  isOpen,
  onClose,
  reduceMotion,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Whatever opened it gets focus back when it goes, so closing the drawer
    // leaves you on the trigger rather than at the top of the document.
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 md:hidden"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Structure"
            initial={reduceMotion ? { opacity: 0 } : { x: "-100%" }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { x: "-100%" }}
            transition={
              reduceMotion
                ? { duration: 0.15 }
                : { type: "spring", stiffness: 300, damping: 26 }
            }
            className="glass fixed inset-y-0 left-0 z-[60] flex w-[min(19rem,86vw)] flex-col rounded-r-xl md:hidden"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/40 px-3 py-2.5">
              <p className="text-sm font-medium text-ink">Structure</p>
              <button
                type="button"
                autoFocus
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-inset hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Clears the floating bottom nav pill and the home indicator, so
                the deepest row is never parked underneath either. */}
            <div className="min-h-0 flex-1 overflow-y-auto p-2 pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VaultStructureSidebar;
