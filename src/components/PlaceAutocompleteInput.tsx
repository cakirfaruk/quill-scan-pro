import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface PlaceAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

// Declare google as a global
declare global {
  interface Window {
    google: any;
    initAutocomplete: () => void;
  }
}

export const PlaceAutocompleteInput = ({
  value,
  onChange,
  placeholder = "Örn: İstanbul, Türkiye",
  id = "birthPlace"
}: PlaceAutocompleteInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Singleton pattern for Google Maps script
    const apiKey = "AIzaSyCONL709dmB9jCd3Pd2li5xACFF7qltmSI";
    const scriptId = "google-maps-script";

    const loadScript = () => {
      // Check if already loaded in window
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        return;
      }

      // Check if script tag already exists
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        // If script exists but window.google not yet available, wait for it
        existingScript.addEventListener("load", () => setIsLoaded(true));
        return;
      }

      // Define callback function globally
      window.initAutocomplete = () => {
        setIsLoaded(true);
      };

      // Load script
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initAutocomplete`;
      script.async = true;
      script.defer = true;

      script.addEventListener("error", () => {
        console.error("Failed to load Google Maps script");
      });

      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      // Do NOT remove the script tag. Let it persist.
      // Just clean up the global callback if needed, but keeping it is safer for re-mounts.
      // delete window.initAutocomplete; 
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google) return;

    // Initialize autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["(cities)"],
        fields: ["formatted_address", "geometry", "name"]
      }
    );

    // Listen for place selection
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace();
      if (place.formatted_address) {
        onChange(place.formatted_address);
      }
    });

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onChange]);

  return (
    <Input
      ref={inputRef}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
    />
  );
};
