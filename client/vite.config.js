import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
    "process.env": {},
  },
  optimizeDeps: {
    exclude: ["@thirdweb-dev/contracts-js"],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  server: {
    proxy: {
      "/ipfs": {
        target: "https://ipfs.io",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ipfs/, ""),
      },
    },
  },
});
