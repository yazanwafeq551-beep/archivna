import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";
import { initAppearance } from "@/lib/appearance";
import { initNative } from "@/lib/initNative";

initAppearance();

// Fire and forget: the app renders the same either way, and blocking the
// first paint on a plugin call would trade a styled status bar for a
// longer splash.
void initNative();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
