import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { requestNotificationPermission, registerServiceWorker } from "./utils/notifications";
import { 
  initPerformanceMonitoring,
  preloadCriticalResources 
} from "./utils/criticalCss";

// Preload critical resources
preloadCriticalResources();

// Register service worker and request notification permission
registerServiceWorker();
requestNotificationPermission();

// Initialize performance monitoring
if (import.meta.env.PROD) {
  initPerformanceMonitoring();
}

const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
