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
  // Pin the dev server to the whitelisted Web3Auth origin. Without strictPort,
  // Vite silently moves to 5174/5175 when 5173 is busy — an origin that is not
  // whitelisted for this client ID, so login fails the redirect check with
  // "could not validate redirect, please whitelist your domain". Failing to
  // start is much easier to diagnose than logging in against the wrong origin.
  server: {
    port: 5173,
    strictPort: true,
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
