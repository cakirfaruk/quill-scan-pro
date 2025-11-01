import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { requestNotificationPermission } from "./utils/notifications";

// Request notification permission when app loads
requestNotificationPermission();

createRoot(document.getElementById("root")!).render(<App />);
