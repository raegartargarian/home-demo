import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { VaultDto } from "@/shared/types/vault";
import { VaultsState } from "./types";

const initialState: VaultsState = {
  vaults: [],
  currentPage: 0,
  totalPages: null,
  isFirstLoading: false,
  isFetching: false,
  error: null,
  hasMore: true,
};

const vaultsSlice = createSlice({
  name: "vaults",
  initialState,
  reducers: {
    fetchVaultsStart(state, action: PayloadAction<{ page: number }>) {
      state.isFetching = true;
      state.error = null;
      if (action.payload.page === 1) {
        state.isFirstLoading = true;
        state.vaults = [];
      }
    },
    fetchVaultsSuccess(
      state,
      action: PayloadAction<{
        vaults: VaultDto[];
        currentPage: number;
        totalPages: number;
        hasMore: boolean;
      }>
    ) {
      state.isFetching = false;
      state.isFirstLoading = false;
      state.currentPage = action.payload.currentPage;
      state.totalPages = action.payload.totalPages;
      state.vaults = [...state.vaults, ...action.payload.vaults];
      state.hasMore = action.payload.hasMore;
    },
    fetchVaultsFailure(state, action: PayloadAction<string>) {
      state.isFetching = false;
      state.isFirstLoading = false;
      state.error = action.payload;
      state.hasMore = false;
    },
    resetVaults(state) {
      Object.assign(state, initialState);
    },
  },
});

export const { actions: vaultsActions, reducer: vaultsReducer } = vaultsSlice;
