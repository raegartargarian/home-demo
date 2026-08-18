import { RootState } from "@/store/types";
import { createSelector } from "@reduxjs/toolkit";
import { UploadState } from "./types";

const selectUploadState = (state: RootState): UploadState => state.upload;

export const uploadSelectors = {
  target: createSelector(selectUploadState, (state) => state.target),
  status: createSelector(selectUploadState, (state) => state.status),
  phase: createSelector(selectUploadState, (state) => state.phase),
  progress: createSelector(selectUploadState, (state) => state.progress),
  parts: createSelector(selectUploadState, (state) => state.parts),
  error: createSelector(selectUploadState, (state) => state.error),
  completed: createSelector(selectUploadState, (state) => state.completed),
};
