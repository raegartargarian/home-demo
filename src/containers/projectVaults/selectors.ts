import { RootState } from "@/store/types";
import { createSelector } from "@reduxjs/toolkit";
import { ParentProjects } from "./types";

const selectState = (state: RootState) => state.projectVaults;

/** A stable object for a home nothing has been asked about yet. */
const NOT_LOADED: ParentProjects = {
  projects: [],
  isLoading: false,
  error: null,
  hasLoaded: false,
};

export const projectVaultsSelectors = {
  forParent: (state: RootState, parentVaultId: string): ParentProjects =>
    selectState(state).byParent[parentVaultId] ?? NOT_LOADED,
  createModal: createSelector(selectState, (state) => state.createModal),
  creation: createSelector(selectState, (state) => state.creation),
};
