import { getSingleVault } from "@/shared/providers/api";
import { call, put, takeLatest } from "redux-saga/effects";
import { vaultDetailActions } from "./slice";

function* fetchVaultDetailSaga(
  action: ReturnType<typeof vaultDetailActions.fetchVaultDetailStart>
): any {
  try {
    const { id } = action.payload;
    const response = yield call(getSingleVault, id);
    yield put(vaultDetailActions.fetchVaultDetailSuccess(response.data));
  } catch (error: any) {
    yield put(vaultDetailActions.fetchVaultDetailFailure(error.message));
  }
}


export function* vaultDetailSaga() {
  yield takeLatest(
    vaultDetailActions.fetchVaultDetailStart.type,
    fetchVaultDetailSaga
  );
}
