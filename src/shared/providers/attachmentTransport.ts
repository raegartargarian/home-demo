import { createAxiosAttachmentTransport } from "@filedgr/web-core/upload/axios";
import { apiClient } from "./api";

/**
 * The upload flow's coupling boundary, bound to this app's axios instance.
 *
 * Only the instance crosses over — our interceptors keep doing their job (JWT
 * expiry → logout) and the library never sees the store or localStorage. The
 * presigned PUTs deliberately bypass the authed client; see the adapter.
 *
 * Constructed lazily behind a Proxy, exactly as filedgr-web-app does it:
 * `api.ts` → `@/main` → the store → the root saga → this module → `api.ts` is a
 * circular import, so at eval time `apiClient` is still in its temporal dead
 * zone. Deferring construction to first use lets `api.ts` finish initialising.
 */
type AttachmentTransport = ReturnType<typeof createAxiosAttachmentTransport>;

let instance: AttachmentTransport | null = null;
const resolve = (): AttachmentTransport =>
  (instance ??= createAxiosAttachmentTransport(apiClient));

export const attachmentTransport = new Proxy({} as AttachmentTransport, {
  get: (_target, prop) => resolve()[prop as keyof AttachmentTransport],
});
