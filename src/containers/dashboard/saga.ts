import { takeLatest } from "redux-saga/effects";
import { dashboardActions } from "./slice";
export function* fetchDashboardData(): any {
  try {
    console.log("🚀 ~ function*fetchDashboardData ~ response:");
  } catch (e) {
    console.log(e);
  }
}
export function* dashboardSaga() {
  yield takeLatest(dashboardActions.fetchData.type, fetchDashboardData);
}
