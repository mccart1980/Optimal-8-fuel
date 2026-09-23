import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { installStorage } from "./storage.js";
import App from "./App.jsx";

/* window.storage must exist before App's first effect runs. */
installStorage();

/* Keeping the app up to date on an iPhone.
   A home-screen app is usually resumed, not launched, so the page's load
   event may never fire again and the browser never looks for a new service
   worker. So: check on start, check whenever the app comes back to the
   front, check hourly — and reload once the new worker takes over, which
   is what actually swaps the code the screen is running. */
if ("serviceWorker" in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloading) return;   // first install claiming isn't a new version
    reloading = true;
    window.location.reload();
  });
  const update = registerSW({
    immediate: true,
    onRegisteredSW(_url, r) {
      if (!r) return;
      const check = () => { if (navigator.onLine) r.update().catch(() => {}); };
      document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
      window.addEventListener("online", check);
      setInterval(check, 60 * 60 * 1000);
    },
  });
  /* autoUpdate installs by itself; this is the belt to that brace. */
  window.__fuelUpdate = update;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
