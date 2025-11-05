import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { requestNotificationPermission, registerServiceWorker } from "./utils/notifications";
import { 
  removeLoadingSpinner, 
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

// Remove loading spinner AFTER React is ready to render
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Remove spinner after first render
removeLoadingSpinner();
