"use client";

import { useEffect, useRef } from "react";
import type { ChangeEvent } from "react";

import { Input } from "@/components/ui";
import type { InputProps } from "@/components/ui";
import { SEVILLE_BOUNDS } from "@/lib/seville-bounds";

import { useGoogleMaps } from "./GoogleMapsProvider";

export interface PlaceValue {
  address: string;
  lat: number;
  lng: number;
}

export interface PlaceAutocompleteInputProps
  extends Omit<InputProps, "onChange" | "value" | "ref"> {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: PlaceValue) => void;
}

/**
 * Address input that upgrades to a Google Places Autocomplete dropdown once the Maps
 * script is loaded (see GoogleMapsProvider) — this is how we get lat/lng for a trip's
 * origin/destination without a separate Geocoding API call. Without a real API key it's
 * a plain text input; `onPlaceSelected` simply never fires, and callers should treat the
 * lat/lng they already have (e.g. 0,0) as "not geocoded yet" — see
 * docs/04-decisiones-fase-2.md.
 */
export function PlaceAutocompleteInput({
  value,
  onChange,
  onPlaceSelected,
  hint,
  ...inputProps
}: PlaceAutocompleteInputProps) {
  const { isLoaded } = useGoogleMaps();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    // `strictBounds` es lo que de verdad filtra: sin él, `bounds` sólo prioriza los
    // resultados cercanos pero sigue ofreciendo direcciones de cualquier parte.
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry"],
      componentRestrictions: { country: "es" },
      bounds: new google.maps.LatLngBounds(
        { lat: SEVILLE_BOUNDS.south, lng: SEVILLE_BOUNDS.west },
        { lat: SEVILLE_BOUNDS.north, lng: SEVILLE_BOUNDS.east }
      ),
      strictBounds: true,
    });
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const location = place.geometry?.location;
      if (location && place.formatted_address) {
        onPlaceSelected({
          address: place.formatted_address,
          lat: location.lat(),
          lng: location.lng(),
        });
      }
    });
    autocompleteRef.current = autocomplete;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onPlaceSelected is stable enough for this one-time wiring
  }, [isLoaded]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={handleChange}
      hint={hint ?? (isLoaded ? undefined : "Escribe la dirección manualmente")}
      autoComplete="off"
      {...inputProps}
    />
  );
}
