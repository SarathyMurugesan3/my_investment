import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700, // optional increase
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("pdfjs-dist")) {
              return "pdf";
            }
            if (
              id.includes("hls.js") ||
              id.includes("video.js") ||
              id.includes("dashjs")
            ) {
              return "video";
            }
            return "vendor";
          }
        },
      },
    },
  },
});