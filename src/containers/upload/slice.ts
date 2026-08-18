import type { UploadPhase } from "@filedgr/web-core/upload";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UploadRequest, UploadState, UploadTarget } from "./types";

const initialState: UploadState = {
  target: null,
  status: "idle",
  phase: null,
  progress: 0,
  parts: null,
  error: null,
  completed: null,
};

/** Everything describing a run in flight. `completed` and `error` outlive it. */
const clearRun = (state: UploadState) => {
  state.status = "idle";
  state.phase = null;
  state.progress = 0;
  state.parts = null;
};

const uploadSlice = createSlice({
  name: "upload",
  initialState,
  reducers: {
    openUpload(state, action: PayloadAction<UploadTarget>) {
      state.target = action.payload;
      state.error = null;
      clearRun(state);
    },
    closeUpload(state) {
      state.target = null;
      state.error = null;
      clearRun(state);
    },
    startUpload: {
      // The payload is the request; the reducer only flips the modal into its
      // running state, so it never reads it.
      reducer(state: UploadState) {
        state.status = "running";
        state.phase = "creating";
        state.progress = 0;
        state.parts = null;
        state.error = null;
      },
      prepare: (request: UploadRequest) => ({ payload: request }),
    },

    // The three control actions carry no state of their own: the saga wires
    // their *types* to the library's upload controller, which then reports back
    // as `uploadPaused` / `uploadResumed` / `uploadCancelled`.
    pauseUpload: (state) => state,
    resumeUpload: (state) => state,
    cancelUpload: (state) => state,

    setPhase(state, action: PayloadAction<UploadPhase>) {
      state.phase = action.payload;
    },
    setProgress(state, action: PayloadAction<number>) {
      state.progress = action.payload;
    },
    setParts(state, action: PayloadAction<UploadState["parts"]>) {
      state.parts = action.payload;
    },
    uploadPaused(state) {
      state.status = "paused";
    },
    uploadResumed(state) {
      state.status = "running";
    },
    uploadSucceeded(
      state,
      action: PayloadAction<{ assetCode: string; attachmentId: string }>
    ) {
      state.completed = { assetCode: action.payload.assetCode, at: Date.now() };
      state.target = null;
      clearRun(state);
    },
    uploadFailed(state, action: PayloadAction<string>) {
      // The modal stays open on failure so the picked files survive a retry.
      state.error = action.payload;
      clearRun(state);
    },
    uploadCancelled(state) {
      clearRun(state);
    },
    dismissError(state) {
      state.error = null;
    },
  },
});

export const { actions: uploadActions, reducer: uploadReducer } = uploadSlice;
