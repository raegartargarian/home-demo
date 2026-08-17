import "@/styles/main.scss";
import "@filedgr/web-core/preview/styles.css";
import "leaflet/dist/leaflet.css";
import { configureExplorer } from "@filedgr/web-core/explorer";
import { configurePreview } from "@filedgr/web-core/preview";
import occtWasmSrc from "occt-import-js/dist/occt-import-js.wasm?url";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.tsx";
import { GlobalProvider } from "./containers/global/index.tsx";
import { Web3AuthProvider } from "./containers/global/Web3AuthProvider.tsx";
import { configureAppStore } from "./store/configureStore.ts";

export const store = configureAppStore();

// web-core stays env-agnostic — it never reads `import.meta.env` — so the app
// injects the per-environment explorer base once, here.
if (import.meta.env.VITE_EXPLORER_URL) {
  configureExplorer({ baseUrl: import.meta.env.VITE_EXPLORER_URL });
}

// STEP/IGES preview runs on an OpenCascade WASM kernel. web-core defaults to a
// CDN URL; serve it from our own origin instead so it survives a strict CSP.
// Vite emits it as a hashed asset and nothing is fetched until a CAD file is
// actually opened.
configurePreview({ occtWasmSrc });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <Web3AuthProvider>
        <GlobalProvider />
        <App />
      </Web3AuthProvider>
    </Provider>
  </StrictMode>
);
