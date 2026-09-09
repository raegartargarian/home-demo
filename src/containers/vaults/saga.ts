import { ALL_TEMPLATE_IDS } from "@/shared/constants/scenarios";
import { getVaults } from "@/shared/providers/api";
import { VaultDto } from "@/shared/types/vault";
import { call, put, takeLatest } from "redux-saga/effects";
import { vaultsActions } from "./slice";

// Each scenario's seeded vault(s) live under their own backend template_id
// (see src/shared/constants/scenarios.ts, which owns the env reads). Fetch
// across all configured scenarios so a signed-in user sees every home they have.

function* fetchVaultsSaga(
  action: ReturnType<typeof vaultsActions.fetchVaultsStart>
): any {
  try {
    const { page } = action.payload;
    const response = yield call(getVaults, ALL_TEMPLATE_IDS, page);
    const data = response.data;

    const vaults: VaultDto[] = data.content;
    const crPage = data.current_page;
    const tPages = data.total_pages;
    const hasMore = crPage < tPages;

    yield put(
      vaultsActions.fetchVaultsSuccess({
        vaults,
        currentPage: crPage,
        totalPages: tPages,
        hasMore,
      })
    );
  } catch (error: any) {
    yield put(vaultsActions.fetchVaultsFailure(error.message));
  }
}

export function* vaultsSaga() {
  yield takeLatest(vaultsActions.fetchVaultsStart.type, fetchVaultsSaga);
}
