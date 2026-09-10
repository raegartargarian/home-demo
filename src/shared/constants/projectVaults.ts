/**
 * Project vaults are an option, not a given.
 *
 * The five-section Property Vault is the MVP; the architecture doc's "Event
 * Vaults" — one vault per job, gathering its paperwork whichever section it was
 * filed in — are the future vision layered on top. Whether a deployment shows
 * that layer is decided here, once, from the environment: `"true"` turns it on
 * and anything else (including an unset key) hides every trace of it, which is
 * the safe direction to fail.
 */
export const PROJECT_VAULTS_ENABLED =
  import.meta.env.VITE_PROJECT_VAULTS === "true";
