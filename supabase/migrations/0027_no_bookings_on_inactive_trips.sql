-- Un viaje que ya no está programado no admite reservas nuevas.
--
-- Salió al probar la cancelación con reservas vivas: el conductor cancela, los pasajeros
-- reciben su aviso y sus reservas pasan a `cancelled`... y el viaje sigue aceptando
-- reservas nuevas tan tranquilo. Comprobado con un pasajero sin reserva previa insertando
-- vía RLS sobre el viaje ya cancelado: entró, y nació en `pending`, esperando una respuesta
-- de un conductor que ya había dado el viaje de baja.
--
-- No es tan difícil de alcanzar como parece. El buscador sólo lista viajes `scheduled`, pero
-- a la pantalla de un viaje se llega por enlace directo, desde el historial o desde una
-- notificación antigua, y ahí el panel de reserva se sigue pintando.
--
-- La comprobación va también en `createBookingAction` (src/features/bookings/actions.ts),
-- que es donde el usuario recibe el mensaje decente. Esto es la garantía de debajo, por lo
-- de siempre en este proyecto: las reservas se insertan directamente desde el navegador vía
-- RLS, y RLS sólo mira de quién es la fila.
--
-- Sólo en INSERT, deliberadamente. `completeTripAction` actualiza las reservas a `completed`
-- cuando el viaje ya está `in_progress` o `completed`, y `cancelTripAction` las pasa a
-- `cancelled` con el viaje ya `cancelled`: un trigger que se disparase en UPDATE rompería
-- las dos cosas.

create or replace function public.reject_booking_on_inactive_trip()
returns trigger
language plpgsql
security definer -- necesita leer `trips` aunque la RLS del pasajero no alcance esa fila
set search_path = public
as $$
declare
  estado public.trip_status;
begin
  select status into estado from public.trips where id = new.trip_id;
  if estado is null then
    return new; -- viaje inexistente: que sea la clave ajena quien lo rechace
  end if;

  if estado <> 'scheduled' then
    raise exception 'Este viaje ya no admite reservas (está %).', estado
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger bookings_trip_must_be_scheduled
  before insert on public.bookings
  for each row execute function public.reject_booking_on_inactive_trip();
