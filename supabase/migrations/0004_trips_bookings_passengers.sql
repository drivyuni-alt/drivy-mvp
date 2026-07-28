-- Trips a driver publishes, the booking requests passengers make against them, and the
-- operational passenger roster used once a trip is confirmed and, later, in progress.

create type public.trip_status as enum (
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.users (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  route_id uuid references public.routes (id) on delete set null,
  origin_address text not null,
  origin_lat double precision not null,
  origin_lng double precision not null,
  destination_address text not null,
  destination_lat double precision not null,
  destination_lng double precision not null,
  departure_at timestamptz not null,
  estimated_arrival_at timestamptz,
  available_seats integer not null check (available_seats >= 0),
  price_per_seat numeric(6, 2) not null check (price_per_seat >= 0),
  status public.trip_status not null default 'scheduled',
  auto_accept_bookings boolean not null default false,
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.trips is 'A trip published by a driver, open for passengers to book seats on.';

create trigger set_trips_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

create index trips_driver_id_idx on public.trips (driver_id);
create index trips_departure_at_idx on public.trips (departure_at);
create index trips_status_idx on public.trips (status);

create type public.booking_status as enum (
  'pending',
  'accepted',
  'rejected',
  'cancelled',
  'completed'
);

-- A booking is the passenger-facing request/negotiation record: "I want N seats on this
-- trip". It carries its own pickup/dropoff (which may differ from the trip's origin/
-- destination, e.g. a stop along the way) so the matching engine and route optimizer can
-- reason per-passenger.
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  passenger_id uuid not null references public.users (id) on delete cascade,
  seats_requested integer not null default 1 check (seats_requested > 0),
  status public.booking_status not null default 'pending',
  pickup_address text not null,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  dropoff_address text not null,
  dropoff_lat double precision not null,
  dropoff_lng double precision not null,
  price_total numeric(7, 2) not null check (price_total >= 0),
  match_score integer check (match_score between 0 and 100), -- score at the time the passenger booked, see docs/03-matching.md
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, passenger_id)
);

comment on table public.bookings is
  'Passenger request for seats on a trip, and its accept/reject lifecycle.';
comment on column public.bookings.match_score is
  'AI compatibility score (0-100) shown to the passenger when they booked. Historical
   record, not recomputed after booking.';

create trigger set_bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

create index bookings_trip_id_idx on public.bookings (trip_id);
create index bookings_passenger_id_idx on public.bookings (passenger_id);
create index bookings_status_idx on public.bookings (status);

create type public.passenger_status as enum (
  'waiting',
  'picked_up',
  'dropped_off',
  'no_show'
);

-- Once a booking is accepted, a `passengers` row represents that passenger's live state
-- on the trip roster: their computed pickup order, ETA, and pickup/drop-off progress.
-- Kept separate from `bookings` because a booking is the negotiation (can be rejected,
-- never "picked up"), while `passengers` only exists for confirmed seats and is what the
-- Fase 4 "ruta inteligente" screen reads/writes in real time.
create table public.passengers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  pickup_order integer,
  eta_seconds integer,
  status public.passenger_status not null default 'waiting',
  picked_up_at timestamptz,
  dropped_off_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.passengers is
  'Operational roster of confirmed passengers for a trip, used by the driver''s live
   pickup flow (order, ETA, picked-up/dropped-off status).';

create trigger set_passengers_updated_at
  before update on public.passengers
  for each row execute function public.set_updated_at();

create index passengers_trip_id_idx on public.passengers (trip_id);
