import { Skeleton } from "@/components/ui/skeleton";
import { makeSectionResolver } from "@/containers/vaultDetail/components/recordSection";
import ServiceRecordCard from "@/containers/vaultDetail/components/ServiceRecordCard";
import { vaultDetailSelectors } from "@/containers/vaultDetail/selectors";
import { vaultDetailActions } from "@/containers/vaultDetail/slice";
import { Attachment } from "@/containers/vaultDetail/types";
import { useVaultRecords } from "@/containers/vaultDetail/useVaultRecords";
import { BackButton } from "@/shared/components/BackButton";
import { LoadingIndicator } from "@/shared/components/LoadingIndicator";
import { TransferBadge } from "@/shared/components/TransferBadge";
import { categoryOrder, StreamCategory } from "@/shared/constants/streams";
import { formatDateSpan } from "@/shared/utils/dateFormatter";
import { recordsInProject, spanOf } from "@/shared/utils/recordLens";
import { CalendarRange, Hammer, Layers } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { PageContainer } from "@/shared/components/PageContainer";

interface SectionGroup {
  category: StreamCategory | null;
  records: Attachment[];
}

/**
 * One job, assembled from every section it touches.
 *
 * The records are not moved or copied to build this page — each one still lives
 * in the section it was filed in, and the page says so, section by section. That
 * is the whole trick: the transfer boundary survives a view that reads as a
 * single story.
 */
const ProjectDetail = () => {
  const { id, project: encodedProject } = useParams<{
    id: string;
    project: string;
  }>();
  const dispatch = useDispatch();
  const vault = useSelector(vaultDetailSelectors.vault);

  const project = encodedProject ? decodeURIComponent(encodedProject) : "";

  // Deep link or hard refresh: the vault has not been loaded by the page the
  // user would normally arrive from.
  useEffect(() => {
    if (id && vault?.id !== id) {
      dispatch(vaultDetailActions.fetchVaultDetailStart({ id }));
    }
  }, [id, vault?.id, dispatch]);

  // A project read off a partial page would silently be missing records, so
  // this view waits for the whole vault.
  const { records, isLoading, isComplete } = useVaultRecords(id, true);

  const inProject = useMemo(
    () => recordsInProject(records, project),
    [records, project],
  );

  const sectionOf = useMemo(
    () => makeSectionResolver(vault?.streams),
    [vault?.streams],
  );

  // Grouped by section, in the taxonomy's own reading order.
  const sections = useMemo(() => {
    const groups = new Map<string, SectionGroup>();

    for (const record of inProject) {
      const category = sectionOf(record);
      const key = category?.code ?? "other";
      const existing = groups.get(key);
      if (existing) existing.records.push(record);
      else groups.set(key, { category, records: [record] });
    }

    return [...groups.values()].sort(
      (a, b) => categoryOrder(a.category) - categoryOrder(b.category),
    );
  }, [inProject, sectionOf]);

  const span = useMemo(() => {
    const { from, to } = spanOf(inProject);
    return formatDateSpan(from, to);
  }, [inProject]);

  const isFirstLoad = isLoading && inProject.length === 0;

  return (
    <div className="min-h-screen bg-surface-sunken">
      <PageContainer>
        <BackButton />

        <header className="mb-6 mt-6 rounded-xl border border-line bg-surface-raised p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-inset">
              <Hammer className="h-6 w-6 text-ink-muted" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-medium tracking-tight text-ink md:text-2xl">
                {project || "Project"}
              </h1>
              {vault?.name && (
                <p className="mt-0.5 truncate text-sm text-ink-muted">
                  {vault.name}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-subtle">
                {span && (
                  <span className="flex items-center gap-1.5">
                    <CalendarRange className="h-3.5 w-3.5" aria-hidden />
                    {span}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" aria-hidden />
                  {inProject.length} record
                  {inProject.length !== 1 ? "s" : ""} across {sections.length}{" "}
                  section{sections.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </header>

        {isFirstLoad ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-20 w-full rounded-xl bg-surface-inset"
              />
            ))}
          </div>
        ) : inProject.length === 0 && isComplete ? (
          <div className="rounded-xl border border-line bg-surface-raised p-12 text-center shadow-sm">
            <Hammer className="mx-auto mb-3 h-10 w-10 text-ink-subtle" />
            <h3 className="text-base font-medium tracking-tight text-ink">
              Nothing filed under this project
            </h3>
            <p className="mt-1 text-sm text-ink-muted">
              Records join a project through their name — the third part of
              “Date - Type - Project - Document”.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map(({ category, records: inSection }) => (
              <section
                key={category?.code ?? "other"}
                data-category={category?.code}
                className="overflow-hidden rounded-xl border border-line bg-surface-raised shadow-sm"
              >
                <div className="h-1 w-full bg-cat" aria-hidden />

                <header className="flex items-center gap-3 border-b border-line p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cat-line bg-cat-surface">
                    {category ? (
                      <category.icon className="h-4 w-4 text-cat" aria-hidden />
                    ) : (
                      <Layers className="h-4 w-4 text-cat" aria-hidden />
                    )}
                  </div>
                  <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                    {category?.label ?? "Other records"}
                  </h2>
                  {category && (
                    <TransferBadge transfersOnSale={category.transfersOnSale} />
                  )}
                </header>

                <div className="space-y-2 p-4">
                  {inSection.map((record) => (
                    <ServiceRecordCard key={record.id} attachment={record} />
                  ))}
                </div>
              </section>
            ))}

            {isLoading && (
              <div className="flex w-full items-center justify-center py-4">
                <LoadingIndicator />
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </div>
  );
};

export default ProjectDetail;
