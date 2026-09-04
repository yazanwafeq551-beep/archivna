import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        /*
         * Keep the big, rarely changing libraries in their own chunks so they
         * stay cached across deploys instead of being invalidated by every
         * application change.
         */
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],
          i18n: ["i18next", "react-i18next"],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
