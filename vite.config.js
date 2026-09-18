import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const devApiUrl = "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [vue()],
  root: "client",
  base: "",
  resolve: {
    alias: [
      /*
       * markdown-it-katex is CommonJS, so its `require("katex")` resolves to
       * KaTeX's UMD build. Bundling that build corrupts the lone surrogate
       * escapes in KaTeX's lexer regex (\uD800 becomes U+FFFD), which makes
       * every backslash command fail with "Undefined control sequence: \s".
       * KaTeX's ESM build survives bundling, so point everything at it.
       *
       * The pattern is anchored: a bare "katex" alias would also rewrite the
       * "katex/dist/katex.min.css" import.
       */
      { find: /^katex$/, replacement: "katex/dist/katex.mjs" },
    ],
  },
  server: {
    // Note: The FLATNOTES_PATH_PREFIX environment variable is not supported by the dev server
    port: 8080,
    proxy: {
      "/api/": {
        target: devApiUrl,
        changeOrigin: true,
      },
      "/attachments/": {
        target: devApiUrl,
        changeOrigin: true,
      },
      "/docs": {
        target: devApiUrl,
        changeOrigin: true,
      },
      "/openapi.json": {
        target: devApiUrl,
        changeOrigin: true,
      },
      "/health": {
        target: devApiUrl,
        changeOrigin: true,
      },
    },
  },
});
