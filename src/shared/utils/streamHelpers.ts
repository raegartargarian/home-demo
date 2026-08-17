import { VaultStreamDto } from "@/shared/types/vault";

/**
 * Human-readable stream name: the mapping (or asset_code) with separators
 * removed and each word title-cased. Falls back to "Record Stream".
 */
export const formatStreamName = (stream: VaultStreamDto): string => {
  const raw = stream.mapping || stream.asset_code || "Record Stream";
  return raw.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};
