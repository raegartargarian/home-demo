import { Skeleton } from "@/components/ui/skeleton";
import { DURATION, EASE_OUT, REDUCED } from "@/shared/constants/motion";
import {
  hasContent,
  sectionRowKey,
  vaultRowKey,
  type StructureNode,
  type StructureRowKey,
  type StructureSection,
} from "@/containers/projectVaults/structure";
import { cn } from "@/lib/utils";
import { streamDetailPath, vaultDetailPath } from "@/shared/constants/routes";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Home,
  Layers,
} from "lucide-react";
import React, { memo, useId } from "react";
import { NavLink } from "react-router-dom";

/** Where a row's contents start, by depth. Matches the reference app's tree. */
const indentFor = (depth: number) => 8 + depth * 16;

/** The app's disclosure timing, shared with every other reveal. */
const REVEAL = { duration: DURATION.reveal, ease: EASE_OUT };
/** For a level that opened because data arrived rather than because you asked. */
const INSTANT = { duration: 0 };

interface RowChromeProps {
  depth: number;
  /** Exactly one row in the tree is tabbable; the arrows move it. */
  isFocusRow: boolean;
  rowKey: StructureRowKey;
  onFocusRow: (key: StructureRowKey) => void;
  onKeyDown: (event: React.KeyboardEvent, key: StructureRowKey) => void;
  categoryCode?: string;
  isBusy?: boolean;
  ariaLevel: number;
  ariaExpanded?: boolean;
  isActive: boolean;
  controls?: string;
  children: React.ReactNode;
}

/**
 * The `li` every row shares: the indent, the tab stop and the tree semantics.
 *
 * `data-category` is set per row rather than inherited. The vault shell puts
 * the *open* section's category on its root, which repoints every `--cat-*`
 * variable beneath it — so without this the five sections in the sidebar would
 * all paint in whichever one you happened to have open.
 */
const RowChrome: React.FC<RowChromeProps> = ({
  depth,
  isFocusRow,
  rowKey,
  onFocusRow,
  onKeyDown,
  categoryCode,
  isBusy,
  ariaLevel,
  ariaExpanded,
  isActive,
  controls,
  children,
}) => (
  <li
    role="treeitem"
    aria-level={ariaLevel}
    aria-expanded={ariaExpanded}
    aria-current={isActive ? "page" : undefined}
    aria-owns={controls}
    aria-busy={isBusy || undefined}
    data-category={categoryCode}
    tabIndex={isFocusRow ? 0 : -1}
    // How the arrow keys find the row they are moving focus to.
    data-row-key={rowKey}
    onFocus={() => onFocusRow(rowKey)}
    onKeyDown={(event) => onKeyDown(event, rowKey)}
    style={{ paddingLeft: indentFor(depth) }}
    className="flex min-w-0 items-center gap-0.5 rounded-lg pt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    {children}
  </li>
);

/** Kept at the chevron's size so labels stay aligned whether or not one shows. */
const ChevronSlot: React.FC<{
  isExpanded: boolean;
  onToggle: () => void;
  show: boolean;
}> = ({ isExpanded, onToggle, show }) =>
  show ? (
    <button
      type="button"
      // The label navigates and the chevron discloses; neither does both, and
      // only the row is a tab stop, so this stays out of the tab order.
      tabIndex={-1}
      aria-hidden
      onClick={onToggle}
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ink-subtle transition-colors hover:bg-surface-inset hover:text-ink"
    >
      {isExpanded ? (
        <ChevronDown className="h-3 w-3" />
      ) : (
        <ChevronRight className="h-3 w-3" />
      )}
    </button>
  ) : (
    <span className="h-5 w-5 shrink-0" aria-hidden />
  );

const LABEL_BASE =
  "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors";

interface SectionRowProps {
  section: StructureSection;
  vaultId: string;
  depth: number;
  isActive: boolean;
  isFocusRow: boolean;
  onFocusRow: (key: StructureRowKey) => void;
  onKeyDown: (event: React.KeyboardEvent, key: StructureRowKey) => void;
  onNavigate?: () => void;
}

