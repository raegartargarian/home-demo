import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyableHash } from "@/shared/components/CopyableHash";
import { PropertyHeader } from "@/shared/components/PropertyHeader";
import { scenarioForTemplateId } from "@/shared/constants/scenarios";
import { parseHomeFacts } from "@/shared/utils/homeFacts";
import {
  getLedgerNameFromServerName,
  NETWORK_SERVER_NAMES,
} from "@/shared/utils/networks";
import { viewTXInExplorer } from "@/shared/utils/viewVaultInExplorer";
import { Download, ExternalLink, Layers, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { generateVaultProofPdf } from "./components/generateVaultProofPdf";
import { useLens } from "./components/lens";
import LensTabs from "./components/LensTabs";
import ProjectList from "./components/ProjectList";
import RecordTimeline from "./components/RecordTimeline";
import { makeSectionResolver } from "./components/recordSection";
import StreamList from "./components/StreamList";
import { vaultDetailSelectors } from "./selectors";
import { vaultDetailActions } from "./slice";
import { useVaultRecords } from "./useVaultRecords";

const VaultDetail = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const vault = useSelector(vaultDetailSelectors.vault);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const isLoading = useSelector(vaultDetailSelectors.isLoading);

  const facts = useMemo(() => (vault ? parseHomeFacts(vault) : null), [vault]);

  // The lens is a display choice, not a different vault: sections, timeline and
  // projects are three readings of the same records. The scenario picks the
  // opening one (`defaultGroupBy`), the URL overrides it, and nothing about
  // where a record is stored changes with it.
  const scenario = useMemo(
    () => scenarioForTemplateId(vault?.template_id),
    [vault?.template_id]
  );
  const [lens, setLens] = useLens(scenario?.defaultGroupBy);

  // Projects need the whole vault before the grouping is trustworthy; the
  // timeline reads correctly a page at a time.
  const { records, isLoading: isLoadingRecords, hasMore, loadMore } =
    useVaultRecords(id, lens === "projects");

  const sectionOf = useMemo(
    () => makeSectionResolver(vault?.streams),
    [vault?.streams]
  );

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
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Skeleton className="mb-8 h-8 w-32 bg-surface-inset" />
          <Skeleton className="mb-8 h-48 w-full rounded-xl bg-surface-inset" />
          <Skeleton className="mb-4 h-6 w-48 bg-surface-inset" />
          <Skeleton className="mb-2 h-16 w-full rounded-lg bg-surface-inset" />
          <Skeleton className="mb-2 h-16 w-full rounded-lg bg-surface-inset" />
          <Skeleton className="h-16 w-full rounded-lg bg-surface-inset" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-sunken">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <PropertyHeader
          vault={vault}
          facts={facts}
          className="mb-8"
          actions={
            <>
              {vault.tx_hash && <CopyableHash value={vault.tx_hash} />}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadProof}
                disabled={isGeneratingPdf}
                className="w-fit border-brand-line text-brand hover:bg-brand-surface"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-3.5 w-3.5" />
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
                      vault.ledger as NETWORK_SERVER_NAMES
                    )
                  }
                  className="w-fit border-line text-ink-muted hover:bg-surface-inset"
                  title={
                    vault.ledger
                      ? `View on ${getLedgerNameFromServerName(vault.ledger) || vault.ledger}`
                      : undefined
                  }
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Explorer
                </Button>
              )}
            </>
          }
        />

        <div>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-ink">Property Vault</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Four sections travel with the property for its lifetime. The
              Personal Vault belongs to you and is detached at sale.
            </p>
          </div>

          <LensTabs value={lens} onChange={setLens} className="mb-5" />

          {lens === "timeline" ? (
            <RecordTimeline
              records={records}
              sectionOf={sectionOf}
              hasMore={hasMore}
              isLoading={isLoadingRecords}
              onLoadMore={loadMore}
            />
          ) : lens === "projects" ? (
            <ProjectList
              vaultId={vault.id}
              records={records}
              isLoading={isLoadingRecords}
            />
          ) : vault.streams && vault.streams.length > 0 ? (
            <StreamList
              vaultId={vault.id}
              streams={vault.streams}
              vaultLedger={vault.ledger}
            />
          ) : (
            <div className="rounded-xl border border-line bg-surface-raised p-12 text-center shadow-sm">
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
      </div>
    </div>
  );
};

export default VaultDetail;
