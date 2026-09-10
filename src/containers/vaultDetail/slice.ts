import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { VaultDto } from "@/shared/types/vault";
import { AddSectionInput, VaultDetailState } from "./types";

const initialState: VaultDetailState = {
  vault: null,
  ancestors: [],
  isLoading: false,
  error: null,
  addSectionModal: { vaultId: null },
  sectionCreation: null,
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

    openAddSectionModal(state, action: PayloadAction<string>) {
      state.addSectionModal.vaultId = action.payload;
    },
    closeAddSectionModal(state) {
      state.addSectionModal.vaultId = null;
    },

    /**
     * Saga trigger. Closing the form is all it does here — the card is raised
     * by `sectionCreationStarted`, once the saga has accepted the run. Sagas
     * see an action *after* the reducers have, so a guard that read a state
     * this reducer had already set to "running" would drop every run.
     *
     * The form closes on dispatch rather than holding a spinner: the wait
     * belongs to the card in the grid, where the section will be.
     */
    addSectionStart: {
      reducer(state) {
        state.addSectionModal.vaultId = null;
      },
      prepare: (input: AddSectionInput) => ({ payload: input }),
    },
    /** Raises the placeholder card for a run the saga has accepted. */
    sectionCreationStarted(state, action: PayloadAction<AddSectionInput>) {
      state.sectionCreation = {
        vaultId: action.payload.vaultId,
        mapping: action.payload.mapping,
        label: action.payload.label,
        status: "running",
        error: null,
        retryable: true,
      };
    },
    addSectionFailure(
      state,
      action: PayloadAction<{ error: string; retryable: boolean }>,
    ) {
      if (!state.sectionCreation) return;
      state.sectionCreation.status = "failed";
      state.sectionCreation.error = action.payload.error;
      state.sectionCreation.retryable = action.payload.retryable;
    },
    dismissSectionCreation(state) {
      state.sectionCreation = null;
    },
  },
});

export const { actions: vaultDetailActions, reducer: vaultDetailReducer } =
  vaultDetailSlice;
