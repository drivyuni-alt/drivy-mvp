import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert } from "@/lib/supabase/types";

import type {
  CreateTripInput,
  TripSearchParams,
  TripWithDriver,
  UpcomingTripItem,
} from "./types";

/**
 * Batch-attaches driver + vehicle + driver stats to a list of trips via extra `in()`
 * queries, instead of a PostgREST embedded-resource select (`trips(*, driver:users(*))`).
 * Embedded selects need each table's `Relationships` metadata to type-check, which our
 * hand-written `Database` type (src/lib/supabase/types.ts) doesn't encode — see that
 * file's header. Flat queries keep everything simply and correctly typed.
 *
 * `driverStats` (punctuality history) is fetched here rather than on-demand by the
 * matching engine so every `TripWithDriver` consumer gets it for free — see
 * docs/05-matching.md.
 */
async function attachDriversAndVehicles(trips: Tables<"trips">[]): Promise<TripWithDriver[]> {
  if (trips.length === 0) return [];

  const supabase = createClient();
  const driverIds = [...new Set(trips.map((trip) => trip.driver_id))];
  const vehicleIds = [...new Set(trips.map((trip) => trip.vehicle_id))];

  const [
    { data: drivers, error: driversError },
    { data: vehicles, error: vehiclesError },
    { data: driverStats, error: driverStatsError },
  ] = await Promise.all([
    supabase.from("users").select("*").in("id", driverIds),
    supabase.from("vehicles").select("*").in("id", vehicleIds),
    supabase.from("user_statistics").select("*").in("user_id", driverIds),
  ]);
  if (driversError) throw driversError;
  if (vehiclesError) throw vehiclesError;
  if (driverStatsError) throw driverStatsError;

  const driverById = new Map(drivers.map((driver) => [driver.id, driver]));
  const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const statsByDriverId = new Map(driverStats.map((stats) => [stats.user_id, stats]));

  return trips.flatMap((trip) => {
    const driver = driverById.get(trip.driver_id);
    const vehicle = vehicleById.get(trip.vehicle_id);
    if (!driver || !vehicle) return []; // shouldn't happen (FK-enforced), skip defensively
    return [{ trip, driver, vehicle, driverStats: statsByDriverId.get(trip.driver_id) ?? null }];
  });
}

export async function searchTrips(params: TripSearchParams): Promise<TripWithDriver[]> {
  const supabase = createClient();
  let query = supabase
    .from("trips")
    .select("*")
    .eq("status", "scheduled")
    .gt("available_seats", 0)
    .gte("departure_at", new Date().toISOString())
    .order("departure_at", { ascending: true });

  if (params.originQuery.trim()) {
    query = query.ilike("origin_address", `%${params.originQuery.trim()}%`);
  }
  if (params.destinationQuery.trim()) {
    query = query.ilike("destination_address", `%${params.destinationQuery.trim()}%`);
  }
  if (params.date) {
    const start = new Date(`${params.date}T${params.time || "00:00"}:00`).toISOString();
    const end = new Date(`${params.date}T23:59:59`).toISOString();
    query = query.gte("departure_at", start).lte("departure_at", end);
  }

  const { data, error } = await query;
  if (error) throw error;
  return attachDriversAndVehicles(data);
}

export async function fetchTripById(id: string): Promise<TripWithDriver | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const [withDriver] = await attachDriversAndVehicles([data]);
  return withDriver ?? null;
}

