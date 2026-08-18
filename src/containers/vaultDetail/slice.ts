import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { VaultDto } from "@/shared/types/vault";
import { Attachment, VaultDetailState } from "./types";

const NO_RECORDS: VaultDetailState["records"] = {
  items: [],
  currentPage: 0,
  totalPages: null,
  isLoading: false,
};

const initialState: VaultDetailState = {
  vault: null,
  isLoading: false,
  error: null,
  records: NO_RECORDS,
};

const vaultDetailSlice = createSlice({
  name: "vaultDetail",
  initialState,
  reducers: {
    fetchVaultDetailStart(state, _action: PayloadAction<{ id: string }>) {
      state.isLoading = true;
      state.error = null;
      state.vault = null;
      // Records belong to the vault being replaced, not the one arriving.
      state.records = NO_RECORDS;
    },
    fetchVaultDetailSuccess(state, action: PayloadAction<VaultDto>) {
      state.isLoading = false;
      state.vault = action.payload;
    },
    fetchVaultDetailFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    fetchVaultRecordsStart: {
      // The saga reads the payload; the reducer only raises the spinner.
      reducer(state: VaultDetailState) {
        state.records.isLoading = true;
      },
      prepare: (request: { vaultId: string; page: number }) => ({
        payload: request,
      }),
    },
    fetchVaultRecordsSuccess(
      state,
      action: PayloadAction<{
        records: Attachment[];
        currentPage: number;
        totalPages: number;
      }>
    ) {
      const { records, currentPage, totalPages } = action.payload;
      state.records.items =
        currentPage <= 1 ? records : [...state.records.items, ...records];
      state.records.currentPage = currentPage;
      state.records.totalPages = totalPages;
      state.records.isLoading = false;
    },
    fetchVaultRecordsFailure(state, action: PayloadAction<string>) {
      state.records.isLoading = false;
      state.error = action.payload;
    },
    resetVaultDetail(state) {
      Object.assign(state, initialState);
    },
  },
});

export const { actions: vaultDetailActions, reducer: vaultDetailReducer } =
  vaultDetailSlice;
