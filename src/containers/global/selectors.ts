import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../store/types";

export const GlobalDomains = {
  root: (state: RootState) => state,

  data: (state: RootState) => state?.global.data,
  tokenCodes: (state: RootState) => state?.global.tokenCodes,
};

export const GlobalSelectors = {
  data: createSelector(GlobalDomains.data, (data) => data),
  tokens: createSelector(GlobalDomains.tokenCodes, (tokenCodes) => tokenCodes),
  isAuthModalOpen: createSelector(
    GlobalDomains.root,
    (root) => root.global.isAuthModalOpen
  ),
  authData: createSelector(GlobalDomains.root, (root) => root.global.authData),
};