export async function fetchVehiclesForUser(userId: string): Promise<Tables<"vehicles">[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchUpcomingTripsForUser(userId: string): Promise<UpcomingTripItem[]> {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  const [{ data: driverTrips, error: driverTripsError }, { data: myBookings, error: bookingsError }] =
    await Promise.all([
      supabase
        .from("trips")
        .select("*")
        .eq("driver_id", userId)
        .eq("status", "scheduled")
        .gte("departure_at", nowIso),
      supabase
        .from("bookings")
        .select("*")
        .eq("passenger_id", userId)
        .in("status", ["pending", "accepted"]),
    ]);
  if (driverTripsError) throw driverTripsError;
  if (bookingsError) throw bookingsError;

  const bookedTripIds = myBookings.map((booking) => booking.trip_id);
  const { data: passengerTrips, error: passengerTripsError } =
    bookedTripIds.length > 0
      ? await supabase
          .from("trips")
          .select("*")
          .in("id", bookedTripIds)
          .eq("status", "scheduled")
          .gte("departure_at", nowIso)
      : { data: [] as Tables<"trips">[], error: null };
  if (passengerTripsError) throw passengerTripsError;

  const bookingByTripId = new Map(myBookings.map((booking) => [booking.trip_id, booking]));

  const [driverWithInfo, passengerWithInfo] = await Promise.all([
    attachDriversAndVehicles(driverTrips),
    attachDriversAndVehicles(passengerTrips),
  ]);

  const items: UpcomingTripItem[] = [
    ...driverWithInfo.map((item) => ({ ...item, role: "driver" as const, booking: null })),
    ...passengerWithInfo.map((item) => ({
      ...item,
      role: "passenger" as const,
      booking: bookingByTripId.get(item.trip.id) ?? null,
    })),
  ];

  return items.sort(
    (a, b) => new Date(a.trip.departure_at).getTime() - new Date(b.trip.departure_at).getTime()
  );
}

/** Trips (as driver or passenger) matching the given statuses, most recent first — powers the "Completados"/"Cancelados" history tabs. */
export async function fetchTripHistoryForUser(
  userId: string,
  statuses: Tables<"trips">["status"][]
): Promise<UpcomingTripItem[]> {
  const supabase = createClient();

  const [{ data: driverTrips, error: driverTripsError }, { data: myBookings, error: bookingsError }] =
    await Promise.all([
      supabase.from("trips").select("*").eq("driver_id", userId).in("status", statuses),
      supabase.from("bookings").select("*").eq("passenger_id", userId),
    ]);
  if (driverTripsError) throw driverTripsError;
  if (bookingsError) throw bookingsError;

  const bookedTripIds = myBookings.map((booking) => booking.trip_id);
  const { data: passengerTrips, error: passengerTripsError } =
    bookedTripIds.length > 0
      ? await supabase.from("trips").select("*").in("id", bookedTripIds).in("status", statuses)
      : { data: [] as Tables<"trips">[], error: null };
  if (passengerTripsError) throw passengerTripsError;

  const bookingByTripId = new Map(myBookings.map((booking) => [booking.trip_id, booking]));

  const [driverWithInfo, passengerWithInfo] = await Promise.all([
    attachDriversAndVehicles(driverTrips),
    attachDriversAndVehicles(passengerTrips),
  ]);

  const items: UpcomingTripItem[] = [
    ...driverWithInfo.map((item) => ({ ...item, role: "driver" as const, booking: null })),
    ...passengerWithInfo.map((item) => ({
      ...item,
      role: "passenger" as const,
      booking: bookingByTripId.get(item.trip.id) ?? null,
    })),
  ];

  return items.sort(
    (a, b) => new Date(b.trip.departure_at).getTime() - new Date(a.trip.departure_at).getTime()
  );
}

export async function createTrip(input: CreateTripInput): Promise<Tables<"trips">> {
  const supabase = createClient();

  const payload: TablesInsert<"trips"> = {
    driver_id: input.driverId,
    vehicle_id: input.vehicleId,
    origin_address: input.originAddress,
    origin_lat: input.originLat,
    origin_lng: input.originLng,
    destination_address: input.destinationAddress,
    destination_lat: input.destinationLat,
    destination_lng: input.destinationLng,
    departure_at: input.departureAt,
    available_seats: input.availableSeats,
    price_per_seat: input.pricePerSeat,
    auto_accept_bookings: input.autoAcceptBookings,
    notes: input.notes || null,
  };

  const { data, error } = await supabase.from("trips").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}
