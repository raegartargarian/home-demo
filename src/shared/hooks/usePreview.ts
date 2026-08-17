import type { PreviewSource, SourceResolver } from "@filedgr/web-core/preview";
import { useMemo } from "react";

import { createPreviewResolver } from "../providers/previewResolver";
import { NETWORK_SERVER_NAMES } from "../utils/networks";

/**
 * The React side of the preview boundary.
 *
 * web-core's `useResolvedSource` lists both `source` and `resolver` in its
 * dependency array, so building either inline in JSX — or inside a `.map()` —
 * re-runs the resolve effect on every render, re-fetching the file each time.
 * Every call site therefore takes its source and resolver from here, where they
 * are memoised on the values that actually identify the file.
 */

/** The fields any attachment-shaped object needs for the preview layer to
 *  decide how to reach its files. */
export interface PreviewAccess {
  public_vault?: boolean;
  tx_hash?: string | null;
  ledger?: string;
}

/** The fields any file-shaped object needs to become a `PreviewSource`. */
export interface PreviewFile {
  cid?: string;
  filename?: string;
  mimetype?: string;
  size?: number;
}

/**
 * A file with no CID is not yet pinned, so there is nothing to fetch. Call
 * sites use this to fall back to a glyph instead of rendering a viewer that can
 * only fail.
 */
export const isPreviewable = (file: PreviewFile): boolean => Boolean(file.cid);

/** web-core keys its caches on `PreviewSource.id`; the CID is that identity,
 *  with a positional fallback so un-pinned rows still render something. */
export const toPreviewSource = (
  file: PreviewFile,
  fallbackId: string
): PreviewSource => ({
  id: file.cid || fallbackId,
  filename: file.filename || fallbackId,
  mimeType: file.mimetype || undefined,
  size: file.size ?? undefined,
});

/**
 * One resolver for every file on an attachment — they share an access context,
 * so there is no reason to build more than one.
 */
export const useAttachmentResolver = (
  attachment: PreviewAccess
): SourceResolver =>
  useMemo(
    () =>
      createPreviewResolver({
        isPublic: attachment.public_vault !== false,
        txHash: attachment.tx_hash ?? undefined,
        ledger: attachment.ledger as NETWORK_SERVER_NAMES,
      }),
    [attachment.public_vault, attachment.tx_hash, attachment.ledger]
  );

/** A resolver over bytes already materialised in the browser — a file
 *  extracted from a record zip, which needs no transport at all. */
export const useBlobResolver = (blobUrl?: string): SourceResolver =>
  useMemo(
    () => createPreviewResolver({ isPublic: true, blobUrl }),
    [blobUrl]
  );

/** Memoised sources for a list of files, keyed by the list identity. */
export const usePreviewSources = (
  files: PreviewFile[] | undefined
): PreviewSource[] =>
  useMemo(
    () => (files ?? []).map((file, i) => toPreviewSource(file, `file-${i}`)),
    [files]
  );

/**
 * Saves a file through the resolver.
 *
 * Private files need an authenticated fetch before they can be saved, so
 * routing both vault kinds through the resolver keeps one code path.
 */
export const downloadSource = async (
  resolver: SourceResolver,
  source: PreviewSource
): Promise<void> => {
  try {
    const { url, release } = await resolver.getUrl(source);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = source.filename;
    anchor.rel = "noopener noreferrer";
    // `download` is ignored on a cross-origin gateway URL, so without this the
    // browser navigates away from the record instead of saving the file.
    if (!url.startsWith("blob:")) anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Revoking synchronously can cancel the download before the browser has
    // read the blob.
    if (release) setTimeout(release, 10_000);
  } catch (error) {
    console.error("Failed to download file:", error);
  }
};
