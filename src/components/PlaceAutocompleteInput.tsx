import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { loadGoogleMaps } from "@/utils/googleMaps";

interface PlaceAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: { name: string; latitude: number; longitude: number }) => void;
  placeholder?: string;
  id?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export const PlaceAutocompleteInput = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Örn: İstanbul, Türkiye",
  id = "birthPlace"
}: PlaceAutocompleteInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Load Google Maps
    loadGoogleMaps()
      .then(() => {
        if (mounted) {
          setIsLoaded(true);
          setError(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load Google Maps:', err);
        if (mounted) {
          setError(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google?.maps?.places) return;

    try {
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
          
          // Callback with place details including coordinates
          if (onPlaceSelect && place.geometry?.location) {
            onPlaceSelect({
              name: place.formatted_address,
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng(),
            });
          }
        }
      });
    } catch (err) {
      console.error('Failed to initialize autocomplete:', err);
      setError(true);
    }

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        try {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        } catch (err) {
          console.error('Failed to cleanup autocomplete:', err);
        }
      }
    };
  }, [isLoaded, onChange, onPlaceSelect]);

  // Fallback to regular input if Google Maps fails
  if (error) {
    return (
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
    );
  }

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
