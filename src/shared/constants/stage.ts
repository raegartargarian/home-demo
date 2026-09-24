/**
 * Which backend stage this build talks to, from `VITE_ENV`. web-core stays
 * env-agnostic, so anything in it that labels differently per stage (ledger
 * names, for one) is handed this from here.
 */
export const IS_PRODUCTION = import.meta.env.VITE_ENV === "production";
