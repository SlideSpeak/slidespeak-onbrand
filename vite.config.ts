import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  build: {
    target: "node22",
    ssr: "src/mcp-server/stdio.ts",
    outDir: "dist",
    rollupOptions: {
      output: {
        banner: "#!/usr/bin/env node",
        entryFileNames: "stdio.js",
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
