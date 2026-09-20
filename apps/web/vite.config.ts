import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  /*
   * The packaged app has no dev proxy and no same-domain API, so an empty
   * VITE_API_URL there is not a harmless fallback: it sends every request to
   * the local server holding the bundle, which answers index.html at status
   * 200. The app then throws on its first call and looks broken for no
   * visible reason. Fail the build instead of shipping that.
   */
  if (mode === "native") {
    const env = loadEnv(mode, __dirname, "VITE_");
    for (const key of ["VITE_API_URL", "VITE_PUBLIC_WEB_URL"] as const) {
      if (!env[key]) {
        throw new Error(
          `${key} is required for a native build. Set it in apps/web/.env.native.`
        );
      }
    }
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    /*
     * base stays "/". Capacitor serves from a local origin at the root, not
     * from file://, so "./" would resolve assets against the current path and
     * any reload on /archives/123 would ask for /archives/assets/... and 404.
     */
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
  };
});
