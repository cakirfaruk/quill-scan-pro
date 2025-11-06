// Global Google Maps loader - ensures script is loaded only once

declare global {
  interface Window {
    google: any;
    googleMapsPromise?: Promise<void>;
  }
}

const GOOGLE_MAPS_API_KEY = "AIzaSyCONL709dmB9jCd3Pd2li5xACFF7qltmSI";

export const loadGoogleMaps = (): Promise<void> => {
  // If already loaded, return immediately
  if (window.google?.maps?.places) {
    return Promise.resolve();
  }

  // If loading is in progress, return the existing promise
  if (window.googleMapsPromise) {
    return window.googleMapsPromise;
  }

  // Create new loading promise
  window.googleMapsPromise = new Promise((resolve, reject) => {
    try {
      // Check if script already exists
      const existingScript = document.querySelector(
        `script[src*="maps.googleapis.com"]`
      );
      
      if (existingScript) {
        // Script exists but might not be loaded yet
        const checkLoaded = setInterval(() => {
          if (window.google?.maps?.places) {
            clearInterval(checkLoaded);
            resolve();
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkLoaded);
          reject(new Error('Google Maps loading timeout'));
        }, 10000);
        return;
      }

      // Create and load script
      const script = document.createElement("script");
      const callbackName = `gmapsCallback${Date.now()}`;
      
      (window as any)[callbackName] = () => {
        delete (window as any)[callbackName];
        resolve();
      };

      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        delete (window as any)[callbackName];
        reject(new Error('Failed to load Google Maps'));
      };

      document.head.appendChild(script);
    } catch (error) {
      reject(error);
    }
  });

  return window.googleMapsPromise;
};
