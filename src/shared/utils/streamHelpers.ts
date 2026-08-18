import {
  categoryForAssetCode,
  StreamCategory,
} from "@/shared/constants/streams";
import { VaultStreamDto } from "@/shared/types/vault";

/**
 * The slug that says which of the five sections a stream is.
 *
 * `asset_code` is the stream's identity *on the ledger* — an opaque code the
 * API pages records by. `mapping` is the template field it was seeded from, and
 * that is what carries the taxonomy slug ("property-records"). Resolving a
 * section from `asset_code` alone therefore fails on every real vault, which
 * shows up as five identically grey sections with the generic layers glyph.
 */
const streamSlug = (stream: VaultStreamDto): string | undefined =>
  stream.mapping || stream.asset_code;

/** The section a stream belongs to, or null for a stream outside the template. */
export const categoryForStream = (
  stream: VaultStreamDto,
): StreamCategory | null =>
  categoryForAssetCode(stream.mapping) ??
  categoryForAssetCode(stream.asset_code);

/**
 * Human-readable stream name: the mapping (or asset_code) with separators
 * removed and each word title-cased. Falls back to "Record Stream".
 */
export const formatStreamName = (stream: VaultStreamDto): string => {
  const raw = streamSlug(stream) || "Record Stream";
  return raw.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};
