/**
 * Combine all reducers in this file and export the combined reducers.
 */

import { combineReducers } from "@reduxjs/toolkit";
import { globalReducer } from "../containers/global/slice";
import { dashboardReducer } from "../containers/dashboard/slice";
import { vaultsReducer } from "@/containers/vaults/slice";
import { vaultDetailReducer } from "@/containers/vaultDetail/slice";
import { serviceRecordReducer } from "@/containers/serviceRecord/slice";
import { uploadReducer } from "@/containers/upload/slice";
import { projectVaultsReducer } from "@/containers/projectVaults/slice";

/**
 * Merges the main reducer with the router state and dynamically injected reducers
 */
export function createReducer() {
  return combineReducers({
    global: globalReducer,
    dashboard: dashboardReducer,
    vaults: vaultsReducer,
    vaultDetail: vaultDetailReducer,
    serviceRecord: serviceRecordReducer,
    upload: uploadReducer,
    projectVaults: projectVaultsReducer,
  });
}
