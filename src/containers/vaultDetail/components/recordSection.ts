import {
  categoryForAssetCode,
  StreamCategory,
} from "@/shared/constants/streams";
import { VaultStreamDto } from "@/shared/types/vault";
import { Attachment } from "../types";

/**
 * Which of the five sections a record lives in.
 *
 * The lenses regroup records, but a record never leaves its section — so every
 * row still has to say where it is filed. The vault-wide list embeds the stream;
 * the per-stream list does not, so fall back to the vault's own streams by id.
 */
export const makeSectionResolver = (streams: VaultStreamDto[] = []) => {
  const codeByStreamId = new Map(
    streams.map((stream) => [stream.id, stream.asset_code])
  );

  return (record: Attachment): StreamCategory | null =>
    categoryForAssetCode(
      record.stream?.asset_code ?? codeByStreamId.get(record.stream_id ?? "")
    );
};

export type SectionResolver = ReturnType<typeof makeSectionResolver>;
