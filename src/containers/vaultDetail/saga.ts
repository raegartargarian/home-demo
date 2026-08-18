import { getSingleVault, getVaultAttachments } from "@/shared/providers/api";
import type { AxiosResponse } from "axios";
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

const PAGE_SIZE = 20;

function* fetchVaultRecordsSaga(
  action: ReturnType<typeof vaultDetailActions.fetchVaultRecordsStart>
) {
  try {
    const { vaultId, page } = action.payload;
    const response: AxiosResponse = yield call(
      getVaultAttachments,
      vaultId,
      page,
      PAGE_SIZE
    );
    const data = response.data;

    yield put(
      vaultDetailActions.fetchVaultRecordsSuccess({
        records: data?.content ?? [],
        currentPage: data?.current_page ?? page,
        totalPages: data?.total_pages ?? 1,
      })
    );
  } catch (error) {
    yield put(
      vaultDetailActions.fetchVaultRecordsFailure(
        error instanceof Error ? error.message : "Could not load records"
      )
    );
  }
}

export function* vaultDetailSaga() {
  yield takeLatest(
    vaultDetailActions.fetchVaultDetailStart.type,
    fetchVaultDetailSaga
  );
  // takeLatest, not takeEvery: a page request that arrives while another is in
  // flight is a double-fire of the infinite-scroll sentinel, not a second page.
  yield takeLatest(
    vaultDetailActions.fetchVaultRecordsStart.type,
    fetchVaultRecordsSaga
  );
}
