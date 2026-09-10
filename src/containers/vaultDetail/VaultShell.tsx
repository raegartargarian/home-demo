import { Button } from "@/components/ui/button";
import { useWeb3Auth } from "@/containers/global/Web3AuthProvider";
import { uploadSelectors } from "@/containers/upload/selectors";
import { uploadActions } from "@/containers/upload/slice";
import { uploadTargetFor } from "@/containers/upload/target";
import { Chip } from "@/shared/components/Chip";
import {
  measureFor,
  type PageMeasure,
} from "@/shared/components/PageContainer";
import { PropertyHero } from "@/shared/components/PropertyHero";
import { ProvenanceDetails } from "@/shared/components/ProvenanceDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { TransferBadge } from "@/shared/components/TransferBadge";
import {
  appRoutes,
  BROWSE_ALL_HOMES,
  vaultDetailPath,
} from "@/shared/constants/routes";
import { PROJECT_VAULTS_ENABLED } from "@/shared/constants/projectVaults";
import { projectVaultsSelectors } from "@/containers/projectVaults/selectors";
import { projectVaultsActions } from "@/containers/projectVaults/slice";
import { cn } from "@/lib/utils";
import { generateVaultProofPdf } from "./components/generateVaultProofPdf";
import {
  StructureTrigger,
  VaultStructureSidebar,
} from "./components/VaultStructureSidebar";
import { parseHomeFacts } from "@/shared/utils/homeFacts";
import { VaultDto } from "@/shared/types/vault";
import {
  getLedgerNameFromServerName,
  NETWORK_SERVER_NAMES,
} from "@/shared/utils/networks";
import { getStatusConfig } from "@/shared/utils/statusConfig";
import {
  categoryForStream,
  formatStreamName,
} from "@/shared/utils/streamHelpers";
import { viewTXInExplorer } from "@/shared/utils/viewVaultInExplorer";
import {
  Download,
  ExternalLink,
  FolderKanban,
  FolderPlus,
  Layers,
  Loader2,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useParams } from "react-router-dom";
import { vaultDetailSelectors } from "./selectors";
import type { VaultContext } from "./vaultContext";
import { vaultDetailActions } from "./slice";

/**
 * Everything a vault's pages share, mounted once.
 *
 * The vault page and its five section pages are the same house: the same
 * photograph, the same way out, the same provenance treatment. They used to be
 * two independent routes that each built that for themselves, which cost twice
 * — the header was rebuilt on every click, so the photograph visibly reloaded
 * when you opened a section, and the two copies had already drifted into
 * rendering "Verified" and "Completed" twice on the section page.
 *
 * As a layout route the header is *kept* across the navigation. React Router
 * swaps only the `Outlet` beneath it, so the `<img>` is never unmounted and
 * there is nothing to reload — moving between sections changes the headline and
 * the records, and the house stays put.
 *
 * It also puts the whole header in one place. Which facts a page proves and
 * which action it offers depend on whether a section is open, and that decision
 * is now a single branch here rather than two headers to keep in step.
 */
