// src/containers/global/Web3AuthProvider.tsx
import {
  CHAIN_NAMESPACES,
  CONNECTOR_EVENTS,
  IProvider,
  WALLET_CONNECTORS,
  WEB3AUTH_NETWORK,
  Web3Auth,
  Web3AuthOptions,
} from "@web3auth/modal";
import { createContext, useContext, useEffect, useRef, useState } from "react";

const clientId = import.meta.env.VITE_AUTH_CLIENT_ID;
const isProduction = (import.meta.env.VITE_ENV as string) === "production";

interface Web3AuthContextType {
  web3auth: Web3Auth | null;
  provider: IProvider | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: any;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const Web3AuthContext = createContext<Web3AuthContextType | null>(null);

export const useWeb3Auth = () => {
  return useContext(Web3AuthContext);
};

// v10's getUserInfo returns AuthUserInfo with `userId`/`authConnectionId`/etc.
// Map to the legacy field names earlier code relied on (`verifierId`, `verifier`,
// `typeOfLogin`) so nothing downstream needs to change.
const normalizeUser = (info: any, idToken?: string) => {
  if (!info && !idToken) return null;
  const merged = { ...(info || {}) };
  if (idToken) merged.idToken = idToken;
  return {
    ...merged,
    verifierId: merged.userId ?? merged.verifierId,
    verifier: merged.authConnectionId ?? merged.verifier,
    typeOfLogin: merged.authConnection ?? merged.typeOfLogin,
  };
};

// Hard cap so a stalled rehydration can never leave the app stuck on a blank
// loading screen; we fall back to whatever the SDK reports at that point.
const REHYDRATION_TIMEOUT_MS = 10_000;

// Resolve the usable provider once the connection lifecycle settles. On refresh
// v10 restores the cached session asynchronously: `web3auth.connected` flips to
// true *early* (from the cached connector name) while the provider is still
// null — the real provider only arrives with the CONNECTED event. Checking
// web3auth.connected/provider synchronously right after init() therefore saw no
// provider. We instead wait for a provider. `cachedConnector` is loaded
// synchronously from storage in the SDK constructor, so a non-null value means
// a reconnection is pending.
const waitForProvider = (web3auth: Web3Auth): Promise<IProvider | null> =>
  new Promise((resolve) => {
    if (web3auth.connected && web3auth.provider) {
      resolve(web3auth.provider);
      return;
    }
    // No persisted session → nothing will reconnect, don't wait.
    if (!web3auth.cachedConnector) {
      resolve(null);
      return;
    }

    let settled = false;
    const finish = (result: IProvider | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      web3auth.removeListener(CONNECTOR_EVENTS.CONNECTED, onConnected);
      web3auth.removeListener(CONNECTOR_EVENTS.DISCONNECTED, onFailed);
      web3auth.removeListener(CONNECTOR_EVENTS.ERRORED, onFailed);
      web3auth.removeListener(CONNECTOR_EVENTS.REHYDRATION_ERROR, onFailed);
      resolve(result);
    };
    const onConnected = (data?: { provider?: IProvider | null }) =>
      finish(data?.provider ?? web3auth.provider ?? null);
    const onFailed = () => finish(null);
    const timer = setTimeout(
      () => finish(web3auth.provider),
      REHYDRATION_TIMEOUT_MS
    );
    web3auth.on(CONNECTOR_EVENTS.CONNECTED, onConnected);
    web3auth.on(CONNECTOR_EVENTS.DISCONNECTED, onFailed);
    web3auth.on(CONNECTOR_EVENTS.ERRORED, onFailed);
    web3auth.on(CONNECTOR_EVENTS.REHYDRATION_ERROR, onFailed);
  });

export const Web3AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const initStarted = useRef(false);

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const chainConfig = {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: isProduction
            ? "0x89" // hex of 137, mainnet
            : "0x13882", // hex of 80002, polygon amoy testnet
          rpcTarget: isProduction
            ? "https://patient-attentive-moon.matic.quiknode.pro/e421f30bfdbed3036e4168567a9b21afabd9d77b/"
            : "https://withered-hidden-meme.matic-amoy.quiknode.pro/2573d0529c060b351ab3e634c4a1d5c1b1640081/",
          displayName: isProduction ? "Polygon" : "Polygon Amoy Testnet",
          blockExplorerUrl: isProduction
            ? "https://polygonscan.com/"
            : "https://amoy.polygonscan.com/",
          ticker: "POL",
          tickerName: "Polygon Ecosystem Token",
          logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
        };

        const web3AuthOptions: Web3AuthOptions = {
          clientId,
          web3AuthNetwork: isProduction
            ? WEB3AUTH_NETWORK.SAPPHIRE_MAINNET
            : WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          chains: [chainConfig],
          defaultChainId: chainConfig.chainId,
          modalConfig: {
            connectors: {
              [WALLET_CONNECTORS.AUTH]: {
                label: "auth",
                loginMethods: {
                  google: {
                    name: "Google",
                    showOnModal: true,
                  },
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
                  email_passwordless: {
                    name: "Email",
                    showOnModal: true,
                  },
                  sms_passwordless: { name: "SMS", showOnModal: false },
                },
              },
            },
          },
        };

        const web3auth = new Web3Auth(web3AuthOptions);
        await web3auth.init();
        setWeb3auth(web3auth);

        // On a page refresh v10 rehydrates the cached session *asynchronously*
        // and emits CONNECTED only after init() resolves — so checking
        // web3auth.connected synchronously here reports false. Wait for the
        // connection lifecycle to settle before deciding whether we're
        // authenticated.
        const restoredProvider = await waitForProvider(web3auth);
        if (restoredProvider) {
          setProvider(restoredProvider);
          setIsAuthenticated(true);
          const userInfo = await web3auth.getUserInfo();
          let idToken = userInfo?.idToken ?? web3auth.idToken ?? undefined;
          if (!idToken) {
            try {
              const token = await web3auth.getIdentityToken();
              idToken = token?.idToken;
            } catch (err) {
              console.warn("getIdentityToken on restore failed", err);
            }
          }
          setUser(normalizeUser(userInfo, idToken));
        }
      } catch (error: any) {
        console.error("Web3Auth initialization error:", error);
        setError(error.message || "Failed to initialize Web3Auth");
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const login = async () => {
    if (!web3auth) {
      setError("Web3Auth not initialized yet");
      return;
    }

    try {
      setError(null);
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
      setIsAuthenticated(true);
      const userInfo = await web3auth.getUserInfo();
      let idToken = userInfo?.idToken ?? web3auth.idToken ?? undefined;
      if (!idToken) {
        try {
          const token = await web3auth.getIdentityToken();
          idToken = token?.idToken;
        } catch (err) {
          console.warn("getIdentityToken failed (likely external wallet)", err);
        }
      }
      setUser(normalizeUser(userInfo, idToken));
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Failed to login");
    }
  };

  const logout = async () => {
    if (!web3auth) {
      setError("Web3Auth not initialized yet");
      return;
    }

    try {
      setError(null);
      localStorage.clear();
      await web3auth.logout();
      setProvider(null);
      setIsAuthenticated(false);
      setUser(null);
    } catch (error: any) {
      console.error("Logout error:", error);
      setError(error.message || "Failed to logout");
    }
  };

  return (
    <Web3AuthContext.Provider
      value={{
        web3auth,
        provider,
        isLoading,
        isAuthenticated,
        user,
        login,
        logout,
        error,
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
};

export const useWeb3AuthError = () => {
  const context = useWeb3Auth();
  if (!context) {
    throw new Error("useWeb3AuthError must be used within a Web3AuthProvider");
  }
  return context.error;
};
