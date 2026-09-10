import { globalActions } from "@/containers/global/slice";
import { store } from "@/main";
import { createFiledgrApi } from "@filedgr/web-core/api";
import axios from "axios";
import { LocalStorageKeys } from "../utils/localStorageHelpers";

/** How many items a list page asks for, everywhere this app pages. */
export const PAGE_SIZE = 15;

/**
 * This app's own axios instance rather than web-core's `createApiClient`, for
 * two reasons its interceptors document: an expired token is rejected with a
 * real Error carrying `status`, which the upload flow classifies as an auth
 * failure where the library's bare string would read as unknown; and a 401
 * response logs the homeowner out where a 403 deliberately does not.
 */
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
        Object.assign(new Error("Token expired"), { status: 401 }),
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
  },
);

// Every endpoint is web-core's, bound to the client above — the same wrappers
// filedgr-web-app calls, so a backend path change (the attachment PUT switch
// in 0.10.1, say) is one dependency bump here rather than a hand-edit.
const api = createFiledgrApi(apiClient, { defaultPageSize: PAGE_SIZE });

export const {
  getSingleVault,
  getSingleAttachment,
  /** Rename, describe, or archive/unarchive a record. */
  updateAttachment,
  getTemplates,
  getSingleTemplate,
  createTemplate,
  createVault,
  /** Adds a section to a vault that already exists. */
  addStreamToVault,
  uploadTemplateImage,
  updateVaultImageStatus,
} = api;

/**
 * The homes an account can see, newest first.
 *
 * `templateIds` narrows to vaults seeded under those templates; an empty list
 * asks for everything the caller holds a permission on, which is what the
 * homes list wants. web-core omits the query parameter entirely when the array
 * is empty, so this is the backend's own default rather than a filter that
 * matches everything.
 */
export const getVaults = (templateIds: string[], page: number = 1) =>
  api.getVaults(page, "", "created_at", "DESC", false, "ALL", templateIds);

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

/**
 * One page of a stream's records.
 *
 * `archived` follows the backend's reading: left out, the page holds live
 * records only; `true` includes the archived ones alongside them. There is no
 * archived-only mode.
 */
export const getStreamAttachments = (
  streamCode: string,
  page: number = 1,
  pageSize: number = PAGE_SIZE,
  archived?: boolean,
) => api.getTokenAttachments(streamCode, page, pageSize, archived);