const SectionRow: React.FC<SectionRowProps> = ({
  section,
  vaultId,
  depth,
  isActive,
  isFocusRow,
  onFocusRow,
  onKeyDown,
  onNavigate,
}) => {
  const Icon = section.category?.icon ?? Layers;
  const rowKey = sectionRowKey(vaultId, section.streamId);

  return (
    <RowChrome
      depth={depth}
      rowKey={rowKey}
      isFocusRow={isFocusRow}
      onFocusRow={onFocusRow}
      onKeyDown={onKeyDown}
      categoryCode={section.categoryCode}
      ariaLevel={depth + 1}
      isActive={isActive}
    >
      <ChevronSlot isExpanded={false} onToggle={() => undefined} show={false} />
      {section.assetCode ? (
        <NavLink
          to={streamDetailPath(vaultId, section.assetCode)}
          tabIndex={-1}
          onClick={onNavigate}
          className={cn(
            LABEL_BASE,
            isActive
              ? "bg-cat-surface font-medium text-cat-ink"
              : "text-ink-muted hover:bg-surface-inset hover:text-ink",
          )}
        >
          <Icon
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              section.category ? "text-cat" : "text-ink-subtle",
            )}
            aria-hidden
          />
          <span className="truncate" title={section.label}>
            {section.label}
          </span>
        </NavLink>
      ) : (
        // No asset code means no URL to send anyone to. Shown rather than
        // hidden: a section that exists and cannot be opened is a fact.
        <span className={cn(LABEL_BASE, "text-ink-subtle")}>
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate" title={section.label}>
            {section.label}
          </span>
        </span>
      )}
    </RowChrome>
  );
};

interface StructureRowProps {
  node: StructureNode;
  activeVaultId: string;
  activeStreamCode?: string;
  expanded: ReadonlySet<string>;
  focusKey: StructureRowKey;
  onFocusRow: (key: StructureRowKey) => void;
  onKeyDown: (event: React.KeyboardEvent, key: StructureRowKey) => void;
  onToggle: (vaultId: string) => void;
  onRetry: (vaultId: string) => void;
  onNavigate?: () => void;
  /** The one node allowed to animate: the one whose chevron was just clicked. */
  animatingVaultId: string | null;
}

/**
 * One vault and, when it is open, its sections and the vaults under it.
 *
 * Recursive and depth-agnostic on purpose: the encoding in `naming.ts` links a
 * vault to a parent vault, not to a level, so nothing here should assume a
 * project cannot itself hold projects. Nothing *offers* to make one — that
 * stays the home page's action — but data that already goes deeper draws.
 */
const StructureRowItem: React.FC<StructureRowProps> = ({
  node,
  activeVaultId,
  activeStreamCode,
  expanded,
  focusKey,
  onFocusRow,
  onKeyDown,
  onToggle,
  onRetry,
  onNavigate,
  animatingVaultId,
}) => {
  const reduceMotion = useReducedMotion();
  const groupId = useId();

  const isExpanded = expanded.has(node.vaultId);
  const isActiveVault = node.vaultId === activeVaultId;
  // The vault row is current only when no section under it is.
  const isActive = isActiveVault && !activeStreamCode;
  const rowKey = vaultRowKey(node.vaultId);
  const VaultIcon = node.kind === "home" ? Home : FolderKanban;

  return (
    <>
      <RowChrome
        depth={node.depth}
        rowKey={rowKey}
        isFocusRow={focusKey === rowKey}
        onFocusRow={onFocusRow}
        onKeyDown={onKeyDown}
        ariaLevel={node.depth + 1}
        ariaExpanded={hasContent(node) ? isExpanded : undefined}
        isActive={isActive}
        isBusy={node.isLoadingChildren}
        controls={isExpanded ? groupId : undefined}
      >
        <ChevronSlot
          show={hasContent(node)}
          isExpanded={isExpanded}
          onToggle={() => onToggle(node.vaultId)}
        />
        <NavLink
          to={vaultDetailPath(node.vaultId)}
          end
          tabIndex={-1}
          onClick={onNavigate}
          className={cn(
            LABEL_BASE,
            isActive
              ? "bg-surface-inset font-medium text-ink"
              : "text-ink-muted hover:bg-surface-inset hover:text-ink",
          )}
        >
          <VaultIcon
            className="h-3.5 w-3.5 shrink-0 text-ink-subtle"
            aria-hidden
          />
          <span className="truncate" title={node.label}>
            {node.label}
          </span>
        </NavLink>
      </RowChrome>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.li
            key="group"
            // Not a tree row itself, only the box the disclosure animates.
            // `role="none"` keeps it out of the tree's child list, and the
            // group inside is tied back to its row with `aria-owns`.
            role="none"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={
              animatingVaultId !== node.vaultId
                ? INSTANT
                : reduceMotion
                  ? REDUCED
                  : REVEAL
            }
            className="overflow-hidden"
          >
            <ul role="group" id={groupId} className="min-w-0">
              {node.sections.map((section) => (
                <SectionRow
                  key={section.streamId}
                  section={section}
                  vaultId={node.vaultId}
                  depth={node.depth + 1}
                  isActive={
                    isActiveVault && section.assetCode === activeStreamCode
                  }
                  isFocusRow={
                    focusKey === sectionRowKey(node.vaultId, section.streamId)
                  }
                  onFocusRow={onFocusRow}
                  onKeyDown={onKeyDown}
                  onNavigate={onNavigate}
                />
              ))}

              {node.children.map((child) => (
                <StructureRow
                  key={child.vaultId}
                  node={child}
                  activeVaultId={activeVaultId}
                  activeStreamCode={activeStreamCode}
                  expanded={expanded}
                  focusKey={focusKey}
                  onFocusRow={onFocusRow}
                  onKeyDown={onKeyDown}
                  onToggle={onToggle}
                  onRetry={onRetry}
                  onNavigate={onNavigate}
                  animatingVaultId={animatingVaultId}
                />
              ))}

              {node.isLoadingChildren && (
                <ChildSkeleton depth={node.depth + 1} />
              )}

              {node.childError && (
                <ChildError
                  depth={node.depth + 1}
                  onRetry={() => onRetry(node.vaultId)}
                />
              )}
            </ul>
          </motion.li>
        )}
      </AnimatePresence>
    </>
  );
};

