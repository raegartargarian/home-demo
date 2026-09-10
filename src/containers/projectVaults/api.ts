import { getTemplates, getVaults } from "@/shared/providers/api";
import { VaultDto } from "@/shared/types/vault";
import {
  childTemplateSearchTerm,
  isNestedTemplateName,
  parseNestedTemplateName,
} from "./naming";
import { ProjectVault } from "./types";

/**
 * Paging guards. A home has a handful of projects, so these bounds are far
 * above any realistic count while still keeping a misbehaving backend from
 * spinning the client forever.
 */
const MAX_PAGES = 40;
/** Template ids per `GET /vaults` call, to keep the query string sane. */
const TEMPLATE_IDS_PER_REQUEST = 20;

interface TemplateRow {
  id: string;
  name: string;
}

const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size));
  return out;
};

/**
 * Every template page for a search term, or an empty list. The backend answers
 * an empty page with 204 and no body, which ends the walk.
 */
const collectTemplates = async (searchTerm: string): Promise<TemplateRow[]> => {
  const rows: TemplateRow[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await getTemplates(
      page,
      undefined,
      searchTerm,
      "created_at",
      "DESC",
      ""
    );
    if (response.status !== 200 || !response.data) break;
    rows.push(...((response.data.content ?? []) as TemplateRow[]));
    if (page >= (response.data.total_pages ?? 0)) break;
  }
  return rows;
};

/**
 * The templates that declare a project under `parentVaultId`.
 *
 * The search term is only a narrowing hint: `search_term` matching is the
 * backend's business and `NV::` is punctuation-heavy enough that a tokenising
 * search could well miss it. So a search that finds none of our templates falls
 * back to scanning the unfiltered list — slower, but it is the difference
 * between the feature working and the grid silently coming up empty.
 */
const fetchProjectTemplates = async (parentVaultId: string) => {
  const searched = await collectTemplates(childTemplateSearchTerm(parentVaultId));
  const rows = searched.some((row) => isNestedTemplateName(row.name))
    ? searched
    : await collectTemplates("");

  return rows.flatMap((row) => {
    const ref = parseNestedTemplateName(row.name);
    return ref?.kind === "child" && ref.parentVaultId === parentVaultId
      ? [{ templateId: row.id, label: ref.label }]
      : [];
  });
};

/**
 * Every vault created from one of the given templates. Ids are batched across
 * requests, and results deduped, because the same vault can come back twice
 * when a batch boundary falls mid-page.
 */
const fetchVaultsForTemplateIds = async (
  templateIds: string[]
): Promise<VaultDto[]> => {
  const byId = new Map<string, VaultDto>();

  for (const ids of chunk(templateIds, TEMPLATE_IDS_PER_REQUEST)) {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const response = await getVaults(ids, page);
      if (response.status !== 200 || !response.data) break;

      for (const vault of (response.data.content ?? []) as VaultDto[])
        byId.set(vault.id, vault);

      if (page >= (response.data.total_pages ?? 0)) break;
    }
  }

  return [...byId.values()];
};

/** Newest first, matching the homes list. */
const byCreatedAtDesc = (a: ProjectVault, b: ProjectVault): number =>
  new Date(b.vault.created_at).getTime() - new Date(a.vault.created_at).getTime();

/** The projects under one home, newest first. */
export const fetchProjectVaults = async (
  parentVaultId: string
): Promise<ProjectVault[]> => {
  const templates = await fetchProjectTemplates(parentVaultId);
  if (templates.length === 0) return [];

  const labelByTemplateId = new Map(
    templates.map((template) => [template.templateId, template.label])
  );
  const vaults = await fetchVaultsForTemplateIds([...labelByTemplateId.keys()]);

  return vaults
    .flatMap((vault) => {
      const label = vault.template_id
        ? labelByTemplateId.get(vault.template_id)
        : undefined;
      return label
        ? [{ id: vault.id, label, templateId: vault.template_id!, vault }]
        : [];
    })
    .sort(byCreatedAtDesc);
};
