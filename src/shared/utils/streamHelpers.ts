import {
  categoryForAssetCode,
  categoryOrder,
  customCategoryFor,
  StreamCategory,
  toSectionSlug,
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

/**
 * The section a stream belongs to.
 *
 * One of the five where the slug says so. Otherwise a section someone named
 * themselves, which is not part of the taxonomy but is still a real section
 * with records in it — so it gets a label, a glyph and one of the spare
 * accents rather than being drawn as an anonymous grey row.
 *
 * Null only when there is no slug at all, which is a stream the backend has
 * not finished setting up.
 */
export const categoryForStream = (
  stream: VaultStreamDto,
): StreamCategory | null => {
  const known =
    categoryForAssetCode(stream.mapping) ??
    categoryForAssetCode(stream.asset_code);
  if (known) return known;

  const slug = toSectionSlug(streamSlug(stream) ?? "");
  return slug ? customCategoryFor(slug) : null;
};

/**
 * Human-readable stream name: the mapping (or asset_code) with separators
 * removed and each word title-cased. Falls back to "Record Stream".
 */
export const formatStreamName = (stream: VaultStreamDto): string => {
  const raw = streamSlug(stream) || "Record Stream";
  return raw.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

/** A stream paired with the section it resolves to, or null for an outsider. */
export interface StreamWithCategory {
  stream: VaultStreamDto;
  category: StreamCategory | null;
}

/**
 * Streams in reading order, each with its section resolved.
 *
 * The backend returns them in arbitrary order and the five-section
 * architecture has a fixed one. Unrecognised streams sort last so an
 * off-template stream is still reachable rather than hidden.
 *
 * Shared by the section cards and the structure sidebar, which would otherwise
 * be free to disagree about the order of the same five things on one screen.
 */
export const sortedSections = (
  streams: VaultStreamDto[],
): StreamWithCategory[] =>
  streams
    .map((stream) => ({ stream, category: categoryForStream(stream) }))
    .sort((a, b) => categoryOrder(a.category) - categoryOrder(b.category));
