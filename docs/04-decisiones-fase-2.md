# Decisiones técnicas y asunciones — Fase 2

## Decisiones

- **Escrituras privilegiadas viven en Server Actions de Next.js con el service role de
  Supabase**, no en Edge Functions. `docs/02-decisiones-fase-1.md` dejó esto como
  pregunta abierta; se resolvió a favor de Server Actions porque todo el backend "de
  aplicación" ya vive en este mismo proyecto Next.js — añadir Edge Functions habría
  significado un segundo lugar para desplegar código sin necesidad real en el MVP.
  `src/lib/supabase/admin.ts` expone el cliente con `SUPABASE_SERVICE_ROLE_KEY` con el
  import `"server-only"` (falla el build si algún día se importa por error desde un
  componente de cliente). `features/bookings/actions.ts` es el único lugar que lo usa:
  al aceptar una reserva (manual o automática) crea en una sola operación el registro en
  `passengers`, el `chat`, la notificación y descuenta `available_seats` — exactamente
  las tablas que `0008_rls_policies.sql` dejó sin policy de escritura para
  `authenticated`.
- **`/` pasa a ser la home autenticada**, no la landing de marketing de la Fase 1. El
  grupo de rutas `(main)` ya redirige a `/login` si no hay sesión, así que cumple el
  mismo propósito que la landing anterior sin necesitar una página aparte. Se eliminó
  `src/app/page.tsx` (el placeholder) para evitar el conflicto de dos `page.tsx`
  resolviendo a la misma ruta.
- **Sin selects anidados de PostgREST** (`trips(*, driver:users(*))`). Tipar
  correctamente un embedded select requiere que `Database` conozca las `Relationships`
  reales de cada tabla; como `src/lib/supabase/types.ts` las declara vacías (ver su
  cabecera), en su lugar cada función de `api.ts` hace una segunda consulta con `.in()`
  para traer conductores/vehículos/pasajeros y los combina en memoria
  (`attachDriversAndVehicles`, `fetchBookingsForTrip`). Es más código, pero cada
  resultado queda 100% tipado sin `any` ni aserciones.
- **Google Maps con degradación elegante**: `GoogleMapsProvider` sólo carga el script de
  Google si `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` es una clave real (no el placeholder de
  `.env.local`). `PlaceAutocompleteInput` cae a un `<input>` de texto normal y `RouteMap`
  muestra una tarjeta con la distancia estimada (fórmula de Haversine, sin llamar a
  ninguna API) en vez de romper la pantalla. En cuanto se configure una clave real, el
  autocompletado y el mapa interactivo funcionan sin tocar código.
- **Geocodificación vía Places Autocomplete, no Geocoding API aparte**: al elegir una
  sugerencia en `PlaceAutocompleteInput`, Google ya devuelve `formatted_address` +
  `geometry.location` en la misma respuesta, así que no hace falta una llamada
  adicional a la API de Geocoding para obtener lat/lng.
- **Alta de vehículo integrada en "Publicar viaje"**: la Fase 2 no incluye una pantalla
  de gestión de vehículos (eso encaja mejor en el perfil de la Fase 5), pero publicar un
  viaje sin vehículo no tiene sentido. `PublishTripForm` muestra `AddVehicleForm` en
  línea si el conductor no tiene ningún vehículo, y al crearlo continúa directamente con
  el formulario del viaje.
- **Heurística de matching placeholder** (`features/matching/get-recommended-trips.ts`):
  sólo usa la valoración del conductor y qué tan pronto sale el viaje. Está aislada en
  una única función (`scoreTrips`) precisamente para que la Fase 3 la sustituya sin
  tocar ningún componente de UI — todos ya consumen `ScoredTrip.matchScore` como un
  número opaco.
- **Búsqueda por texto, no por distancia geográfica**: `searchTrips` filtra con
  `ilike` sobre `origin_address`/`destination_address`. Los viajes ya guardan lat/lng
  reales, así que la Fase 3 puede cambiar a una búsqueda por radio sin migrar datos.

## Qué falta / asunciones a validar antes de Fase 3

1. **Sin edición ni cancelación de viaje/reserva todavía** — sólo publicar, buscar,
   reservar, aceptar/rechazar. Cancelar un viaje o una reserva ya aceptada (con su
   correspondiente liberación de plazas y notificación) queda para cuando se aborde el
   historial de viajes (Fase 5).
2. **El formulario de reserva no deja elegir un punto de recogida distinto al origen del
   viaje** (usa `trip.origin_address`/`destination_address` tal cual). El esquema
   (`bookings.pickup_lat/lng`) ya soporta puntos intermedios; añadir esa UX tiene más
   sentido junto al optimizador de rutas de la Fase 4.
3. **Sin Google Maps real conectado** — los mapas y el autocompletado sólo se pueden
   probar visualmente una vez se configure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` con una
   clave real de Google Cloud con Maps JavaScript API + Places API habilitadas.
4. **`available_seats` se descuenta pero nunca se repone** si una reserva aceptada se
   cancela después — de nuevo, depende de la función de cancelación pendiente.
