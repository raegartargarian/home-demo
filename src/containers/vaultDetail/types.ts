import { VaultDto } from "@/shared/types/vault";

export interface VaultDetailState {
  vault: VaultDto | null;
  isLoading: boolean;
  error: string | null;
  /** Every record in the vault, for the Timeline and Projects lenses. Paged
   *  separately from the vault itself, which the Sections lens alone needs. */
  records: VaultRecordsState;
}

export interface VaultRecordsState {
  items: Attachment[];
  currentPage: number;
  totalPages: number | null;
  isLoading: boolean;
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
  /** Present on the vault-wide list, which is not scoped to one stream. */
  stream_id?: string;
  stream?: { asset_code?: string };
}
