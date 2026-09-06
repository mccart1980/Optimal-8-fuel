import React from "react";
import { createRoot } from "react-dom/client";
import { installStorage } from "./storage.js";
import App from "./App.jsx";

/* window.storage must exist before App's first effect runs. */
installStorage();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
