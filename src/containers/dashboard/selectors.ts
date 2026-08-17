import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../store/types";

export const DashboardDomain = {
  root: (state: RootState) => state,
  isFetchingData: (state: RootState) => state?.dashboard?.isFetchingData,
};
export const DashboardSelectors = {
  isFetchingData: createSelector(
    DashboardDomain.isFetchingData,
    (isFetchingData) => isFetchingData,
  ),
};
