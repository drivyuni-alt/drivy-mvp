# Modelo de datos — Fase 1

SQL fuente de verdad en [`supabase/migrations`](../supabase/migrations), aplicado en
orden numérico. Tipos TypeScript hechos a mano en
[`src/lib/supabase/types.ts`](../src/lib/supabase/types.ts) (ver cabecera del archivo:
reemplazar por `supabase gen types typescript` en cuanto exista un proyecto real).

## Diagrama de relaciones

```
universities 1───∞ users
users 1───∞ vehicles
users 1───∞ trips (driver_id)
vehicles 1───∞ trips
routes 1───1 trips (route_id, nullable hasta que se calcula)

trips 1───∞ bookings
users 1───∞ bookings (passenger_id)
bookings 1───1 passengers   (roster operativo, sólo si la reserva fue aceptada)
bookings 1───1 chats        (se crea al aceptar la reserva)
chats 1───∞ messages

trips 1───∞ ratings
bookings 1───∞ ratings      (una valoración por dirección: pasajero→conductor y conductor→pasajero)
bookings 1───1 payments

users 1───∞ notifications
users ∞───∞ achievements    (vía user_achievements)
users 1───1 user_statistics
```

## Por qué `bookings` Y `passengers` son tablas separadas

Es la decisión de esquema menos obvia, así que queda documentada aquí:

- **`bookings`** es la negociación: "quiero N plazas en este viaje". Tiene estados que
  incluyen `pending` y `rejected`, y puede no llegar nunca a materializarse en un viaje
  real.
- **`passengers`** es el roster operativo de un viaje ya confirmado: sólo existe para
  reservas `accepted`, y es lo que la pantalla de "ruta inteligente" (Fase 4) lee y
  escribe en tiempo real — orden de recogida, ETA, estado `waiting/picked_up/dropped_off`.

Separarlas evita mezclar el ciclo de vida de "negociar una plaza" (bookings) con el de
"gestionar un viaje en curso" (passengers), que tienen dueños distintos en la UI
(pasajero negocia, conductor opera) y cambian a ritmos distintos.

## Por qué `routes` es su propia tabla en vez de columnas en `trips`

`routes` guarda la geometría calculada por Google Directions (distancia, duración,
polyline) y, una vez el conductor pulsa "Iniciar ruta", el orden optimizado de paradas
(`waypoints`, JSONB). Mantenerla separada de `trips` permite recalcular/versionar una
ruta sin tocar la identidad del viaje, y deja la puerta abierta a una futura función de
"rutas guardadas/frecuentes" que reutilice la misma forma de datos.

## RLS (Row Level Security)

Política general, ver `0008_rls_policies.sql` para el detalle completo:

- Datos "de perfil" (`users`, `vehicles`, `trips`, `universities`, `achievements`,
  `user_statistics`) son legibles por cualquier usuario autenticado — las pantallas de
  búsqueda/matching/detalle de viaje necesitan mostrar info del conductor y del vehículo
  antes de que exista ninguna relación (reserva) entre ambos usuarios.
- Datos transaccionales (`bookings`, `passengers`, `chats`, `messages`, `payments`,
  `notifications`) sólo son legibles/escribibles por sus participantes.
- Filas que sólo debería escribir código de servidor de confianza (transiciones de
  estado de `payments`, creación de `notifications`, actualización de
  `user_statistics`, desbloqueo de `achievements`) no tienen policy de
  `insert`/`update` para el rol `authenticated` — esas escrituras deben pasar por el
  *service role* de Supabase desde una Server Action o Edge Function, nunca desde el
  cliente del navegador. **Asunción a validar**: en Fase 2 habrá que decidir si esas
  escrituras viven en Server Actions de Next.js o en Edge Functions de Supabase.

## Seed de datos

`supabase/seed.sql` crea 3 universidades, 6 usuarios (3 conductores, 3 pasajeros) con
perfiles completos, 3 vehículos, 2 rutas, 3 viajes (2 programados a futuro, 1
completado), reservas en distintos estados, el roster de pasajeros correspondiente, un
chat con mensajes, valoraciones de un viaje completado, pagos de ejemplo (sin Stripe),
notificaciones, catálogo de logros con desbloqueos, y estadísticas por usuario. Se
ejecuta automáticamente con `supabase db reset` (CLI de Supabase, requiere Docker) y da
una base realista para probar cualquier pantalla sin depender de datos de producción.
