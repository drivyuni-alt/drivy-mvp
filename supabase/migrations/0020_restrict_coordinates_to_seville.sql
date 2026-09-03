-- Limita viajes y recogidas a la provincia de Sevilla, que es donde arranca Drivy.
--
-- La restricción del cliente (componentRestrictions + strictBounds en
-- src/components/maps/PlaceAutocompleteInput.tsx) mejora la experiencia, pero no es una
-- garantía: viajes y reservas se insertan DIRECTAMENTE desde el navegador vía RLS, no a
-- través de un Server Action, así que llamando a la API de Supabase se podría guardar
-- cualquier coordenada. Esto sí es inevitable, igual que el trigger de teléfonos.
--
-- Los límites son espejo de src/lib/seville-bounds.ts — si se cambian, cambiarlos allí:
--   sur 36.72 · oeste -6.55 · norte 38.14 · este -4.32
--
-- Se usa un TRIGGER y no un CHECK a propósito. Quedan en la base los viajes y reservas de
-- demostración sembrados en Madrid (0009_seed_data.sql), y un CHECK —aunque se añada como
-- NOT VALID— se aplica igualmente a cualquier UPDATE posterior de esas filas. Eso
-- convertiría en una bomba de relojería algo tan normal como finalizar aquel viaje, porque
-- `completeTripAction` actualiza el estado de sus reservas y la fila fallaría la
-- comprobación. Disparando sólo en INSERT y en UPDATE *de las columnas de coordenadas*, se
-- impide todo dato nuevo fuera de Sevilla sin romper el histórico.

create or replace function public.reject_coordinates_outside_seville()
returns trigger
language plpgsql
as $$
declare
  south constant double precision := 36.72;
  north constant double precision := 38.14;
  west  constant double precision := -6.55;
  east  constant double precision := -4.32;

  outside boolean := false;
begin
  if tg_table_name = 'trips' then
    outside :=
      new.origin_lat not between south and north
      or new.origin_lng not between west and east
      or new.destination_lat not between south and north
      or new.destination_lng not between west and east;
  elsif tg_table_name = 'bookings' then
    outside :=
      new.pickup_lat not between south and north
      or new.pickup_lng not between west and east
      or new.dropoff_lat not between south and north
      or new.dropoff_lng not between west and east;
  end if;

  if outside then
    raise exception 'Por ahora Drivy solo funciona en la provincia de Sevilla. Elige una dirección de la zona.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger trips_within_seville
  before insert or update of origin_lat, origin_lng, destination_lat, destination_lng
  on public.trips
  for each row execute function public.reject_coordinates_outside_seville();

create trigger bookings_within_seville
  before insert or update of pickup_lat, pickup_lng, dropoff_lat, dropoff_lng
  on public.bookings
  for each row execute function public.reject_coordinates_outside_seville();