/** Memoised: a deep tree re-renders on every keystroke of the roving focus. */
const StructureRow = memo(StructureRowItem);

/** Three bars, as the reference app's sidebar does, in this app's tokens. */
const ChildSkeleton: React.FC<{ depth: number }> = ({ depth }) => (
  <li
    role="none"
    aria-hidden
    className="space-y-1.5 py-1.5 pr-2"
    style={{ paddingLeft: indentFor(depth) + 20 }}
  >
    {["w-32", "w-24", "w-28"].map((width) => (
      <Skeleton
        key={width}
        className={cn("h-4 rounded-lg bg-surface-inset", width)}
      />
    ))}
  </li>
);

/**
 * A node whose children could not be fetched.
 *
 * The reference app's sidebar has no error branch because its one global fetch
 * fails upstream where the page can say so. Here discovery is per node, so a
 * failure has nowhere else to surface, and nothing retries it on its own — a
 * tree that retried on render would be a request loop.
 */
const ChildError: React.FC<{ depth: number; onRetry: () => void }> = ({
  depth,
  onRetry,
}) => (
  <li
    role="none"
    className="flex items-center gap-2 py-1.5 pr-2 text-xs text-alert"
    style={{ paddingLeft: indentFor(depth) + 20 }}
  >
    <span className="min-w-0 flex-1 truncate">Could not load projects</span>
    <button
      type="button"
      onClick={onRetry}
      className="shrink-0 text-ink-muted underline underline-offset-2 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      Try again
    </button>
  </li>
);

interface StructureTreeProps {
  root: StructureNode;
  activeVaultId: string;
  activeStreamCode?: string;
  expanded: ReadonlySet<string>;
  focusKey: StructureRowKey;
  onFocusRow: (key: StructureRowKey) => void;
  onKeyDown: (event: React.KeyboardEvent, key: StructureRowKey) => void;
  onToggle: (vaultId: string) => void;
  onRetry: (vaultId: string) => void;
  /** Called on any navigation, so the mobile drawer can close behind it. */
  onNavigate?: () => void;
  /** The one node allowed to animate: the one whose chevron was just clicked. */
  animatingVaultId: string | null;
}

export const StructureTree: React.FC<StructureTreeProps> = ({
  root,
  ...rest
}) => {
  const isBare =
    root.sections.length === 0 &&
    root.children.length === 0 &&
    root.hasLoadedChildren;

  if (isBare) {
    return (
      <p className="rounded-lg border border-dashed border-line bg-surface-sunken p-3 text-xs text-ink-subtle">
        Nothing under this home yet.
      </p>
    );
  }

  return (
    <ul role="tree" aria-label="Structure" className="min-w-0 pr-1">
      <StructureRow node={root} {...rest} />
    </ul>
  );
};

export default StructureTree;
