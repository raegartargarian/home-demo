import { globalActions } from "@/containers/global/slice";
import { store } from "@/main";
import axios from "axios";
import { LocalStorageKeys } from "../utils/localStorageHelpers";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(LocalStorageKeys.jwtAccessKey);
  if (token) {
    const tokenData = JSON.parse(atob(token.split(".")[1]));
    const isTokenExpired = Date.now() >= tokenData.exp * 1000;
    if (isTokenExpired) {
      store.dispatch(globalActions.logOut());
      // A real Error carrying `status`, not a bare string: the upload flow in
      // @filedgr/web-core classifies failures by status, and a string reaches
      // it as an unknown failure rather than an auth one.
      return Promise.reject(
        Object.assign(new Error("Token expired"), { status: 401 })
      );
    }
    config.headers.Authorization = `Bearer ${token.replace(/"/g, "")}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 only. A 403 is "this account may not do that" — with writes in the
    // app (filing a record into a stream), logging the homeowner out over a
    // permission error would be a confusing way to say "not allowed".
    if (error.response?.status === 401) {
      store.dispatch(globalActions.logOut());
    }
    return Promise.reject(error);
  }
);

export const getVaults = (
  templateIds: string[],
  page: number = 1,
  pageSize: number = 15
) => {
  const params = new URLSearchParams();
  templateIds.forEach((id) => params.append("template_id", id));
  params.append("page", String(page));
  params.append("page_size", String(pageSize));

  return apiClient.get("/vaults", { params });
};

export const getSingleVault = (id: string) => {
  return apiClient.get(`/vaults/${id}`);
};

export const getStreamAttachments = (
  streamCode: string,
  page: number = 1,
  pageSize: number = 15
) => {
  return apiClient.get(
    `/streams/${streamCode}/attachments?page_size=${pageSize}&page=${page}`
  );
};

export const getSingleAttachment = (id: string) => {
  return apiClient.get(`/attachments/${id}`);
};
