import { NETWORK_SERVER_NAMES } from "@/shared/utils/networks";
import { IProvider } from "@web3auth/modal";
export interface JSONNft {
  vault: Vault;
  data: Data;
  env: ENV_TYPE;
}
export type ENV_TYPE = "DEVELOPMENT" | "TESTNET" | "MAINNET";

interface Data {
  image: string;
  nft_name: string;
}

interface Vault {
  nftId: string;
  ledger: NETWORK_SERVER_NAMES;
  streams: Stream[];
}

interface Stream {
  trait_type: string;
  description: string;
  value: string;
}
export interface PaginatedResponse<T> {
  content: T[];
  total_records: number;
  current_page: number;
  total_pages: number;
}
export interface TokenCodeModel {
  name: string;
  value: string;
}
export interface GlobalState {
  data: JSONNft | null;
  tokenCodes: TokenCodeModel[] | null;
  authData?: {
    login: () => Promise<void>;
    isLoading: boolean;
    isAuthenticated: boolean;
    userWeb3?: UserWeb3Model;
    logout: () => Promise<void>;
    provider: IProvider | null;
    error: any;
  };
  isAuthModalOpen: boolean;
}

export interface UserWeb3Model {
  email?: string;
  name?: string;
  profileImage?: string;
  typeOfLogin?: string;
  idToken?: string;
}
