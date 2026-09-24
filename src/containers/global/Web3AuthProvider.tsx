// src/containers/global/Web3AuthProvider.tsx
//
// The Web3Auth session lifecycle lives in @filedgr/web-core/auth, exactly as it
// does in filedgr-web-app. This file keeps only the env/brand/chain/login-method
// configuration and hands it to the shared provider via `buildOptions`.
// Consumers still import `useWeb3Auth` and `<Web3AuthProvider>` from here.
//
// What this replaces: a local copy of the whole provider — init, the
// rehydration race on refresh, the CONNECTED/ERRORED listener bookkeeping,
// idToken fallbacks and user normalisation. All of that is web-core's now, and
// fixes to it arrive with a version bump rather than a patch applied by hand in
// every demo.
import { IS_PRODUCTION } from "@/shared/constants/stage";
import {
  Web3AuthProvider as CoreWeb3AuthProvider,
  ResolvedTheme,
  useWeb3Auth,
} from "@filedgr/web-core/auth";
import {
  CHAIN_NAMESPACES,
  WALLET_CONNECTORS,
  WEB3AUTH_NETWORK,
  Web3AuthOptions,
} from "@web3auth/modal";
import React from "react";

export { useWeb3Auth };
export type { Web3AuthContextType } from "@filedgr/web-core/auth";

const THEME_STORAGE_KEY = "home-record-theme";

const clientId = import.meta.env.VITE_AUTH_CLIENT_ID;

const buildOptions = (resolvedTheme: ResolvedTheme): Web3AuthOptions => {
  const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: IS_PRODUCTION
      ? "0x89" // hex of 137, mainnet
      : "0x13882", // hex of 80002, polygon amoy testnet
    rpcTarget: IS_PRODUCTION
      ? import.meta.env.VITE_POLYGON_MAINNET_RPC ||
        "https://patient-attentive-moon.matic.quiknode.pro/e421f30bfdbed3036e4168567a9b21afabd9d77b/"
      : import.meta.env.VITE_POLYGON_AMOY_RPC ||
        "https://withered-hidden-meme.matic-amoy.quiknode.pro/2573d0529c060b351ab3e634c4a1d5c1b1640081/",
    displayName: IS_PRODUCTION ? "Polygon" : "Polygon Amoy Testnet",
    blockExplorerUrl: IS_PRODUCTION
      ? "https://polygonscan.com/"
      : "https://amoy.polygonscan.com/",
    ticker: "POL",
    tickerName: "Polygon Ecosystem Token",
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  };

  return {
    clientId,
    web3AuthNetwork: IS_PRODUCTION
      ? WEB3AUTH_NETWORK.SAPPHIRE_MAINNET
      : WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    chains: [chainConfig],
    defaultChainId: chainConfig.chainId,
    uiConfig: {
      appName: "Home Record",
      mode: resolvedTheme,
      defaultLanguage: "en",
      // Left on the SDK default (popup) rather than following the web app to
      // UX_MODE.REDIRECT. Redirect mode means `login()` never resolves — the
      // tab is gone — so any caller that navigates afterwards has to stash its
      // destination first. The web app has `postLoginDestination` and a
      // <PostLoginRedirect> for that; this demo does not, and `AuthModal`
      // awaits `login()`.
    },
    modalConfig: {
      connectors: {
        [WALLET_CONNECTORS.AUTH]: {
          label: "auth",
          loginMethods: {
            google: { name: "Google", showOnModal: true },
            email_passwordless: { name: "Email", showOnModal: true },
            apple: { name: "Apple", showOnModal: false },
            twitter: { name: "Twitter", showOnModal: false },
            facebook: { name: "Facebook", showOnModal: false },
            discord: { name: "Discord", showOnModal: false },
            farcaster: { name: "Farcaster", showOnModal: false },
            github: { name: "GitHub", showOnModal: false },
            reddit: { name: "Reddit", showOnModal: false },
            line: { name: "Line", showOnModal: false },
            kakao: { name: "Kakao", showOnModal: false },
            linkedin: { name: "LinkedIn", showOnModal: false },
            twitch: { name: "Twitch", showOnModal: false },
            wechat: { name: "WeChat", showOnModal: false },
            sms_passwordless: { name: "SMS", showOnModal: false },
          },
        },
      },
    },
  };
};

export const Web3AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <CoreWeb3AuthProvider
    buildOptions={buildOptions}
    themeStorageKey={THEME_STORAGE_KEY}
    preserveOnLogout={[THEME_STORAGE_KEY]}
  >
    {children}
  </CoreWeb3AuthProvider>
);
