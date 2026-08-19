import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { VaultDto } from "@/shared/types/vault";
import { VaultDetailState } from "./types";

const initialState: VaultDetailState = {
  vault: null,
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
    },
    fetchVaultDetailSuccess(state, action: PayloadAction<VaultDto>) {
      state.isLoading = false;
      state.vault = action.payload;
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
