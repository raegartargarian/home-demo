import { call, select, takeLatest } from "redux-saga/effects";
import { GlobalSelectors } from "./selectors";
import { globalActions } from "./slice";
import { GlobalState } from "./types";

function* logOut(): any {
  try {
    const authData = (yield select(
      GlobalSelectors.authData
    )) as GlobalState["authData"];
    if (authData) {
      yield call(authData.logout);
    }
  } catch (error) {
    console.log("error in logOut", error);
  }
}

export function* globalSaga() {
  yield takeLatest(globalActions.logOut, logOut);
}
