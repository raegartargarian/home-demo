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
import { appRoutes, vaultDetailPath } from "@/shared/constants/routes";
import { generateVaultProofPdf } from "./components/generateVaultProofPdf";
import { parseHomeFacts } from "@/shared/utils/homeFacts";
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
import { Download, ExternalLink, Layers, Loader2, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  const isLoading = useSelector(vaultDetailSelectors.isLoading);
  const isFiling = useSelector(uploadSelectors.isFiling);
  const { isAuthenticated } = useWeb3Auth() || {};
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // One measure for every page under the vault, so the well does not shift
  // width underneath you on the way into a section.
  const measure: PageMeasure = "wide";

  useEffect(() => {
    if (id && vault?.id !== id) {
      dispatch(vaultDetailActions.fetchVaultDetailStart({ id }));
    }
  }, [id, vault?.id, dispatch]);

  const facts = useMemo(() => (vault ? parseHomeFacts(vault) : null), [vault]);
  const stream = useMemo(
    () => vault?.streams?.find((entry) => entry.asset_code === code) ?? null,
    [vault?.streams, code],
  );
  const category = useMemo(
    () => (stream ? categoryForStream(stream) : null),
    [stream],
  );

  // The section is the subject when one is open; otherwise the house is.
  const subject = stream
    ? {
        title: category?.label ?? formatStreamName(stream),
        subtitle: category?.description ?? stream.description,
        icon: category?.icon ?? Layers,
        backTo: id ? vaultDetailPath(id) : appRoutes.vaults.path,
        backLabel: facts?.address ?? vault?.name ?? "Back to the vault",
        // A section's facts are the house's, and repeating them under a
        // section's name reads as the house interrupting.
        facts: null,
        txHash: stream.tx_hash,
        ledger: stream.ledger,
        createdAt: stream.created_at,
        createdLabel: "Created",
        status: stream.status,
      }
    : {
        title: facts?.address ?? vault?.name ?? "",
        subtitle: undefined,
        icon: undefined,
        backTo: appRoutes.vaults.path,
        backLabel: "All homes",
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

  const handleDownloadProof = async () => {
    if (!vault || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await generateVaultProofPdf(vault);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading || !vault) {
    return (
      <div className="min-h-screen bg-surface-sunken">
        {/* Shaped like what is coming — a skeleton that does not match the
            layout it precedes makes the page jump when it resolves. */}
        <Skeleton className="h-[min(52svh,420px)] w-full rounded-none bg-surface-inset" />
        <div className={`mx-auto w-full px-4 py-8 ${measureFor(measure)}`}>
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
        facts={subject.facts}
        innerClassName={measureFor(measure)}
      />

      {/* One bar, for whichever subject is open: what it is, whether it is
          proved, and the one thing you came here to do. */}
      <div className="border-b border-line bg-surface-raised">
        <div className={`mx-auto w-full px-4 py-3 ${measureFor(measure)}`}>
          <ProvenanceDetails
            txHash={subject.txHash}
            ledger={subject.ledger}
            createdAt={subject.createdAt}
            createdLabel={subject.createdLabel}
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
              uploadTarget && (
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

      <Outlet
        context={{ vault, facts, stream, category } satisfies VaultContext}
      />
    </div>
  );
};

export default VaultShell;
