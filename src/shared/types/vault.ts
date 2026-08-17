export interface VaultStreamDto {
  id: string;
  asset_code?: string;
  description?: string;
  status?: string;
  tx_hash?: string | null;
  ledger?: string;
  created_at?: string;
  mapping: string;
}

export interface VaultConfigDto {
  is_permissioned?: boolean;
  is_searchable?: boolean;
  is_ai_ready?: boolean;
  is_headless?: boolean;
  is_dynamic_streams?: boolean;
  short_url?: string | null;
}

export interface VaultDto {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  status: string;
  template_id?: string;
  ledger?: string;
  tx_hash?: string | null;
  cid?: string | null;
  image_cid?: string | null;
  default_image_cid?: string | null;
  metadata_cid?: string | null;
  streams?: VaultStreamDto[];
  config?: VaultConfigDto;
  vault_permission_type?: string;
  archived?: boolean;
}

export interface PaginatedVaultsResponse {
  total_records: number;
  current_page: number;
  total_pages: number;
  content: VaultDto[];
}
