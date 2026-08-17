import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "@/store/types";
import { VaultsState } from "./types";

const selectVaultsState = (state: RootState): VaultsState => state.vaults;

export const vaultsSelectors = {
  vaults: createSelector(selectVaultsState, (state) => state.vaults),
  currentPage: createSelector(selectVaultsState, (state) => state.currentPage),
  totalPages: createSelector(selectVaultsState, (state) => state.totalPages),
  isFirstLoading: createSelector(
    selectVaultsState,
    (state) => state.isFirstLoading
  ),
  isFetching: createSelector(selectVaultsState, (state) => state.isFetching),
  error: createSelector(selectVaultsState, (state) => state.error),
  hasMore: createSelector(selectVaultsState, (state) => state.hasMore),
};
