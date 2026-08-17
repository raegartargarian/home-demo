import { VaultDto } from "@/shared/types/vault";

export interface VaultsState {
  vaults: VaultDto[];
  currentPage: number;
  totalPages: number | null;
  isFirstLoading: boolean;
  isFetching: boolean;
  error: string | null;
  hasMore: boolean;
}
