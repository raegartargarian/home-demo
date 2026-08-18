import { VaultsState } from "@/containers/vaults/types";
import { DashboardState } from "../containers/dashboard/types";
import { GlobalState } from "../containers/global/types";
import { VaultDetailState } from "@/containers/vaultDetail/types";
import { ServiceRecordState } from "@/containers/serviceRecord/types";
import { UploadState } from "@/containers/upload/types";

export interface RootState {
  global: GlobalState;
  dashboard: DashboardState;
  vaults: VaultsState;
  vaultDetail: VaultDetailState;
  serviceRecord: ServiceRecordState;
  upload: UploadState;
}
