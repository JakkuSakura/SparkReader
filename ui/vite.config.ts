import { defineConfig } from "vite-plus";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/health": "http://127.0.0.1:8765",
      "/accounts": "http://127.0.0.1:8765",
      "/folders": "http://127.0.0.1:8765",
      "/messages": "http://127.0.0.1:8765",
      "/conversations": "http://127.0.0.1:8765",
      "/attachments": "http://127.0.0.1:8765",
    },
  },
  build: {
    outDir: "dist",
  },
});
