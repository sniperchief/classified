import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// WebZjs uses multi-threaded WASM (SharedArrayBuffer), which browsers only
// allow on cross-origin-isolated pages. These headers must also be set by the
// production host (see vercel.json / public/_headers).
const isolation = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { headers: isolation },
  preview: { headers: isolation },
  // WebZjs is not bundled: it is served as-is from /webzjs (scripts/copy-webzjs.mjs)
  // because its worker helpers import each other circularly.
  worker: { format: "es" },
  build: { target: "es2022" },
});
