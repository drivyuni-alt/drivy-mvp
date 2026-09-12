-- Impide reservar más plazas de las que quedan libres en el viaje.
--
-- La comprobación existía sólo en `createBookingAction`
-- (src/features/bookings/actions.ts), es decir en la aplicación. Pero las reservas se
-- insertan DIRECTAMENTE desde el navegador vía RLS, igual que los viajes, y RLS sólo mira
-- de quién es la fila, no reglas de negocio: cualquier cliente autenticado podía insertar
-- una reserva de 99 plazas en un viaje de 4. Es el mismo agujero que ya se cerró con
-- triggers para los teléfonos en el chat (0014/0018) y para las coordenadas fuera de
-- Sevilla (0020); aquí seguía abierto.
--
-- Detalle importante de cuándo se descuenta una plaza: `trips.available_seats` NO baja al
-- crear la reserva, sino al aceptarla (`applyBookingAcceptance`). Por eso la fila que hay
-- que validar es la `pending` recién nacida, comparándola contra las plazas libres tal cual
-- están en ese momento. Las reservas ya rechazadas o canceladas no retienen nada y se
-- ignoran.
--
-- El trigger de UPDATE se limita a `seats_requested` (igual que en 0020 con las
-- coordenadas) para no disparar en las actualizaciones normales de estado. Es deliberado:
-- `completeTripAction` pone las reservas en `completed` cuando `available_seats` ya está a
-- 0, y un trigger que se disparase en cualquier UPDATE rechazaría esa fila y rompería el
-- cierre del viaje.
--
-- `seats_requested > 0` ya lo garantiza el CHECK de 0004; aquí no hace falta repetirlo.

create or replace function public.enforce_booking_seats_available()
returns trigger
language plpgsql
security definer -- necesita leer `trips` aunque la RLS del pasajero no alcance esa fila
set search_path = public
as $$
declare
  seats_left integer;
  seats_already_held integer := 0;
begin
  -- Sólo los estados que de verdad retienen plaza. Una reserva siempre nace `pending`.
  if new.status not in ('pending', 'accepted') then
    return new;
  end if;

  select available_seats into seats_left from public.trips where id = new.trip_id;
  if seats_left is null then
    return new; -- viaje inexistente: que sea la clave ajena quien lo rechace
  end if;

  -- Si la reserva ya estaba aceptada, sus plazas ya se descontaron de `available_seats`:
  -- al cambiarle el número hay que devolverlas al presupuesto antes de comparar.
  if tg_op = 'UPDATE' and old.status = 'accepted' then
    seats_already_held := old.seats_requested;
  end if;

  if new.seats_requested > seats_left + seats_already_held then
    raise exception 'No quedan plazas suficientes en este viaje (pedidas: %, disponibles: %).',
      new.seats_requested, seats_left + seats_already_held
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger bookings_seats_available
  before insert or update of seats_requested on public.bookings
  for each row execute function public.enforce_booking_seats_available();
