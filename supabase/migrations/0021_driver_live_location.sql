-- Posición en vivo del conductor durante un viaje en curso, para que el pasajero sepa
-- cuándo bajar de casa (el patrón de Uber/Cabify).
--
-- Ya existía un canal de Realtime Broadcast efímero (src/features/safety/live-location.ts)
-- para "compartir trayecto en vivo", pero no sirve para esto: al ser efímero, un pasajero
-- que abre la app cuando el conductor lleva diez minutos conduciendo no ve absolutamente
-- nada hasta la siguiente emisión. Justo el momento en que más falta hace saber dónde está.
--
-- Aquí se persiste UNA fila por viaje, actualizada por el conductor cada pocos segundos.
-- Con la tabla en la publicación de Realtime, el pasajero obtiene las dos cosas con un
-- único mecanismo: lee la fila al abrir (posición inmediata) y recibe los cambios en vivo
-- mientras la tenga abierta.
--
-- El coste de escritura es modesto: con una actualización cada ~10 s, un trayecto de media
-- hora son unas 180 escrituras sobre una única fila.

create table public.trip_driver_locations (
  trip_id uuid primary key references public.trips (id) on delete cascade,
  driver_id uuid not null references public.users (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  heading double precision,
  updated_at timestamptz not null default now()
);

comment on table public.trip_driver_locations is
  'Última posición conocida del conductor en un viaje en curso. Una fila por viaje.';

alter table public.trip_driver_locations enable row level security;

-- Sólo el conductor del viaje escribe su posición, y sólo la suya.
create policy "driver writes their own live location"
  on public.trip_driver_locations for insert
  to authenticated
  with check (
    auth.uid() = driver_id
    and auth.uid() = (select driver_id from public.trips where id = trip_id)
  );

create policy "driver updates their own live location"
  on public.trip_driver_locations for update
  to authenticated
  using (auth.uid() = driver_id)
  with check (auth.uid() = driver_id);

-- La leen el propio conductor y los pasajeros que van en ese viaje. Deliberadamente se usa
-- `passengers` y no `bookings`: ahí sólo están los que el conductor ya aceptó, de modo que
-- alguien con una solicitud pendiente o rechazada no puede seguir por dónde va el coche.
create policy "trip participants read the driver location"
  on public.trip_driver_locations for select
  to authenticated
  using (
    auth.uid() = driver_id
    or auth.uid() in (
      select user_id from public.passengers where trip_id = trip_driver_locations.trip_id
    )
  );

alter publication supabase_realtime add table public.trip_driver_locations;
