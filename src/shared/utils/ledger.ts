import { IS_PRODUCTION } from "@/shared/constants/stage";
import { type LedgerId, ledgerDisplayName } from "@filedgr/web-core/ledger";

/**
 * The network name for a backend ledger value — "Polygon Amoy" on a test
 * stage, "Polygon" in production — or the raw value for a ledger web-core does
 * not know yet, so a new chain reads oddly rather than blank. Empty in, empty
 * out, so a caller can hide the row.
 */
export const ledgerName = (ledger: string | null | undefined): string =>
  ledger ? ledgerDisplayName(ledger as LedgerId, IS_PRODUCTION) : "";
