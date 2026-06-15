import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  build: {
    target: "node22",
    ssr: "packages/mcp-server/src/server/http.ts",
    outDir: "packages/mcp-server/dist",
    rollupOptions: {
      output: {
        banner: "#!/usr/bin/env node",
        entryFileNames: "http.js",
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
