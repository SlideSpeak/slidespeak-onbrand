import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./packages/dashboard/src", import.meta.url)),
      "@onbrand/core": fileURLToPath(new URL("./packages/onbrand/src", import.meta.url)),
      "@onbrand/env": fileURLToPath(new URL("./packages/env/src/index.ts", import.meta.url)),
      "@onbrand/file": fileURLToPath(new URL("./packages/file/src/index.ts", import.meta.url)),
      "@onbrand/number": fileURLToPath(new URL("./packages/number/src/index.ts", import.meta.url)),
      "@onbrand/string": fileURLToPath(new URL("./packages/string/src/index.ts", import.meta.url)),
    },
  },
  test: {
    globals: true,
  },
});
