import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker, checkForPWAInstall } from "./utils/pwa";

// Register service worker for PWA functionality
registerServiceWorker();

// Check for PWA install capability
checkForPWAInstall();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);