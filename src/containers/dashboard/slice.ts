import { createSlice } from "@reduxjs/toolkit";
import { DashboardState } from "./types";

const initialState: DashboardState = {
  isFetchingData: false,
};
export const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setIsFetchingData: (state, action) => {
      state.isFetchingData = action.payload;
    },
    fetchData: (_state) => {},
  },
});
export const { actions: dashboardActions, reducer: dashboardReducer } =
  dashboardSlice;
