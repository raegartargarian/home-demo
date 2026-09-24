import { txUrl } from "@filedgr/web-core/explorer";
import type { LedgerId } from "@filedgr/web-core/ledger";

const DEFAULT_LEDGER: LedgerId = "POLYGON_ZKEVM";

export const viewTXInExplorer = (tx: string, ledger?: string | null) => {
  window.open(txUrl(tx, ledger || DEFAULT_LEDGER), "_blank");
};
