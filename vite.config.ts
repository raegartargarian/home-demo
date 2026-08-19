import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Web3Auth's dependency graph relies on Node built-ins (buffer/stream/crypto)
    // and process/global. Without these polyfills Vite's dep optimizer produces a
    // broken @web3auth/modal bundle (missing named exports at runtime).
    nodePolyfills({
      include: ["buffer", "stream", "crypto"],
      globals: {
        Buffer: true,
        global: true,
      },
      overrides: {
        process: path.resolve(__dirname, "node_modules/process/browser.js"),
      },
    }),
  ],
  // 5173 preferred, not pinned. It is the origin whitelisted for this Web3Auth
  // client ID, so it is the port login works on — but `strictPort` made a busy
  // port a hard startup failure, which came up more often than the login
  // problem it was guarding against.
  //
  // The trade is worth knowing: if 5173 is taken, Vite moves to 5174/5175 and
  // starts fine, and then **login fails** its redirect check with "could not
  // validate redirect, please whitelist your domain". If you see that, look at
  // the port in the address bar before looking anywhere else — the dev server
  // prints it on startup.
  server: {
    port: 5173,
  },
  build: {
    outDir: "build", // Change the output directory to 'build'
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      process: path.resolve(__dirname, "node_modules/process/browser.js"),
    },
  },
});
