-- Retira el seguimiento en vivo del conductor que introdujo 0021.
--
-- La idea era buena (que el pasajero supiera cuándo bajar de casa), pero nunca llegó a
-- funcionar en la práctica: el navegador no entregaba una posición ni en ordenador ni en
-- móvil, con el permiso de sitio sin bloquear, los ajustes de Windows correctos y ninguna
-- cabecera que lo impidiera. La escritura en base de datos sí se verificó correcta, así que
-- el corte estaba del lado del navegador y no se logró aislar.
--
-- Se elimina en vez de dejarla apagada: una tabla vacía en la publicación de Realtime, con
-- sus políticas, es superficie que hay que seguir entendiendo y manteniendo a cambio de
-- nada. Si algún día se retoma, 0021 queda en el historial con el diseño completo.

alter publication supabase_realtime drop table public.trip_driver_locations;

drop table public.trip_driver_locations;
