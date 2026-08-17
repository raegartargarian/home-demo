import { VaultDto } from "@/shared/types/vault";

export interface VaultDetailState {
  vault: VaultDto | null;
  isLoading: boolean;
  error: string | null;
}

/** Service-record (attachment) shape used by the stream accordion and the
 * service-record list card. The full detail-page shape lives in
 * src/containers/serviceRecord/types.ts. */
export interface Attachment {
  id: string;
  name?: string;
  description?: string | null;
  created_at?: string;
  status?: string;
  file_count?: number;
  size?: number;
  /** `cid` is optional: the list endpoint omits it for records that have not
   *  finished pinning. Present, it lets the card render a real thumbnail
   *  (video frame, photo, first PDF page) instead of a type glyph. */
  files?: Array<{ filename?: string; mimetype?: string; cid?: string }>;
  tx_hash?: string | null;
  ledger?: string;
  public_vault?: boolean;
}
