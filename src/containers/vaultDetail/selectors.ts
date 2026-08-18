import { RootState } from "@/store/types";
import { createSelector } from "@reduxjs/toolkit";
import { VaultDetailState } from "./types";

const selectVaultDetailState = (state: RootState): VaultDetailState =>
  state.vaultDetail;

export const vaultDetailSelectors = {
  vault: createSelector(selectVaultDetailState, (state) => state.vault),
  isLoading: createSelector(
    selectVaultDetailState,
    (state) => state.isLoading
  ),
  error: createSelector(selectVaultDetailState, (state) => state.error),
  records: createSelector(selectVaultDetailState, (state) => state.records),
};
