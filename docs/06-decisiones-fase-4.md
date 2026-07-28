# Decisiones técnicas y asunciones — Fase 4

## Chat en tiempo real

- **Mensajes en vivo por invalidación, no por parcheo manual del caché.**
  `useRealtimeMessages` (`src/features/chat/realtime.ts`) se suscribe a
  `postgres_changes` (INSERT) sobre `messages` filtrado por `chat_id`, y ante cada evento
  simplemente invalida las queries de TanStack Query (`["messages", chatId]` y
  `["chats"]`) para que se vuelvan a pedir. Es más código de red que ir insertando la
  fila nueva directamente en el caché, pero elimina una clase entera de bugs de
  duplicados/desincronización, y al volumen de mensajes de un MVP el coste es
  irrelevante.
- **"Escribiendo…" vía Realtime Broadcast, no persistido en Postgres.** Un canal
  `typing:<chatId>` efímero (`useTypingIndicator`) evita escribir en la base de datos
  algo que sólo importa mientras la pestaña está abierta.
- **Confirmación de lectura**: `messages.read_at` se marca al abrir el chat
  (`markChatMessagesRead`, sólo mensajes que no son propios). Esto obligó a añadir una
  policy de `UPDATE` que 0008 no tenía —ver `0011_messages_read_and_last_message_trigger.sql`—
  restringida a que `sender_id <> auth.uid()` (nunca puedes "leer" tu propio mensaje).
- **`chats.last_message_at` se mantiene con un trigger de Postgres**, no desde el
  cliente — así el inbox (`ChatListScreen`) puede ordenar/mostrar el último mensaje sin
  depender de que cada vía de escritura (texto, imagen, ubicación, retraso rápido)
  recuerde actualizarlo.
- **Números de teléfono bloqueados en los mensajes de texto**, para evitar que la
  conversación se salte la plataforma hacia WhatsApp. Aplicado en dos capas
  (`src/lib/phone-detection.ts` documenta la heurística exacta — una tirada de 9+
  dígitos con espacios/puntos/guiones opcionales entre cada uno):
  1. **Cliente** (`sendTextMessage` en `features/chat/api.ts`): falla al instante, sin
     ida y vuelta a red, y `MessageComposer` muestra el aviso sin borrar lo escrito.
  2. **Trigger de Postgres** (`0014_reject_phone_numbers_in_chat.sql`), que es la
     aplicación real de la restricción — los mensajes se insertan directamente desde el
     cliente del navegador vía RLS, no a través de un Server Action, así que una
     comprobación solo en el cliente se podría saltar llamando a la API de Supabase
     directamente. El trigger no se puede evitar por ningún cliente.
  Verificado en la base de datos real: un INSERT SQL directo con un teléfono se
  rechaza igual que desde la app. Limitación conocida y documentada: alguien decidido
  a saltárselo puede separar los dígitos con letras o emojis para evadir el patrón —
  es fricción real contra el caso común, no un sistema de moderación NLP infalible.
- **Compartir ubicación** usa la Geolocation API del navegador y guarda
  `location_lat/lng`; el mensaje se renderiza como un enlace a
  `google.com/maps?q=lat,lng` (sin necesidad de clave de Google Maps, es sólo una URL).
- **Compartir imágenes** sube a un bucket de Storage nuevo, `chat-attachments`
  (`0010_realtime_and_chat_storage.sql`), **privado** (a diferencia de `avatars`): las
  policies comprueban en la propia condición de Storage que el usuario sea
  `driver_id`/`passenger_id` del chat dueño de la carpeta (`<chat_id>/...`). Como el
  bucket no es público, las URLs se generan con `createSignedUrl` (7 días) en vez de
  `getPublicUrl`.
- **Requiere habilitar Realtime en el proyecto Supabase**: `messages` y `passengers` se
  añaden a la publicación `supabase_realtime` en la migración. Sin esto, el código de
  suscripción es correcto pero no recibirá ningún evento — es una asunción a validar en
  cuanto haya un proyecto real (local con `supabase start` ya lo trae activado por
  defecto para tablas añadidas a la publicación).

## Ruta inteligente

- **Orden de recogida por heurística de vecino más cercano** (`src/lib/route-planner.ts`),
  no una solución óptima real del problema del viajante ni una llamada a
  `DirectionsService.route({ optimizeWaypoints: true })`. Sin una clave real de Google
  Maps no hay Directions API disponible; el vecino-más-cercano es la aproximación
  estándar para este problema y con los 2-4 pasajeros típicos de un trayecto de
  carpooling universitario el resultado es prácticamente indistinguible del óptimo.
  Sustituirlo por una llamada real a Directions API es un cambio contenido en un único
  archivo.
- **ETA por parada** = distancia acumulada (Haversine) / velocidad media urbana (35
  km/h, la misma constante que ya usaba `lib/geo.ts` desde la Fase 2), no tráfico real.
- **El deep link a Google Maps no necesita ninguna clave.**
  `buildGoogleMapsDeepLink` construye una URL
  `https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...` —
  a diferencia del mapa interactivo embebido (que sí necesita Maps JavaScript API), un
  enlace de navegación de Google Maps es simplemente una URL pública.
- **El botón "Iniciar ruta" no bloquea duro los ~15 minutos antes de salida** que pedía
  el prompt — se muestra siempre activo, con un aviso informativo si aún falta más de
  ese margen. Bloquearlo de verdad haría imposible probar la función manualmente fuera
  de la ventana exacta; queda anotado como comportamiento a endurecer si se decide que
  es necesario en producción.
- **"Marcar como recogido" escribe directamente desde el cliente** (la policy RLS
  "driver updates the passenger roster" de la Fase 1 ya lo permite) y sólo la
  notificación al pasajero pasa por el cliente con service role — mismo patrón que el
  resto de la app: el cliente hace lo que RLS ya autoriza, el Server Action sólo cubre
  la parte que RLS deliberadamente no delega.
- **Actualización en tiempo real del estado "Recogido"** usa el mismo patrón que los
  mensajes: suscripción a `postgres_changes` (UPDATE) sobre `passengers` filtrado por
  `trip_id`, invalidando la query del roster tanto en la pantalla del conductor como en
  la del pasajero.

## Qué falta / asunciones a validar

1. **Sin Supabase real conectado** — como en fases anteriores, Realtime y Storage sólo
   se pueden probar end-to-end con un proyecto real (local vía `supabase start` o en la
   nube) con las migraciones aplicadas.
2. **El chat es 1:1 por reserva**, no un chat grupal del viaje — así se diseñó desde la
   Fase 1 (`chats.booking_id` es único). Si varios pasajeros comparten el mismo viaje,
   el conductor tiene una conversación separada con cada uno.
3. **Sin borrado ni edición de mensajes.**
4. **El cálculo de ruta se dispara una única vez al iniciar la ruta.** Si un pasajero se
   cancela o se añade uno nuevo después de "Iniciar ruta", el orden no se recalcula
   automáticamente.
