import { runSaga } from "../store/configureStore";
import { globalSaga } from "../containers/global/saga";
import { dashboardSaga } from "./dashboard/saga";
import { vaultsSaga } from "./vaults/saga";
import { vaultDetailSaga } from "./vaultDetail/saga";
import { serviceRecordSaga } from "./serviceRecord/saga";
import { uploadSaga } from "./upload/saga";
import { projectVaultsSaga } from "./projectVaults/saga";

export const runSagas = () => {
  runSaga(globalSaga);
  runSaga(dashboardSaga);
  runSaga(vaultsSaga);
  runSaga(vaultDetailSaga);
  runSaga(serviceRecordSaga);
  runSaga(uploadSaga);
  runSaga(projectVaultsSaga);
};
