-- Un conductor no puede tener dos viajes activos idénticos.
--
-- En producción aparecieron dos viajes iguales publicados con 1,5 s de diferencia. Al
-- investigarlo se reprodujo: el botón de publicar se deshabilita mientras la mutación está
-- en curso, pero se reactiva en cuanto el insert responde, y el formulario sigue en pantalla
-- hasta que Next termina de navegar a la pantalla del viaje. En ese hueco —287 ms medidos en
-- local, segundos en un móvil con mala cobertura— el formulario está otra vez activo, con
-- los mismos datos y sin ninguna señal de que haya pasado algo. Quien vuelve a pulsar
-- publica un gemelo.
--
-- El arreglo de fondo está en el cliente (PublishTripForm.tsx). Esto es la red debajo, por
-- la misma razón que los triggers de teléfonos (0014/0018), coordenadas (0020) y plazas
-- (0023): los viajes se insertan directamente desde el navegador vía RLS, así que ninguna
-- regla que viva sólo en React es una garantía. Cubre además el caso que el cliente no puede
-- cubrir: el insert llega al servidor, la respuesta se pierde por el camino y el navegador
-- reintenta.
--
-- Un índice único y no un trigger con ventana temporal, a propósito. Dos inserts separados
-- 27 ms son transacciones distintas: en READ COMMITTED la segunda no ve la fila de la
-- primera si aún no ha confirmado, así que un `select ... where created_at > now() - 10s`
-- dentro de un trigger deja pasar justo la carrera que se quiere impedir. El índice único no
-- tiene esa rendija.
--
-- Parcial sobre los estados activos: un viaje cancelado no reserva el hueco, de modo que el
-- conductor que se arrepiente puede volver a publicar exactamente el mismo trayecto. Los
-- completados quedan fuera por lo mismo — son historia, no ocupan el calendario.
--
-- Comprobado antes de crearlo que no hay ninguna fila real que lo incumpla.

create unique index trips_no_duplicate_active_idx
  on public.trips (driver_id, origin_lat, origin_lng, destination_lat, destination_lng, departure_at)
  where status in ('scheduled', 'in_progress');

comment on index public.trips_no_duplicate_active_idx is
  'Impide publicar dos veces el mismo viaje (doble envío del formulario). Sólo sobre viajes
   activos: cancelar y volver a publicar el mismo trayecto sigue siendo posible.';
