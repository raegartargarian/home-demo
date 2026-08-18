import { categoryForAssetCode } from "@/shared/constants/streams";
import { VaultStreamDto } from "@/shared/types/vault";
import { formatStreamName } from "@/shared/utils/streamHelpers";
import { UploadTarget } from "./types";

/**
 * Everything the modal needs to file a record into one stream — or null when
 * the stream cannot take one: without an `asset_code` there is nothing to page
 * back afterwards, so it is not a place records can be addressed to.
 *
 * Both entry points (the vault page's section cards and the stream page) go
 * through here, so the label and the ledger fallback are resolved once.
 */
export const uploadTargetFor = (
  vaultId: string,
  stream: VaultStreamDto,
  fallbackLedger?: string
): UploadTarget | null => {
  if (!stream.asset_code) return null;

  return {
    vaultId,
    streamId: stream.id,
    assetCode: stream.asset_code,
    streamLabel:
      categoryForAssetCode(stream.asset_code)?.label ??
      formatStreamName(stream),
    ledger: stream.ledger || fallbackLedger || "",
  };
};
