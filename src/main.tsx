import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handler for production debugging
window.addEventListener('error', (event) => {
  console.error('🔴 GLOBAL ERROR:', event.error);
  console.error('🔴 MESSAGE:', event.message);
  console.error('🔴 FILENAME:', event.filename);
  console.error('🔴 LINENO:', event.lineno);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 UNHANDLED PROMISE REJECTION:', event.reason);
});

// Log that app is starting
console.log('🚀 App starting...');

try {
  const root = document.getElementById("root");
  if (!root) {
    throw new Error('Root element not found!');
  }
  
  console.log('✅ Root element found, rendering app...');
  
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('🔴 FATAL ERROR during app initialization:', error);
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; background: #f3f4f6;">
      <div style="background: white; padding: 30px; border-radius: 8px; max-width: 500px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h1 style="color: #ef4444; margin: 0 0 16px 0; font-size: 24px;">Uygulama Başlatılamadı</h1>
        <p style="color: #6b7280; margin: 0 0 16px 0;">Bir hata oluştu. Lütfen sayfayı yenileyin.</p>
        <pre style="background: #f9fafb; padding: 12px; border-radius: 4px; overflow: auto; font-size: 12px; color: #374151;">${error}</pre>
        <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; margin-top: 16px; font-size: 14px;">Sayfayı Yenile</button>
      </div>
    </div>
  `;
}
