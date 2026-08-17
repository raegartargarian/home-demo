import { globalActions } from "@/containers/global/slice";
import { store } from "@/main";
import axios from "axios";
import { LocalStorageKeys } from "../utils/localStorageHelpers";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(LocalStorageKeys.jwtAccessKey);
  if (token) {
    const tokenData = JSON.parse(atob(token.split(".")[1]));
    const isTokenExpired = Date.now() >= tokenData.exp * 1000;
    if (isTokenExpired) {
      store.dispatch(globalActions.logOut());
      return Promise.reject("Token expired");
    }
    config.headers.Authorization = `Bearer ${token.replace(/"/g, "")}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
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
