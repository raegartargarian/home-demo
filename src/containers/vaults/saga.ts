import { withoutProjects } from "@/containers/projectVaults/api";
import { PROJECT_VAULTS_ENABLED } from "@/shared/constants/projectVaults";
import { getVaults } from "@/shared/providers/api";
import { VaultDto } from "@/shared/types/vault";
import { call, put, takeLatest } from "redux-saga/effects";
import { vaultsActions } from "./slice";

// Every home the account can see, rather than only the seeded scenarios.
//
// This used to filter on the template ids in the environment, which made the
// list a function of the build rather than of the person signed in. Grant a
// colleague access to a vault and they still saw "No Homes Found", because the
// home they had just been given was seeded under a template this build had
// never heard of — and the only fix was an env change and a redeploy, per
// person, per vault.
//
// The backend already scopes `GET /vaults` to what the caller holds a
// permission on, which is the honest answer to "your homes". Scenario template
// ids are still read elsewhere, to say which scenario a home belongs to; they
// just no longer decide whether it exists.

function* fetchVaultsSaga(
  action: ReturnType<typeof vaultsActions.fetchVaultsStart>,
): any {
  try {
    const { page } = action.payload;
    const response = yield call(getVaults, [], page);
    const data = response.data;

    // A project is a job rather than a house: it belongs under its home in the
    // structure column, not beside it here. Only worth the template reads when
    // there can be projects at all.
    const visible: VaultDto[] = data.content;
    const vaults: VaultDto[] = PROJECT_VAULTS_ENABLED
      ? yield call(withoutProjects, visible)
      : visible;
    const crPage = data.current_page;
    const tPages = data.total_pages;
    const hasMore = crPage < tPages;

    yield put(
      vaultsActions.fetchVaultsSuccess({
        vaults,
        currentPage: crPage,
        totalPages: tPages,
        hasMore,
      }),
    );
  } catch (error: any) {
    yield put(vaultsActions.fetchVaultsFailure(error.message));
  }
}

export function* vaultsSaga() {
  yield takeLatest(vaultsActions.fetchVaultsStart.type, fetchVaultsSaga);
}
