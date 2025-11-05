import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { requestNotificationPermission, registerServiceWorker } from "./utils/notifications";

// Register service worker and request notification permission
registerServiceWorker();
requestNotificationPermission();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
