import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  CreateProjectInput,
  ParentProjects,
  ProjectVault,
  ProjectVaultsState,
} from "./types";

const initialState: ProjectVaultsState = {
  byParent: {},
  createModal: { parentVaultId: null },
  creation: null,
};

const EMPTY_PARENT: ParentProjects = {
  projects: [],
  isLoading: false,
  error: null,
  hasLoaded: false,
};

const parentOf = (state: ProjectVaultsState, parentVaultId: string) =>
  (state.byParent[parentVaultId] ??= { ...EMPTY_PARENT });

const projectVaultsSlice = createSlice({
  name: "projectVaults",
  initialState,
  reducers: {
    /** Saga trigger. A refetch keeps the current grid on screen. */
    fetchProjects(state, action: PayloadAction<{ parentVaultId: string }>) {
      const parent = parentOf(state, action.payload.parentVaultId);
      parent.isLoading = true;
      parent.error = null;
    },
    fetchProjectsSuccess(
      state,
      action: PayloadAction<{ parentVaultId: string; projects: ProjectVault[] }>
    ) {
      const parent = parentOf(state, action.payload.parentVaultId);
      parent.projects = action.payload.projects;
      parent.isLoading = false;
      parent.hasLoaded = true;
    },
    fetchProjectsFailure(
      state,
      action: PayloadAction<{ parentVaultId: string; error: string }>
    ) {
      const parent = parentOf(state, action.payload.parentVaultId);
      parent.isLoading = false;
      parent.error = action.payload.error;
    },

    openCreateModal(state, action: PayloadAction<string>) {
      state.createModal.parentVaultId = action.payload;
    },
    closeCreateModal(state) {
      state.createModal.parentVaultId = null;
    },

    /** Saga trigger. The saga decides whether a run may start — see there. */
    createProject: {
      reducer() {},
      prepare: (input: CreateProjectInput) => ({ payload: input }),
    },
    /** Raises the card in the grid for a run the saga has accepted. */
    creationStarted(state, action: PayloadAction<CreateProjectInput>) {
      state.creation = {
        input: action.payload,
        step: "Setting up the project…",
        progress: 0,
        status: "running",
        error: null,
        vaultId: null,
      };
    },
    creationProgress(
      state,
      action: PayloadAction<{ step?: string; progress: number | null }>
    ) {
      if (!state.creation) return;
      if (action.payload.step) state.creation.step = action.payload.step;
      state.creation.progress = action.payload.progress;
    },
    creationVaultKnown(state, action: PayloadAction<string>) {
      if (state.creation) state.creation.vaultId = action.payload;
    },
    creationFinished(state) {
      if (!state.creation) return;
      state.creation.status = "done";
      state.creation.progress = 100;
    },
    creationFailed(state, action: PayloadAction<string>) {
      if (!state.creation) return;
      state.creation.status = "failed";
      state.creation.error = action.payload;
    },
    /** Also the way a 401 mid-run leaves nothing behind. */
    dismissCreation(state) {
      state.creation = null;
    },
  },
});

export const { actions: projectVaultsActions, reducer: projectVaultsReducer } =
  projectVaultsSlice;
