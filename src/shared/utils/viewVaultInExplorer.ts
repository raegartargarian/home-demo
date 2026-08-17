import { txUrl } from "@filedgr/web-core/explorer";
import { NETWORK_SERVER_NAMES } from "./networks";

const DEFAULT_LEDGER: NETWORK_SERVER_NAMES = "POLYGON_ZKEVM";

export const viewTXInExplorer = (tx: string, ledger?: NETWORK_SERVER_NAMES) => {
  window.open(txUrl(tx, ledger ?? DEFAULT_LEDGER), "_blank");
};
