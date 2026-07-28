import type { Tables } from "@/lib/supabase/types";

export interface TripWithDriver {
  trip: Tables<"trips">;
  driver: Tables<"users">;
  vehicle: Tables<"vehicles">;
  /** null only if the stats row is somehow missing (see 0008_rls_policies.sql trigger, which always creates one) */
  driverStats: Tables<"user_statistics"> | null;
}

export interface UpcomingTripItem extends TripWithDriver {
  role: "driver" | "passenger";
  booking: Tables<"bookings"> | null;
}

export interface TripSearchParams {
  originQuery: string;
  /** Set only when the passenger picked a Places Autocomplete suggestion; feeds the matching engine's distance/detour scoring. */
  originLat?: number | null;
  originLng?: number | null;
  destinationQuery: string;
  destinationLat?: number | null;
  destinationLng?: number | null;
  /** yyyy-mm-dd, matched against the local date portion of departure_at */
  date?: string;
  /** HH:mm, used as the earliest acceptable departure time when `date` is set */
  time?: string;
}

export interface CreateTripInput {
  driverId: string;
  vehicleId: string;
  originAddress: string;
  originLat: number;
  originLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  departureAt: string; // ISO timestamp
  availableSeats: number;
  pricePerSeat: number;
  autoAcceptBookings: boolean;
  notes: string;
}
