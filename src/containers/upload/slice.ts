import type { UploadPhase } from "@filedgr/web-core/upload";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UploadCard, UploadRequest, UploadState, UploadTarget } from "./types";

const initialState: UploadState = {
  target: null,
  status: "idle",
  phase: null,
  progress: 0,
  parts: null,
  error: null,
  completed: null,
  card: null,
  succeeded: false,
};

/** Everything describing a run in flight. `completed`, `error` and the tray
 *  card outlive it. */
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
      // The request itself is for the saga; the reducer only flips into the
      // running state and raises the tray card, which is why the card travels
      // as `meta` rather than being mixed into the request.
      reducer(
        state: UploadState,
        action: PayloadAction<UploadRequest, string, { card: UploadCard }>
      ) {
        state.status = "running";
        state.phase = "creating";
        state.progress = 0;
        state.parts = null;
        state.error = null;
        state.card = action.meta.card;
        state.succeeded = false;
      },
      prepare: (request: UploadRequest, card: UploadCard) => ({
        payload: request,
        meta: { card },
      }),
    },

    // The three control actions carry no state of their own — their *types*
    // are what the library's upload controller is wired to, and it reports back
    // as `uploadPaused` / `uploadResumed` / `uploadCancelled`.
    //
    // Nothing dispatches them today: the tray has no pause or cancel, and the
    // saga deliberately does not hand the control map to web-core, because the
    // watcher it forks never terminates and hangs the upload task. See the note
    // at the `runAttachmentUpload` call.
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
      // The card stays, now showing the finished record, until it is dismissed.
      state.succeeded = true;
      clearRun(state);
    },
    uploadFailed(state, action: PayloadAction<string>) {
      // The form comes back on failure, with the files and everything typed
      // into it intact, so the retry costs nothing. That makes it the only
      // place the error belongs — a tray card would be a second, deader copy.
      state.error = action.payload;
      state.card = null;
      clearRun(state);
    },
    uploadCancelled(state) {
      state.card = null;
      clearRun(state);
    },
    dismissTray(state) {
      state.card = null;
      state.succeeded = false;
    },
    dismissError(state) {
      state.error = null;
    },
  },
});

export const { actions: uploadActions, reducer: uploadReducer } = uploadSlice;
