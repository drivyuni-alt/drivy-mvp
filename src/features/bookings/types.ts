import type { Tables } from "@/lib/supabase/types";

export type { ActionResult } from "@/types/action-result";

export interface BookingWithPassenger {
  booking: Tables<"bookings">;
  passenger: Tables<"users">;
}

export interface BookingWithTripSummary {
  booking: Tables<"bookings">;
  trip: Tables<"trips">;
  driver: Tables<"users">;
}

export interface CreateBookingInput {
  tripId: string;
  passengerId: string;
  seatsRequested: number;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  priceTotal: number;
  matchScore: number | null;
}

export type BookingDecision = "accepted" | "rejected";
