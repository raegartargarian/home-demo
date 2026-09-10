import { ProcessedHomeData } from "@/shared/utils/zipHandler";

export interface AttachmentFileModel {
  id?: string;
  filename?: string;
  mimetype?: string;
  created_at?: string;
  status?: string;
  hash?: string;
  size?: number;
  cid?: string;
}

export interface AttachmentStreamModel {
  id?: string;
  asset_code?: string;
  description?: string;
  ledger?: string;
  tx_hash?: string | null;
  status?: string;
}

export interface AttachmentModel {
  id?: string;
  name?: string;
  description?: string | null;
  created_at?: string;
  ledger?: string;
  status?: string;
  presigned_url?: string | null;
  stream_id?: string;
  filename?: string;
  tx_hash?: string | null;
  upload_as_zip?: boolean;
  size?: number;
  stream?: AttachmentStreamModel;
  file_count?: number;
  files?: AttachmentFileModel[];
  public_vault?: boolean;
  archived?: boolean;
}

export interface ServiceRecordState {
  attachment: AttachmentModel | null;
  recordData: ProcessedHomeData | null;
  isLoading: boolean;
  isProcessingZip: boolean;
  error: string | null;
  /** An archive or restore request is in flight. */
  isArchiving: boolean;
  /** Why the last archive or restore failed; cleared when the next one starts. */
  archiveError: string | null;
}
