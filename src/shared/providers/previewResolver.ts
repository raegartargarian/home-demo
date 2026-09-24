import type { SourceResolver } from "@filedgr/web-core/preview";
import axios, { AxiosRequestConfig } from "axios";

import { getIPFSIMGAddr, getIPFSIMGAddrPrivate } from "../utils/getIPFSAddrs";
import { LocalStorageKeys } from "../utils/localStorageHelpers";

/**
 * The coupling boundary between web-core's preview layer and this app's
 * transport.
 *
 * web-core never imports axios, localStorage or IPFS — it asks a resolver for
 * bytes or a URL and dispatches to the right renderer (image, video, audio,
 * pdf, docx, xlsx, zip, 3D, …). Everything IPFS- and auth-specific lives here.
 *
 * `source.id` is the file's CID.
 *
 * Public vaults resolve to a direct gateway URL — no fetch, no blob, no revoke.
 * Private vaults must go through an authenticated request that carries the
 * ledger context, so those resolve to an object URL the viewer releases on
 * unmount.
 */

/** The public gateway helper appends the explorer's hash route; a file URL
 *  must not carry it. Harmless in an <img>, wrong in `fetch`/pdf.js. */
const fileUrl = (cid: string, isPublic: boolean): string =>
  (isPublic ? getIPFSIMGAddr(cid) : getIPFSIMGAddrPrivate(cid)).split("#")[0];

interface PrivateAccessContext {
  txHash?: string;
  ledger?: string;
}

const privateRequestConfig = (
  ctx: PrivateAccessContext,
  responseType: AxiosRequestConfig["responseType"]
): AxiosRequestConfig => {
  const config: AxiosRequestConfig = { responseType };
  const token = localStorage.getItem(LocalStorageKeys.jwtAccessKey);
  if (token) {
    config.headers = {
      Authorization: `Bearer ${token.replace(/"/g, "")}`,
      "X-LedgerInfo": JSON.stringify({
        tx_hash: ctx.txHash,
        ledger: ctx.ledger,
      }),
    };
  }
  return config;
};

export interface PreviewResolverOptions extends PrivateAccessContext {
  /** Public vaults stream straight from the gateway; private ones need auth. */
  isPublic: boolean;
  /**
   * Already-materialised bytes (e.g. a file extracted from a zip in the
   * browser). When present every transport path short-circuits to it.
   */
  blobUrl?: string;
}

export function createPreviewResolver(
  opts: PreviewResolverOptions
): SourceResolver {
  const { isPublic, blobUrl } = opts;

  return {
    async getUrl(source) {
      if (blobUrl) return { url: blobUrl };
      if (isPublic) return { url: fileUrl(source.id, true) };

      const response = await axios.get(
        fileUrl(source.id, false),
        privateRequestConfig(opts, "blob")
      );
      const url = URL.createObjectURL(
        new Blob([response.data], {
          type: source.mimeType || "application/octet-stream",
        })
      );
      return { url, release: () => URL.revokeObjectURL(url) };
    },

    async getArrayBuffer(source) {
      if (blobUrl) return (await fetch(blobUrl)).arrayBuffer();
      const response = await axios.get(
        fileUrl(source.id, isPublic),
        isPublic
          ? { responseType: "arraybuffer" }
          : privateRequestConfig(opts, "arraybuffer")
      );
      return response.data as ArrayBuffer;
    },

    /** Public files are on a plain HTTPS gateway, so the thumbnail layer can
     *  point an <img> straight at them instead of generating a canvas tile. */
    getThumbnailUrl(source) {
      if (blobUrl) return blobUrl;
      return isPublic ? fileUrl(source.id, true) : null;
    },
  };
}
