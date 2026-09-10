import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { VaultDto } from "@/shared/types/vault";
import { VaultDetailState } from "./types";

const initialState: VaultDetailState = {
  vault: null,
  ancestors: [],
  isLoading: false,
  error: null,
};

const vaultDetailSlice = createSlice({
  name: "vaultDetail",
  initialState,
  reducers: {
    fetchVaultDetailStart(state, _action: PayloadAction<{ id: string }>) {
      state.isLoading = true;
      state.error = null;
      state.vault = null;
      state.ancestors = [];
    },
    fetchVaultDetailSuccess(state, action: PayloadAction<VaultDto>) {
      state.isLoading = false;
      state.vault = action.payload;
    },
    /**
     * Root-first, and empty for a home. Dispatched twice per vault: the
     * immediate parent before success, because whether this is a home decides
     * what the page mounts, then the rest of the chain as it arrives.
     */
    setVaultAncestors(state, action: PayloadAction<VaultDto[]>) {
      state.ancestors = action.payload;
    },
    fetchVaultDetailFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    resetVaultDetail(state) {
      Object.assign(state, initialState);
    },
  },
});

export const { actions: vaultDetailActions, reducer: vaultDetailReducer } =
  vaultDetailSlice;
