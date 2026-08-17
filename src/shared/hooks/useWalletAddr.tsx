import { useWeb3Auth } from "@/containers/global/Web3AuthProvider";
import { useEffect, useState } from "react";

export function useWalletAddress() {
  const { provider } = useWeb3Auth() || {};
  const [walletAddress, setWalletAddress] = useState<string>("");

  useEffect(() => {
    const fetchWalletAddress = async () => {
      if (!provider) {
        setWalletAddress("");
        return;
      }

      try {
        const accounts = (await provider.request({
          method: "eth_accounts",
        })) as string[];

        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch (error) {
        console.error("Failed to retrieve wallet address:", error);
        setWalletAddress("");
      }
    };

    fetchWalletAddress();
  }, [provider]);

  return walletAddress;
}
