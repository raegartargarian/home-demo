import { RootState } from "@/store/types";
import { createSelector } from "@reduxjs/toolkit";
import { ServiceRecordState } from "./types";

const selectState = (state: RootState): ServiceRecordState =>
  state.serviceRecord;

export const serviceRecordSelectors = {
  attachment: createSelector(selectState, (s) => s.attachment),
  recordData: createSelector(selectState, (s) => s.recordData),
  isLoading: createSelector(selectState, (s) => s.isLoading),
  isProcessingZip: createSelector(selectState, (s) => s.isProcessingZip),
  error: createSelector(selectState, (s) => s.error),
};