const VaultShell = () => {
  const { id, code } = useParams<{ id: string; code?: string }>();
  const dispatch = useDispatch();
  const vault = useSelector(vaultDetailSelectors.vault);
  const parent = useSelector(vaultDetailSelectors.parent);
  const ancestors = useSelector(vaultDetailSelectors.ancestors);
  const isLoading = useSelector(vaultDetailSelectors.isLoading);
  const isFiling = useSelector(uploadSelectors.isFiling);
  const projectCreation = useSelector(projectVaultsSelectors.creation);
  const { isAuthenticated } = useWeb3Auth() || {};
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isStructureOpen, setIsStructureOpen] = useState(false);

  // The vault the structure column is drawn from, which is not always the one
  // being fetched. `fetchVaultDetailStart` clears the store so the previous
  // house cannot flash under the new heading — right for the hero, wrong for
  // the column, which is navigation: it would be torn down on the way to the
  // very page it was used to reach, losing what is expanded and re-running
  // every discovery underneath it. Held as a pair so a half-resolved chain
  // cannot re-root the tree mid-navigation.
  const [shown, setShown] = useState<{
    vault: VaultDto;
    ancestors: VaultDto[];
  } | null>(null);
  useEffect(() => {
    if (vault) setShown({ vault, ancestors });
  }, [vault, ancestors]);

  // One measure for every page under the vault, so the well does not shift
  // width underneath you on the way into a section.
  const measure: PageMeasure = "wide";

  // The structure column divides that well in two. Behind the same flag as the
  // projects themselves: with nothing nested to show, a tree of one home and
  // its five sections is chrome that earns nothing.
  const showStructure = PROJECT_VAULTS_ENABLED;
  const wellClass = `mx-auto w-full px-4 ${measureFor(measure)}`;
  const gridClass = cn(
    showStructure &&
      "md:grid md:grid-cols-[16rem_minmax(0,1fr)] md:gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-8",
  );

  // Guarded by what has been asked for, not by what has arrived. `fetchStart`
  // clears the vault so the previous one cannot flash under the new heading —
  // which changes `vault?.id` from the old id to undefined, re-runs this, and
  // fires a second identical request that `takeLatest` then throws away. The
  // ref is per-mount, so a failed load still retries on the next visit.
  const requestedId = useRef<string | null>(null);
  useEffect(() => {
    if (!id || vault?.id === id || requestedId.current === id) return;
    requestedId.current = id;
    dispatch(vaultDetailActions.fetchVaultDetailStart({ id }));
  }, [id, vault?.id, dispatch]);

  const facts = useMemo(() => (vault ? parseHomeFacts(vault) : null), [vault]);
  // A project is named by its parent: the way out goes to the home, and the
  // home is what the project is "of".
  const parentAddress = useMemo(
    () => (parent ? (parseHomeFacts(parent)?.address ?? parent.name) : null),
    [parent],
  );
  const stream = useMemo(
    () => vault?.streams?.find((entry) => entry.asset_code === code) ?? null,
    [vault?.streams, code],
  );
  const category = useMemo(
    () => (stream ? categoryForStream(stream) : null),
    [stream],
  );

  // The section is the subject when one is open; otherwise the house is —
  // or the project, which is a smaller house with a home to go back to.
  const subject = stream
    ? {
        title: category?.label ?? formatStreamName(stream),
        subtitle: category?.description ?? stream.description,
        icon: category?.icon ?? Layers,
        backTo: id ? vaultDetailPath(id) : appRoutes.vaults.path,
        backLabel: facts?.address ?? vault?.name ?? "Back to the vault",
        backState: undefined,
        // A section's facts are the house's, and repeating them under a
        // section's name reads as the house interrupting.
        facts: null,
        txHash: stream.tx_hash,
        ledger: stream.ledger,
        createdAt: stream.created_at,
        createdLabel: "Created",
        status: stream.status,
      }
    : parent && parentAddress
      ? {
          title: vault?.name ?? "",
          subtitle: `A project of ${parentAddress}`,
          icon: FolderKanban,
          backTo: vaultDetailPath(parent.id),
          backLabel: parentAddress,
          backState: undefined,
          // The facts are the home's; under a project's name they would be the
          // house interrupting, exactly as under a section's.
          facts: null,
          txHash: vault?.tx_hash,
          ledger: vault?.ledger,
          createdAt: vault?.created_at,
          createdLabel: "Started",
          status: vault?.status,
        }
      : {
          title: facts?.address ?? vault?.name ?? "",
          subtitle: undefined,
          icon: undefined,
          backTo: appRoutes.vaults.path,
          backLabel: "All homes",
          // "All homes" means the list, even when there is one of them.
          backState: BROWSE_ALL_HOMES,
          facts,
          txHash: vault?.tx_hash,
          ledger: vault?.ledger,
          createdAt: vault?.created_at,
          createdLabel: "Registered",
          status: vault?.status,
        };

  const status = subject.status ? getStatusConfig(subject.status) : null;

  // Filing into the open section when there is one, and into the vault
  // otherwise — the modal then asks which section it belongs in.
  const uploadTarget = useMemo(() => {
    if (!isAuthenticated || !vault) return null;
    if (stream) return uploadTargetFor(vault.id, stream, vault.ledger);
    return { vaultId: vault.id, ledger: vault.ledger || "" };
  }, [isAuthenticated, vault, stream]);

  // Starting a project belongs to the home, and only on the home's own page:
  // under an open section it would mean something else, and under a project it
  // would nest a job inside a job. The same conditions the Projects block puts
  // on its own card — this is the second way into that one modal, put where
  // the page's other action already is rather than at the foot of the grid.
  const canStartProject =
    PROJECT_VAULTS_ENABLED &&
    isAuthenticated &&
    !stream &&
    ancestors.length === 0;
  const isCreatingProject = projectCreation?.status === "running";

  const handleDownloadProof = async () => {
    if (!vault || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await generateVaultProofPdf(vault);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const structure = showStructure ? (
    shown ? (
      <VaultStructureSidebar
        vault={shown.vault}
        ancestors={shown.ancestors}
        activeStreamCode={stream?.asset_code}
        isDrawerOpen={isStructureOpen}
        onCloseDrawer={() => setIsStructureOpen(false)}
      />
    ) : (
      <Skeleton className="mt-8 hidden h-64 w-full rounded-xl bg-surface-inset md:block" />
    )
  ) : null;

  if (isLoading || !vault) {
    return (
      // Deliberately the same shape as the resolved page, down to the order of
      // the elements: the structure column is the same component in the same
      // slot, so React keeps it mounted straight through the navigation.
      <div className="min-h-screen bg-surface-sunken">
        {/* Shaped like what is coming — a skeleton that does not match the
            layout it precedes makes the page jump when it resolves. */}
        <Skeleton className="h-[min(52svh,420px)] w-full rounded-none bg-surface-inset" />
        <div className={wellClass}>
          <div className={gridClass}>
            {structure}
            <div className="min-w-0 py-8">
              <Skeleton className="mb-5 h-6 w-48 bg-surface-inset" />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-80 w-full rounded-xl bg-surface-inset"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    /* Repoints the --cat-* variables for whichever section is open, so the
       accent follows the page without a single conditional className. */
    <div data-category={category?.code} className="min-h-screen bg-surface">
      <PropertyHero
        vault={vault}
        title={subject.title}
        subtitle={subject.subtitle}
        icon={subject.icon}
        backTo={subject.backTo}
        backLabel={subject.backLabel}
        backState={subject.backState}
        facts={subject.facts}
        innerClassName={measureFor(measure)}
      />

      {/* One bar, for whichever subject is open: what it is, whether it is
          proved, and the one thing you came here to do. */}
      <div className="border-b border-line bg-surface-raised">
        <div className={`${wellClass} py-3`}>
          <ProvenanceDetails
            txHash={subject.txHash}
            ledger={subject.ledger}
            createdAt={subject.createdAt}
            createdLabel={subject.createdLabel}
            leading={
              showStructure && (
                <StructureTrigger
                  isOpen={isStructureOpen}
                  onOpen={() => setIsStructureOpen(true)}
                />
              )
            }
            rows={[
              ...(stream?.asset_code
                ? [
                    {
                      label: "Stream",
                      value: stream.asset_code,
                      copyable: true,
                    },
                  ]
                : []),
              // Chips rather than words: what a section does at sale and what
              // state it is in are both facts that carry a colour, and losing
              // that to fit a definition list would be a downgrade.
              ...(category
                ? [
                    {
                      label: "At sale",
                      value: (
                        <TransferBadge
                          transfersOnSale={category.transfersOnSale}
                        />
                      ),
                    },
                  ]
                : []),
              ...(status
                ? [
                    {
                      label: "Status",
                      value: <Chip label={status.label} tone={status.tone} />,
                    },
                  ]
                : []),
            ]}
            actions={
              (canStartProject || uploadTarget) && (
                <>
                  {canStartProject && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isCreatingProject}
                      onClick={() =>
                        dispatch(projectVaultsActions.openCreateModal(vault.id))
                      }
                    >
                      <FolderPlus />
                      New project
                    </Button>
                  )}
                  {uploadTarget && (
                    <Button
                      size="sm"
                      disabled={isFiling}
                      onClick={() =>
                        dispatch(uploadActions.openUpload(uploadTarget))
                      }
                    >
                      <Plus />
                      Add record
                    </Button>
                  )}
                </>
              )
            }
            detailActions={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadProof}
                  disabled={isGeneratingPdf}
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Download />
                  )}
                  {isGeneratingPdf ? "Generating..." : "Download Proof"}
                </Button>
                {subject.txHash && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      viewTXInExplorer(
                        subject.txHash!,
                        subject.ledger as NETWORK_SERVER_NAMES,
                      )
                    }
                    title={
                      subject.ledger
                        ? `View on ${getLedgerNameFromServerName(subject.ledger) || subject.ledger}`
                        : undefined
                    }
                  >
                    <ExternalLink />
                    Explorer
                  </Button>
                )}
              </>
            }
          />
        </div>
      </div>

      <div className={wellClass}>
        <div className={gridClass}>
          {structure}
          {/* `min-w-0`, or a wide timeline inside pushes the column off. */}
          <div className="min-w-0">
            <Outlet
              context={
                {
                  vault,
                  parent,
                  ancestors,
                  facts,
                  stream,
                  category,
                } satisfies VaultContext
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultShell;
