import { useWeb3Auth } from "@/containers/global/Web3AuthProvider";
import { uploadSelectors } from "@/containers/upload/selectors";
import { uploadActions } from "@/containers/upload/slice";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  measureFor,
  PageContainer,
  type PageMeasure,
} from "@/shared/components/PageContainer";
import { PropertyHero } from "@/shared/components/PropertyHero";
import { parseHomeFacts } from "@/shared/utils/homeFacts";
import {
  getLedgerNameFromServerName,
  NETWORK_SERVER_NAMES,
} from "@/shared/utils/networks";
import { viewTXInExplorer } from "@/shared/utils/viewVaultInExplorer";
import { Download, ExternalLink, Layers, Loader2, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { generateVaultProofPdf } from "./components/generateVaultProofPdf";
import StreamList from "./components/StreamList";
import { vaultDetailSelectors } from "./selectors";
import { vaultDetailActions } from "./slice";
import { useVaultRecords } from "./useVaultRecords";

const VaultDetail = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const vault = useSelector(vaultDetailSelectors.vault);
  const isFiling = useSelector(uploadSelectors.isFiling);
  const { isAuthenticated } = useWeb3Auth() || {};
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const isLoading = useSelector(vaultDetailSelectors.isLoading);

  const facts = useMemo(() => (vault ? parseHomeFacts(vault) : null), [vault]);

  const measure: PageMeasure = "wide";

  // Not read here: the vault page shows its sections, which fetch their own
  // records. This fills the record store the upload form reads its project
  // suggestions from, and is the first page of the vault, not all of it.
  useVaultRecords(id);

  const handleDownloadProof = async () => {
    if (!vault || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await generateVaultProofPdf(vault);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  useEffect(() => {
    if (id) {
      dispatch(vaultDetailActions.fetchVaultDetailStart({ id }));
    }
  }, [dispatch, id]);

  if (isLoading || !vault) {
    return (
      <div className="min-h-screen bg-surface-sunken">
        {/* Shaped like what is coming: a full-bleed hero, then cards. A
            skeleton that does not match the layout it precedes makes the page
            jump when it resolves. */}
        <Skeleton className="h-[min(52svh,420px)] w-full rounded-none bg-surface-inset" />
        <PageContainer measure="wide">
          <Skeleton className="mb-5 h-6 w-48 bg-surface-inset" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-80 w-full rounded-xl bg-surface-inset"
              />
            ))}
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-sunken">
      <PropertyHero
        vault={vault}
        facts={facts}
        innerClassName={measureFor(measure)}
        actions={
          isAuthenticated && (
            <Button
              size="sm"
              disabled={isFiling}
              onClick={() =>
                dispatch(
                  uploadActions.openUpload({
                    vaultId: vault.id,
                    ledger: vault.ledger || "",
                  }),
                )
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
            {vault.tx_hash && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  viewTXInExplorer(
                    vault.tx_hash!,
                    vault.ledger as NETWORK_SERVER_NAMES,
                  )
                }
                title={
                  vault.ledger
                    ? `View on ${getLedgerNameFromServerName(vault.ledger) || vault.ledger}`
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

      <PageContainer measure={measure}>
        <div>
          {/* No heading here. The photograph above says which house this is and
              the provenance row says what state it is in; a third block
              announcing "Property Vault" over the sections was the page saying
              its own name for the third time. What the sentence under it
              explained — that one section is private — every card already
              carries on its own TransferBadge. */}
          {vault.streams && vault.streams.length > 0 ? (
            <StreamList vaultId={vault.id} streams={vault.streams} />
          ) : (
            <div className="rounded-xl border border-line bg-surface-raised p-12 text-center">
              <Layers className="mx-auto mb-3 h-10 w-10 text-ink-subtle" />
              <h3 className="mb-1 text-base font-semibold text-ink">
                No sections yet
              </h3>
              <p className="text-sm text-ink-muted">
                Home records will appear here once documentation is uploaded for
                this property.
              </p>
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
};

export default VaultDetail;
