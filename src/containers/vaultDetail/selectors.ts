import { RootState } from "@/store/types";
import { createSelector } from "@reduxjs/toolkit";
import { VaultDetailState } from "./types";

const selectVaultDetailState = (state: RootState): VaultDetailState =>
  state.vaultDetail;

export const vaultDetailSelectors = {
  vault: createSelector(selectVaultDetailState, (state) => state.vault),
  ancestors: createSelector(selectVaultDetailState, (state) => state.ancestors),
  /**
   * The home a project sits directly under, or null. Derived rather than
   * stored, so the chain and the parent cannot drift into two answers.
   */
  parent: createSelector(
    selectVaultDetailState,
    (state) => state.ancestors.at(-1) ?? null,
  ),
  isLoading: createSelector(selectVaultDetailState, (state) => state.isLoading),
  error: createSelector(selectVaultDetailState, (state) => state.error),
};
