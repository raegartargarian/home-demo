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

// `GET /vaults/{id}/attachments` — every record in a vault, in one ordering —
// is deliberately not wrapped here.
//
// NOT DEPLOYED (checked 2026-08-19, dev). The route is in `openapi.json`, but
// the dev gateway answers it exactly as it answers a route that does not exist:
// 403 `MissingAuthenticationTokenException`, and no `Access-Control-*` headers,
// which the browser can only surface as a CORS error. `/vaults/{id}`,
// `/attachments` and `/streams/{code}/attachments` all preflight 200 on the
// same host, and `filedgr-web-app` only ever reads attachments per stream. So:
// not CORS, not the dev-server port — the route is simply not on the stage.
//
// Calling it cost more than nothing: the hook that did retried on failure, and
// with the route 403ing that became an unbounded loop against the gateway.
// Anything that needs the vault as one set waits for the route, or fans out
// across `getStreamAttachments` and merges five paginations itself.

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
