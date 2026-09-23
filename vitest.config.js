import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* Tests run without the PWA plugin — a service worker has no business
   inside jsdom. Everything else matches the real build. */
export default defineConfig({
  plugins: [react()],
  define: { __BUILD__: JSON.stringify("test") },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.js"],
    include: ["src/**/*.test.{js,jsx}"],
  },
});
