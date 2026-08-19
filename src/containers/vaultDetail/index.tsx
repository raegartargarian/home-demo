import { PageContainer } from "@/shared/components/PageContainer";
import { Layers } from "lucide-react";
import StreamList from "./components/StreamList";
import { useVaultContext } from "./vaultContext";
import { useVaultRecords } from "./useVaultRecords";

/**
 * The vault's own page: its five sections.
 *
 * The house, the way out and the provenance all live in `VaultShell`, which
 * stays mounted while you move between here and a section — so this is only the
 * content that changes.
 */
const VaultDetail = () => {
  const { vault } = useVaultContext();

  // Not read here: the sections fetch their own records. This fills the record
  // store the upload form reads its project suggestions from, and is the first
  // page of the vault, not all of it.
  useVaultRecords(vault.id);

  return (
    <PageContainer measure="wide">
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
    </PageContainer>
  );
};

export default VaultDetail;
