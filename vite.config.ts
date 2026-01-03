import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import ssrPlugin from "vite-ssr-components/plugin";

export default defineConfig({
  resolve: {
    alias: {
      react: "hono/jsx/dom",
      "react-dom": "hono/jsx/dom",
      "use-sync-external-store/shim/index.js": "hono/jsx/dom",
    },
  },
  plugins: [cloudflare(), ssrPlugin(), tailwindcss()],
  server: { port: 3000 },
  build: { minify: true },
});
