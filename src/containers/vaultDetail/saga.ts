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

function* fetchVaultDetailSaga(
  action: ReturnType<typeof vaultDetailActions.fetchVaultDetailStart>
): SagaIterator {
  try {
    const { id } = action.payload;
    const response = yield call(getSingleVault, id);
    // Settled before the page renders: a project shown as a home for a beat
    // would mount the Projects block and go looking for projects under itself.
    const parent: VaultDto | null = yield call(resolveParent, response.data);
    yield put(vaultDetailActions.setVaultParent(parent));
    yield put(vaultDetailActions.fetchVaultDetailSuccess(response.data));
  } catch (error) {
    yield put(
      vaultDetailActions.fetchVaultDetailFailure(
        error instanceof Error ? error.message : String(error)
      )
    );
  }
}

export function* vaultDetailSaga() {
  yield takeLatest(
    vaultDetailActions.fetchVaultDetailStart.type,
    fetchVaultDetailSaga
  );
}
