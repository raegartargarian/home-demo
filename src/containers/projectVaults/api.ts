import { getSingleTemplate, getVaults } from "@/shared/providers/api";
import { VaultDto } from "@/shared/types/vault";
import { parseNestedTemplateName } from "./naming";
import { ProjectVault } from "./types";

/**
 * Paging guard. A home has a handful of projects and an account a handful of
 * vaults, so this is far above any realistic count while still keeping a
 * misbehaving backend from spinning the client forever.
 */
const MAX_PAGES = 40;

/** Template reads in flight at once, so a long list does not open 50 sockets. */
const TEMPLATES_PER_BATCH = 10;

const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size));
  return out;
};

/**
 * Every vault the signed-in account can open.
 *
 * No template filter: the backend already scopes this to what the caller holds
 * a permission on, and that is exactly the set a project can be discovered
 * from — a project you cannot open is not one worth drawing in a tree.
 */
const collectVisibleVaults = async (): Promise<VaultDto[]> => {
  const vaults: VaultDto[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await getVaults([], page);
    if (response.status !== 200 || !response.data) break;
    vaults.push(...((response.data.content ?? []) as VaultDto[]));
    if (page >= (response.data.total_pages ?? 0)) break;
  }

  return vaults;
};

/**
 * The name a vault's template carries, or null.
 *
 * A failure is not worth surfacing: a template the account cannot read means a
 * vault it cannot place in a tree, which is the same outcome as a template that
 * was never a project's.
 */
const templateNameOf = async (templateId: string): Promise<string | null> => {
  try {
    const response = await getSingleTemplate(templateId);
    return (response.data?.name as string) ?? null;
  } catch {
    return null;
  }
};

/** Newest first, matching the homes list. */
const byCreatedAtDesc = (a: ProjectVault, b: ProjectVault): number =>
  new Date(b.vault.created_at).getTime() -
  new Date(a.vault.created_at).getTime();

/**
 * The template name behind each of these vaults, keyed by template id.
 *
 * One read per distinct template, not per vault: a home's scenario template is
 * shared by every home seeded from it.
 */
const templateNamesFor = async (
  vaults: VaultDto[],
): Promise<Map<string, string | null>> => {
  const templateIds = [
    ...new Set(
      vaults
        .map((vault) => vault.template_id)
        .filter((id): id is string => !!id),
    ),
  ];

  const names = new Map<string, string | null>();
  for (const batch of chunk(templateIds, TEMPLATES_PER_BATCH)) {
    const resolved = await Promise.all(batch.map(templateNameOf));
    batch.forEach((id, index) => names.set(id, resolved[index]));
  }
  return names;
};

/** What a vault's template says it is: a project under a home, or not. */
const parentOf = (
  vault: VaultDto,
  names: Map<string, string | null>,
): string | null => {
  const name = vault.template_id ? names.get(vault.template_id) : null;
  const ref = parseNestedTemplateName(name ?? undefined);
  return ref?.kind === "child" ? ref.parentVaultId : null;
};

/**
 * The homes among a set of vaults: everything that is not a project.
 *
 * The homes list asks the backend for every vault the account can open, which
 * is the only question that survives a vault being shared. That set includes
 * the projects, though, and a project is a job rather than a house — it
 * belongs under its home, not beside it in "Your homes".
 */
export const withoutProjects = async (
  vaults: VaultDto[],
): Promise<VaultDto[]> => {
  const names = await templateNamesFor(vaults);
  return vaults.filter((vault) => !parentOf(vault, names));
};

/**
 * The projects under one home, newest first.
 *
 * Discovered from the vaults rather than from the templates, and that
 * difference is the whole point. Nesting is recorded in a template's *name*
 * (`NV::<parentVaultId>::<label>`), so the obvious way to find a home's
 * projects is to search the template list for that prefix. That is what this
 * used to do, and it works perfectly — for the account that created them.
 *
 * It fails for everyone else. Templates belong to the account that made them,
 * so a colleague granted access to a home opened it and found no projects at
 * all: the vaults had been shared, the templates behind them had not, and the
 * search came back empty with nothing to say about why.
 *
 * So the walk runs the other way now. Ask for the vaults this account can
 * open, then read each one's template to see which home it belongs under. What
 * appears is then exactly what the reader can actually open, which is the only
 * honest thing for a tree to show — and it costs one read per distinct
 * template rather than a paged scan of every template in the account.
 */
export const fetchProjectVaults = async (
  parentVaultId: string,
): Promise<ProjectVault[]> => {
  const vaults = await collectVisibleVaults();
  const names = await templateNamesFor(vaults);

  return vaults
    .flatMap((vault) => {
      if (parentOf(vault, names) !== parentVaultId) return [];
      const label = parseNestedTemplateName(
        names.get(vault.template_id!) ?? undefined,
      )!.label;
      return [{ id: vault.id, label, templateId: vault.template_id!, vault }];
    })
    .sort(byCreatedAtDesc);
};
