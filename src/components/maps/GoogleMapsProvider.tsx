"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

const LIBRARIES: "places"[] = ["places"];

interface GoogleMapsContextValue {
  isLoaded: boolean;
  hasApiKey: boolean;
}

const GoogleMapsContext = createContext<GoogleMapsContextValue>({
  isLoaded: false,
  hasApiKey: false,
});

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

/**
 * Wraps the app with Google Maps JS API access. If `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
 * isn't a real key (unset, or the `.env.local` placeholder), we skip loading the script
 * entirely — map/autocomplete components fall back to a plain-text/estimated-distance
 * UI instead of failing to load Google's script. See docs/04-decisiones-fase-2.md.
 */
export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const hasApiKey = apiKey.length > 0 && apiKey !== "placeholder-google-maps-key";

  if (!hasApiKey) {
    return (
      <GoogleMapsContext.Provider value={{ isLoaded: false, hasApiKey: false }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  return (
    <LoadedGoogleMapsProvider apiKey={apiKey}>{children}</LoadedGoogleMapsProvider>
  );
}

function LoadedGoogleMapsProvider({ apiKey, children }: { apiKey: string; children: ReactNode }) {
  const { isLoaded } = useJsApiLoader({
    id: "drivy-google-maps",
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, hasApiKey: true }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
