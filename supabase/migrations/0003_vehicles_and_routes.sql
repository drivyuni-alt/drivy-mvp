-- Vehicles owned by drivers, and the computed route geometry attached to a trip.

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  make text not null,
  model text not null,
  color text not null,
  plate text not null,
  seats integer not null check (seats between 1 and 8),
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.vehicles is 'Vehicles a driver can offer trips with.';

create trigger set_vehicles_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

create unique index vehicles_owner_plate_idx on public.vehicles (owner_id, plate);

-- A `route` is the computed geometry/ETA for a trip: origin/destination coordinates,
-- distance/duration from Google Directions, and (once the driver starts the trip in
-- Fase 4) the optimized pickup order + per-stop ETAs. Kept as its own table (instead of
-- columns on `trips`) so we can recompute/version a route without mutating trip identity,
-- and so a future "saved/frequent route" feature can reuse the same shape.
create table public.routes (
  id uuid primary key default gen_random_uuid(),
  origin_address text not null,
  origin_lat double precision not null,
  origin_lng double precision not null,
  destination_address text not null,
  destination_lat double precision not null,
  destination_lng double precision not null,
  distance_meters integer,
  duration_seconds integer,
  polyline text, -- encoded Google polyline for the base origin->destination path
  waypoints jsonb not null default '[]'::jsonb, -- ordered pickup stops once optimized, see docs/01-modelo-datos.md
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.routes is
  'Route geometry for a trip: base path from Google Directions plus, once the driver
   starts the trip, the optimized ordered list of pickup waypoints.';
comment on column public.routes.waypoints is
  'Array of {passenger_id, lat, lng, address, eta_seconds, order} objects, populated by
   the Fase 4 "ruta inteligente" pickup-order optimizer.';

create trigger set_routes_updated_at
  before update on public.routes
  for each row execute function public.set_updated_at();
