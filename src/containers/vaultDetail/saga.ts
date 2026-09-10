import { parseNestedTemplateName } from "@/containers/projectVaults/naming";
import { PROJECT_VAULTS_ENABLED } from "@/shared/constants/projectVaults";
import { ALL_TEMPLATE_IDS } from "@/shared/constants/scenarios";
import { getSingleTemplate, getSingleVault } from "@/shared/providers/api";
import { VaultDto } from "@/shared/types/vault";
import { SagaIterator } from "redux-saga";
import { call, put, takeLatest } from "redux-saga/effects";
import { vaultDetailActions } from "./slice";

/**
 * The home a project belongs to, or null.
 *
 * A home is seeded under one of the scenario templates; anything else could be
 * a project, whose template name carries the parent link. Best effort: a
 * failure anywhere here leaves the page a plain vault rather than blocking it.
 */
function* resolveParent(vault: VaultDto): SagaIterator<VaultDto | null> {
  if (
    !PROJECT_VAULTS_ENABLED ||
    !vault.template_id ||
    ALL_TEMPLATE_IDS.includes(vault.template_id)
  ) {
    return null;
  }
  try {
    const template = yield call(getSingleTemplate, vault.template_id);
    const ref = parseNestedTemplateName(template.data?.name);
    if (ref?.kind !== "child") return null;
    const parent = yield call(getSingleVault, ref.parentVaultId);
    return (parent.data as VaultDto) ?? null;
  } catch (error) {
    console.error("Failed to resolve the project's home:", error);
    return null;
  }
}

/**
 * How far up the walk will go before giving up.
 *
 * A home with projects under it is two levels; anything approaching this is
 * either a mistake or a loop the cycle guard has not caught. The cap is what
 * stops a malformed chain turning into an unbounded request storm.
 */
const MAX_ANCESTOR_DEPTH = 8;

/**
 * Everything above `from`, root-first, not including `from` itself.
 *
 * `resolveParent` already stops at a home, at an unparseable template name and
 * at any failure, so the loop terminates on its own; the cap and the `seen` set
 * are there for a template that has been edited into a cycle.
 */
function* resolveAncestors(from: VaultDto): SagaIterator<VaultDto[]> {
  const chain: VaultDto[] = [];
  const seen = new Set<string>([from.id]);
  let current = from;

  for (let hop = 0; hop < MAX_ANCESTOR_DEPTH; hop++) {
    const next: VaultDto | null = yield call(resolveParent, current);
    if (!next || seen.has(next.id)) break;
    seen.add(next.id);
    chain.unshift(next);
    current = next;
  }

  return chain;
}

function* fetchVaultDetailSaga(
  action: ReturnType<typeof vaultDetailActions.fetchVaultDetailStart>,
): SagaIterator {
  try {
    const { id } = action.payload;
    const response = yield call(getSingleVault, id);
    // Settled before the page renders: a project shown as a home for a beat
    // would mount the Projects block and go looking for projects under itself.
    const parent: VaultDto | null = yield call(resolveParent, response.data);
    yield put(vaultDetailActions.setVaultAncestors(parent ? [parent] : []));
    yield put(vaultDetailActions.fetchVaultDetailSuccess(response.data));

    // The rest of the chain costs two requests a level and nothing on the page
    // waits for it — the structure sidebar just re-roots one level higher when
    // it lands. `takeLatest` drops it on the way out.
    if (parent) {
      const above: VaultDto[] = yield call(resolveAncestors, parent);
      if (above.length) {
        yield put(vaultDetailActions.setVaultAncestors([...above, parent]));
      }
    }
  } catch (error) {
    yield put(
      vaultDetailActions.fetchVaultDetailFailure(
        error instanceof Error ? error.message : String(error),
      ),
    );
  }
}

export function* vaultDetailSaga() {
  yield takeLatest(
    vaultDetailActions.fetchVaultDetailStart.type,
    fetchVaultDetailSaga,
  );
}
