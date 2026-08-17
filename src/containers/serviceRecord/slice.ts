import { ProcessedHomeData } from "@/shared/utils/zipHandler";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AttachmentModel, ServiceRecordState } from "./types";

const initialState: ServiceRecordState = {
  attachment: null,
  recordData: null,
  isLoading: false,
  isProcessingZip: false,
  error: null,
};

const serviceRecordSlice = createSlice({
  name: "serviceRecord",
  initialState,
  reducers: {
    fetchStart(state, _action: PayloadAction<{ id: string }>) {
      state.isLoading = true;
      state.error = null;
      state.attachment = null;
      state.recordData = null;
      state.isProcessingZip = false;
    },
    fetchSuccess(state, action: PayloadAction<AttachmentModel>) {
      state.isLoading = false;
      state.attachment = action.payload;
    },
    setProcessingZip(state, action: PayloadAction<boolean>) {
      state.isProcessingZip = action.payload;
    },
    setRecordData(state, action: PayloadAction<ProcessedHomeData>) {
      state.isProcessingZip = false;
      state.recordData = action.payload;
    },
    fetchFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.isProcessingZip = false;
      state.error = action.payload;
    },
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const { actions: serviceRecordActions, reducer: serviceRecordReducer } =
  serviceRecordSlice;
