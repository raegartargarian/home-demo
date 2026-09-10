import { ProjectsSection } from "@/containers/projectVaults/components/ProjectsSection";
import { PageContainer } from "@/shared/components/PageContainer";
import { PROJECT_VAULTS_ENABLED } from "@/shared/constants/projectVaults";
import { Layers } from "lucide-react";
import StreamList from "./components/StreamList";
import { useVaultContext } from "./vaultContext";

/**
 * The vault's own page: its five sections, and — for a home, when the option
 * is on — the projects under it.
 *
 * The house, the way out and the provenance all live in `VaultShell`, which
 * stays mounted while you move between here and a section — so this is only the
 * content that changes.
 */
const VaultDetail = () => {
  const { vault, ancestors } = useVaultContext();

  // Starting a project stays a home's action. The structure sidebar renders a
  // project under a project happily enough, but nothing here offers to make
  // one, so the tree only ever goes as deep as the data already does.
  const showProjects = PROJECT_VAULTS_ENABLED && ancestors.length === 0;

  return (
    <PageContainer measure="inherit">
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

      {showProjects && <ProjectsSection home={vault} />}
    </PageContainer>
  );
};

export default VaultDetail;
