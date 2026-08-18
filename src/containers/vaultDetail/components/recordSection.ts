import {
  categoryForAssetCode,
  StreamCategory,
} from "@/shared/constants/streams";
import { VaultStreamDto } from "@/shared/types/vault";
import { categoryForStream } from "@/shared/utils/streamHelpers";
import { Attachment } from "../types";

/**
 * Which of the five sections a record lives in.
 *
 * The lenses regroup records, but a record never leaves its section — so every
 * row still has to say where it is filed.
 *
 * The vault's own stream is the better answer wherever the record can be
 * matched to one, because it carries `mapping` — the taxonomy slug. The stream
 * embedded on a record carries only `asset_code`, which is a ledger identity
 * and resolves to a section on no real vault, so it is the fallback rather than
 * the first try.
 */
export const makeSectionResolver = (streams: VaultStreamDto[] = []) => {
  const streamById = new Map(streams.map((stream) => [stream.id, stream]));

  return (record: Attachment): StreamCategory | null => {
    const stream = streamById.get(record.stream_id ?? "");
    if (stream) return categoryForStream(stream);
    return categoryForAssetCode(record.stream?.asset_code);
  };
};

export type SectionResolver = ReturnType<typeof makeSectionResolver>;
