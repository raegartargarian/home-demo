import { attachmentTransport } from "@/shared/providers/attachmentTransport";
import {
  isCancelled,
  UploadError,
  type CreateAttachmentRequest,
  type UploadEvent,
  type UploadFailureKind,
} from "@filedgr/web-core/upload";
import { runAttachmentUpload } from "@filedgr/web-core/upload/saga";
import { PayloadAction } from "@reduxjs/toolkit";
import { put, takeLeading } from "redux-saga/effects";
import { uploadActions } from "./slice";
import { UploadRequest } from "./types";

/**
 * The five-step upload (create → review → PUT parts → complete → confirm),
 * along with retry/backoff, presigned-URL refresh and pause/cancel, lives in
 * @filedgr/web-core/upload — the same flow filedgr-web-app runs against the
 * same backend. What stays here is only this app's reaction to it: the modal's
 * state and the error copy a homeowner should read.
 */

const FAILURE_MESSAGE: Partial<Record<UploadFailureKind, string>> = {
  "insufficient-balance":
    "This vault is out of credits, so the record could not be filed. Top up and try again.",
  "review-timeout":
    "The file is taking longer than usual to be reviewed. It may still land — check the section again in a few minutes.",
  "confirm-timeout":
    "The file uploaded, but its blockchain confirmation is still pending. It will appear once anchored.",
  "part-upload":
    "The upload was interrupted. Please check your connection and try again.",
  "no-presigned-urls":
    "The server did not return an upload location. Please try again.",
};

/** Translate the library's events into this app's state. Every `put` is here. */
function makeEventHandler(assetCode: string) {
  return function* handleUploadEvent(event: UploadEvent) {
    switch (event.type) {
      case "phase":
        yield put(uploadActions.setPhase(event.phase));
        break;

      case "progress":
        yield put(uploadActions.setProgress(Math.round(event.progress)));
        break;

      case "parts":
        // A single-part upload has no "part 1 of 1" worth showing.
        yield put(
          uploadActions.setParts(
            event.info.totalParts > 1
              ? {
                  current: event.info.currentPart,
                  total: event.info.totalParts,
                }
              : null
          )
        );
        break;

      case "paused":
        yield put(uploadActions.uploadPaused());
        break;

      case "resumed":
        yield put(uploadActions.uploadResumed());
        break;

      case "warn":
        // An S3 bucket without Access-Control-Expose-Headers: ETag sends every
        // multipart upload down the recovery path — worth seeing in the console.
        console.warn("[attachment-upload]", event.code, event.partNumber ?? "");
        break;

      case "succeeded":
        yield put(
          uploadActions.uploadSucceeded({
            assetCode,
            attachmentId: event.attachment.id,
          })
        );
        break;

      case "failed":
        // The catch below owns the reaction; the library already stopped.
        break;
    }
  };
}

function* handleUploadFailure(error: unknown) {
  // Cancelled from the modal: the user already knows, so say nothing.
  if (isCancelled(error)) {
    yield put(uploadActions.uploadCancelled());
    return;
  }

  const kind = error instanceof UploadError ? error.kind : "unknown";

  // The interceptor already logged the user out and the modal unmounts with it.
  if (kind === "auth") {
    yield put(uploadActions.uploadCancelled());
    return;
  }

  yield put(
    uploadActions.uploadFailed(
      FAILURE_MESSAGE[kind] ??
        (error as Error)?.message ??
        "Something went wrong while filing this record."
    )
  );
}

function* uploadRecordSaga(action: PayloadAction<UploadRequest>) {
  const payload = action.payload;

  const request: CreateAttachmentRequest = {
    name: payload.name,
    description: payload.description,
    stream_id: payload.streamId,
    filename: payload.filename,
    ledger: payload.ledger,
    network_owner: payload.networkOwner,
    // The size the backend plans its parts from — the *zipped* size.
    estimated_size: payload.file.size,
  };

  try {
    // No `control` map, and passing one without a web-core fix breaks uploading
    // after the first record.
    //
    // `runWithChannel` does `yield fork(watchControls, …)` whenever it is given
    // one, and `watchControls` is a `while (true) { yield take(…) }` that never
    // returns. An attached fork keeps its parent alive, so the upload task never
    // completes — not on success, not on failure. Under `takeLatest` (how
    // filedgr-web-app runs it) the next dispatch cancels the stuck task and the
    // leak is invisible. Under `takeLeading`, which is what an upload actually
    // wants, every later `startUpload` is silently dropped: the reducer still
    // raises the tray card, so it sits at "Preparing the record…" 0% and no
    // request is ever made.
    //
    // Nothing dispatches pause/resume/cancel anyway — the tray offers neither.
    // Restore both together: fix the fork, then hand the control map back.
    yield* runAttachmentUpload({
      transport: attachmentTransport,
      file: payload.file,
      request,
      onEvent: makeEventHandler(payload.assetCode),
    });
  } catch (error) {
    yield* handleUploadFailure(error);
  }
}

export function* uploadSaga() {
  // takeLeading, not takeLatest: a second start must not cancel an upload
  // already streaming parts. The modal disables its submit while one runs.
  yield takeLeading(uploadActions.startUpload.type, uploadRecordSaga);
}
