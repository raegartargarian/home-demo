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
  card: createSelector(selectUploadState, (state) => state.card),
  /**
   * Whether a run is in flight. One at a time: the saga takes the leading
   * start and ignores the rest, so the entry points offer to file a record
   * only when one can actually be filed.
   */
  isFiling: createSelector(selectUploadState, (state) => state.status !== "idle"),
  succeeded: createSelector(selectUploadState, (state) => state.succeeded),
};
