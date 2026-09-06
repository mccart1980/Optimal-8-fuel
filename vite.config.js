import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/* GitHub Pages serves a project site at /<repo>/ and that path is
   case-sensitive, so the base has to match the repository name exactly.
   In CI we take it straight from GITHUB_REPOSITORY, which means renaming
   the repo fixes the site by itself on the next push. */
const REPO = (process.env.GITHUB_REPOSITORY || "mccart1980/Optimal-8-fuel").split("/")[1];
const BASE = "/" + REPO + "/";

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["apple-touch-icon.png", "favicon-32.png"],
      manifest: {
        name: "Fuel",
        short_name: "Fuel",
        description: "The fuelling companion to the Optimal 8 program.",
        id: BASE,
        start_url: BASE,
        scope: BASE,
        display: "standalone",
        orientation: "portrait",
        theme_color: "#14110D",
        background_color: "#14110D",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Everything the app is made of is precached, so it opens with no signal.
        globPatterns: ["**/*.{js,css,html,png,svg,ico,webmanifest}"],
        navigateFallback: BASE + "index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Once the fonts have been seen online they stay available offline.
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
