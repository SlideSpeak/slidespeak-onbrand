import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    Prism: "globalThis.Prism",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@onbrand/core": fileURLToPath(new URL("../onbrand/src", import.meta.url)),
      "@onbrand/env": fileURLToPath(new URL("../env/src/index.ts", import.meta.url)),
      "@onbrand/file": fileURLToPath(new URL("../file/src/index.ts", import.meta.url)),
      "@onbrand/number": fileURLToPath(new URL("../number/src/index.ts", import.meta.url)),
      "@onbrand/string": fileURLToPath(new URL("../string/src/index.ts", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["localhost", "onbrand-dashboard"],
    strictPort: true,
    watch: {
      usePolling: true,
    },
    hmr: {
      clientPort: 5173,
      host: "localhost",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
