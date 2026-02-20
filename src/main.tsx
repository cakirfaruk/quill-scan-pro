import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = createRoot(document.getElementById("root")!);

// Remove loading spinner before rendering (inlined to avoid static import of criticalCss)
const spinner = document.querySelector('.loading-spinner');
if (spinner) {
  spinner.classList.add('fade-out');
  setTimeout(() => spinner.remove(), 300);
}

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Defer all non-critical initialization AFTER render
const deferInit = () => {
  // Service worker, notifications, font preload, perf monitoring
  import("./utils/notifications").then(({ registerServiceWorker, requestNotificationPermission }) => {
    registerServiceWorker();
    requestNotificationPermission();
  });
  import("./utils/criticalCss").then(({ preloadCriticalResources, initPerformanceMonitoring }) => {
    preloadCriticalResources();
    if (import.meta.env.PROD) {
      initPerformanceMonitoring();
    }
  });
};

if ('requestIdleCallback' in window) {
  (window as any).requestIdleCallback(deferInit);
} else {
  setTimeout(deferInit, 2000);
}
