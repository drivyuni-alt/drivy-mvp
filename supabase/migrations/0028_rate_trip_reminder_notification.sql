-- Recordatorio para valorar al terminar un viaje.
--
-- Al finalizar un viaje no se avisaba a nadie. El sistema de valoraciones existe desde la
-- Fase 5 y es mutuo —el pasajero valora al conductor, el conductor a cada pasajero—, pero la
-- única forma de llegar a él era volver al viaje por tu cuenta y acordarte de que se podía.
-- Es también lo que explica que las valoraciones se queden a medias: nadie las pide.
--
-- `notifications.type` es un enum de Postgres, así que añadir un valor necesita migración.
--
-- `alter type ... add value` no se puede ejecutar dentro de una transacción en versiones
-- antiguas de Postgres; desde la 12 sí, siempre que el valor nuevo no se use en esa misma
-- transacción. Aquí sólo se declara: quien lo inserta es `completeTripAction`, más tarde y
-- en su propia conexión.

alter type public.notification_type add value if not exists 'rate_trip_reminder';
