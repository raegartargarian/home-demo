import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GlobalState } from "./types";

const initialState: GlobalState = {
  data: null,
  tokenCodes: null,
  isAuthModalOpen: false,
};

// global slice
export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<GlobalState["data"]>) => {
      state.data = action.payload;
    },
    setAuthData: (state, action: PayloadAction<GlobalState["authData"]>) => {
      state.authData = action.payload;
    },
    fetchData: (_state) => {
      // fetch user data
    },
    fetchTokencodes: (_state) => {},
    setTokenCodes: (
      state,
      action: PayloadAction<GlobalState["tokenCodes"]>
    ) => {
      state.tokenCodes = action.payload;
    },
    setIsAuthModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isAuthModalOpen = action.payload;
    },
    logOut: (_state) => {
      // logout user
    },
  },
});

export const { actions: globalActions, reducer: globalReducer } = globalSlice;
