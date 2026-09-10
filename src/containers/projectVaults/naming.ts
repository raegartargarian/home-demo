/**
 * Project vaults are a presentation layer over ordinary vaults. The backend has
 * no parent/child relation, so the link is carried in the *name of the template*
 * each vault is created from:
 *
 *   root vault   <- template named  NV::root::<label>
 *   child vault  <- template named  NV::child::<parentVaultId>::<label>
 *
 * That makes "the children of vault X" an exact query: search templates for
 * `NV::child::<X>`, collect their ids, then `GET /vaults?template_id=…` for each.
 *
 * The parent *vault* id is used rather than the parent template id on purpose.
 * One template can legitimately back several vaults, and if the link pointed at
 * a template then two vaults created from the same root template would share a
 * single set of children with no way to tell them apart.
 *
 * This encoding is shared with filedgr-web-app's nested vaults, byte for byte:
 * a project created here shows up in that app's tree and vice versa. In this
 * app a home is always the parent, so only the `child` form is ever written;
 * the `root` form is kept so the two parsers stay identical.
 *
 * Every function here is pure — no imports, no API, no store — so the encoding
 * can be unit-tested on its own and reused from sagas, selectors and components
 * without dragging anything along.
 */

/** Marks a template as belonging to the nested-vaults feature. */
export const NV_PREFIX = "NV::";
export const NV_ROOT_PREFIX = `${NV_PREFIX}root::`;
export const NV_CHILD_PREFIX = `${NV_PREFIX}child::`;

/**
 * `::` is the field separator, so it cannot appear inside a label or the name
 * would no longer round-trip. Labels are sanitised on the way in rather than
 * rejected: the label is cosmetic, and silently repairing it beats failing a
 * vault creation over a colon someone typed in a title.
 */
export const NV_LABEL_MAX_LENGTH = 80;

export type NestedTemplateRef =
  | { kind: "root"; label: string }
  | { kind: "child"; parentVaultId: string; label: string };

/** Strip the separator out of user input and clamp the length. */
export const sanitizeNestedLabel = (label: string): string =>
  label.replace(/:/g, "-").trim().slice(0, NV_LABEL_MAX_LENGTH).trim();

export const buildRootTemplateName = (label: string): string =>
  `${NV_ROOT_PREFIX}${sanitizeNestedLabel(label)}`;

export const buildChildTemplateName = (
  parentVaultId: string,
  label: string
): string => `${NV_CHILD_PREFIX}${parentVaultId}::${sanitizeNestedLabel(label)}`;

/**
 * The `search_term` to hand `GET /templates` to find one vault's children.
 * Results are still re-parsed client-side — the backend match is a substring
 * search, so it is a narrowing hint rather than a guarantee.
 */
export const childTemplateSearchTerm = (parentVaultId: string): string =>
  `${NV_CHILD_PREFIX}${parentVaultId}`;

/** Cheap test used to hide these templates from an ordinary templates list. */
export const isNestedTemplateName = (
  name: string | null | undefined
): boolean => typeof name === "string" && name.startsWith(NV_PREFIX);

/**
 * Returns null for anything that is not a well-formed nested-vault template
 * name, including a name that merely starts with `NV::`. Callers treat null as
 * "not part of this feature" and leave the template alone.
 */
export const parseNestedTemplateName = (
  name: string | null | undefined
): NestedTemplateRef | null => {
  if (typeof name !== "string" || !name.startsWith(NV_PREFIX)) return null;

  const rest = name.slice(NV_PREFIX.length);

  if (rest.startsWith("root::")) {
    const label = rest.slice("root::".length);
    return label ? { kind: "root", label } : null;
  }

  if (rest.startsWith("child::")) {
    const body = rest.slice("child::".length);
    // The label may contain anything except `::`, so the parent id ends at the
    // FIRST separator and the label is everything after it.
    const separator = body.indexOf("::");
    if (separator <= 0) return null;
    const parentVaultId = body.slice(0, separator);
    const label = body.slice(separator + 2);
    return label ? { kind: "child", parentVaultId, label } : null;
  }

  return null;
};

/** The human-facing name, for a template that may or may not be one of ours. */
export const displayNameForTemplate = (name: string): string =>
  parseNestedTemplateName(name)?.label ?? name;
