// Moved to @filedgr/web-core/auth — re-exported here so existing imports keep
// working. The shared hook additionally EIP-55 checksums the address, which the
// attachment API requires for `network_owner`.
export { useWalletAddress } from "@filedgr/web-core/auth";
