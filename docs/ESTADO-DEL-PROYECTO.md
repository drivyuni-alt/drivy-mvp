# Drivy — Estado del proyecto

> Documento de traspaso. Escrito el **11 de septiembre de 2026** para que alguien que no ha
> visto el código pueda entender el proyecto entero sin abrirlo. Refleja el estado **real**
> verificado contra el código y contra la base de datos de producción, no el plan original.

---

## 1. Visión general

**Drivy es una app de carpooling entre estudiantes universitarios.** Conecta a quien va en
coche a clase con compañeros de su misma universidad que hacen el mismo trayecto a la misma
hora. El conductor publica el viaje, los pasajeros reservan indicando dónde quieren que les
recojan, y la app calcula el orden de recogida más corto.

Arranca en **Sevilla**, con **CEU Fernando III** (Bormujos) como universidad de lanzamiento.
Está en producción y lo han probado 5 personas en un viaje real.

El problema: cientos de estudiantes recorren la misma ruta cada mañana, la mayoría solos en
su coche, mientras otros dependen de transporte público lento. Hoy eso se organiza en grupos
de WhatsApp, sin estructura ni confianza.

### Diferenciadores frente a un grupo de WhatsApp

| | Por qué importa |
|---|---|
| **Verificación universitaria** | El correo institucional confirma que quien va en ese coche es compañero tuyo. Es lo que sostiene la confianza para subirte con un desconocido. |
| **Reputación persistente** | Valoraciones por puntualidad, trato, conducción y comunicación; media visible antes de reservar. |
| **Motor de matching** | Puntúa la compatibilidad de cada viaje (distancia, hora, desvío, precio, conductor conocido) en vez de obligarte a leer 200 mensajes. |
| **Ruta óptima** | Ordena las recogidas minimizando el recorrido total. |
| **Seguridad** | Botón SOS, contacto de emergencia, reportar y bloquear usuarios. |
| **Teléfonos bloqueados en el chat** | Impide que la conversación se escape a WhatsApp y la plataforma pierda el control de la relación. |
| **Impacto medible** | Dinero y CO₂ ahorrados, logros y ranking entre universidades. |

---

## 2. Stack técnico real

### Núcleo

| Pieza | Versión instalada |
|---|---|
| Next.js (App Router) | **15.5.21** |
| React | **19.2.8** |
| TypeScript | **5.9.3** |
| Tailwind CSS | **3.4.19** |
| TanStack Query | **5.101.4** |
| Zustand | **5.0.14** |
| Framer Motion | **11.18.2** |
| @supabase/supabase-js | **2.110.8** |
| @supabase/ssr | **0.12.3** |
| @react-google-maps/api | **2.20.8** |
| pg (solo scripts) | **8.23.0** — devDependency |

### Base de datos

**Supabase (PostgreSQL gestionado).** No hay ORM: se usa el cliente de Supabase
(PostgREST) directamente, con un tipo `Database` **escrito a mano** en
`src/lib/supabase/types.ts` que replica el esquema.

> ⚠️ **Trampa crítica en ese archivo.** Los tipos `Row`/`Insert`/`Update` de cada tabla
> están declarados como `type` y **nunca deben convertirse en `interface`**, ni referenciar
> el tipo `Database` desde dentro de su propia definición. La inferencia condicional de
> `@supabase/postgrest-js` se rompe con eso y el argumento de `.update()` se resuelve
> silenciosamente a `never`. Está documentado en la cabecera del fichero.

### Servicios externos

| Servicio | Estado |
|---|---|
| **Supabase Auth** (email/contraseña + Google OAuth) | ✅ funcionando en producción |
| **Supabase Postgres + RLS** | ✅ 22 migraciones aplicadas |
| **Supabase Realtime** | ✅ activo en `messages`, `notifications`, `passengers` |
| **Supabase Storage** | ✅ dos buckets: `avatars` (público) y `chat-attachments` (privado, URLs firmadas a 7 días) |
| **Google Maps Platform** | ✅ Maps JavaScript, Places, Geocoding y Directions activas y verificadas |
| **Envío de correo (SMTP)** | ⚠️ **apaño temporal**: SMTP de Gmail con contraseña de aplicación de `drivy.uni@gmail.com`. Límite ~500/día. Supabase avisa de que es un proveedor personal, no transaccional. |
| **Pagos (Stripe)** | ❌ no implementado. Hay columnas `stripe_customer_id` y `stripe_payment_intent_id` preparadas, y la tabla `payments` acepta `method='cash'`. Hoy se paga en efectivo. |
| **Notificaciones push** | ❌ no hay. Las notificaciones son in-app (tabla `notifications` + Realtime). |
| **Apple Sign In** | ❌ retirado deliberadamente (exige Apple Developer Program, ~99 €/año). El proveedor `"apple"` sigue en el tipo `OAuthProvider` y `/auth/callback` lo soporta: reactivarlo es volver a añadir un botón. |

### Cambios respecto al plan original

1. **Apple OAuth eliminado** por coste.
2. **Seguimiento del conductor en vivo: implementado y luego retirado.** Ver §7.
3. **Chat grupal por viaje: descartado** tras evaluarlo. El chat sigue siendo 1:1 conductor↔pasajero.
4. **"Buscar" eliminado de la navegación** (la búsqueda vive en Inicio). La ruta
   `/trips/search` **sigue existiendo y no debe borrarse**: es la pantalla de resultados.
5. **`pg` añadido como devDependency**, no previsto originalmente, para scripts de
   migración y backup (ver §9).

---

## 3. Arquitectura

### Patrón

**Next.js App Router** con separación por *feature slices*. Cada funcionalidad vive en
`src/features/<nombre>/` con la misma estructura interna:

```
api.ts         consultas a Supabase desde el cliente
hooks.ts       hooks de TanStack Query que envuelven api.ts
actions.ts     Server Actions (solo donde hace falta service role)
realtime.ts    suscripciones de Supabase Realtime
types.ts       tipos del dominio
components/    componentes React de esa feature
```

**Regla de oro del proyecto:** el cliente hace directamente lo que RLS ya le autoriza; los
Server Actions cubren **solo** lo que RLS deliberadamente no delega (escribir
`notifications`, tocar reservas ajenas, decrementar plazas, desbloquear logros).

**Estado:** TanStack Query para todo lo servidor (`staleTime` 30 s, `retry` 1). Zustand se
usa únicamente para el tema claro/oscuro (`src/store/theme-store.ts`).

### Estructura de carpetas

```
src/
├── app/                        Rutas (App Router)
│   ├── (auth)/                 login, register — layout sin navegación
│   ├── (main)/                 app autenticada; el layout redirige a /login si no hay sesión
│   │   ├── page.tsx            Inicio
│   │   ├── trips/new           publicar viaje
│   │   ├── trips/search        resultados de búsqueda
│   │   ├── trips/[id]          detalle del viaje
│   │   ├── trips/history       historial
│   │   ├── chats, chats/[id]   mensajería
│   │   ├── notifications
│   │   └── profile
│   └── auth/callback/route.ts  intercambio del código OAuth por sesión
│
├── features/                   12 módulos (ver abajo)
├── components/
│   ├── ui/                     Badge, Button, Card, Input, Modal, Select, Skeleton, Textarea
│   ├── layout/                 Navbar, BottomNav, NavIcon, nav-items, ThemeEffect
│   └── maps/                   GoogleMapsProvider, PlaceAutocompleteInput, RouteMap
├── lib/
│   ├── supabase/               client, server, admin (service role), get-current-user, types
│   ├── geo.ts                  Haversine, duración estimada (35 km/h urbano)
│   ├── route-planner.ts        orden óptimo de paradas + deep link a Google Maps
│   ├── seville-bounds.ts       caja de la provincia de Sevilla
│   ├── phone-detection.ts      detector de teléfonos en el chat
│   ├── impact.ts               cálculo de € y CO₂ ahorrados
│   ├── format.ts, utils.ts, upload-avatar.ts
│   └── ...
├── store/theme-store.ts
└── types/action-result.ts
```

**Los 12 módulos de `features/`:** `auth`, `trips`, `bookings`, `chat`, `matching`,
`route-assistant`, `ratings`, `gamification`, `notifications`, `profile`, `safety`,
`vehicles`.

### Server Actions existentes (8)

| Acción | Qué hace |
|---|---|
| `createBookingAction` | Crea la reserva; si `auto_accept_bookings` está activo, la acepta al vuelo |
| `respondToBookingAction` | Aceptar/rechazar: decrementa plazas, crea `passengers` + `chats` + notificación |
| `cancelTripAction` | Cancela el viaje, cancela sus reservas vivas y avisa a los pasajeros |
| `startRouteAction` | Calcula orden de recogida y ETAs, pasa el viaje a `in_progress`, persiste la ruta, notifica |
| `markPassengerPickedUpAction` | Marca recogido + notifica |
| `completeTripAction` | Cierra viaje/reservas/roster, acredita estadísticas, reevalúa logros |
| `submitRatingAction` | Guarda valoración y recalcula la media del usuario |
| `triggerSosAction` | Alerta SOS a los participantes del viaje |

---

## 4. Base de datos

17 tablas en el esquema `public`. Entre paréntesis, filas reales hoy.

### Identidad y catálogo
- **`universities`** (7) — `name, short_name, email_domain, city, logo_url`. 3 de Madrid (semilla) + 4 de Sevilla: CEU Fernando III, US, UPO, Loyola.
- **`users`** (15) — perfil. Espejo de `auth.users` creado por el trigger `handle_new_user`. Campos: `university_id?, first_name, last_name, email, university_email?, phone?, degree?, avatar_url?, bio?, role, is_university_verified, is_identity_verified, auto_accept_bookings, emergency_contact_*, stripe_customer_id?, rating_avg, rating_count`.
- **`vehicles`** (5) — `owner_id → users`, `make, model, color, plate, seats (1-8), photo_url?`.

### Viajes
- **`routes`** (11) — origen/destino con coordenadas, `distance_meters?, duration_seconds?, polyline?, waypoints (jsonb)`.
- **`trips`** (15) — `driver_id → users`, `vehicle_id → vehicles`, `route_id? → routes`, origen/destino + coordenadas, `departure_at, available_seats, price_per_seat, status, auto_accept_bookings, notes?, started_at?, completed_at?, cancelled_at?`.
  - `status`: `scheduled | in_progress | completed | cancelled`
- **`bookings`** (20) — `trip_id`, `passenger_id`, `seats_requested`, `status`, punto de recogida y de bajada **con coordenadas**, `price_total`, `match_score?`. Único por `(trip_id, passenger_id)`.
  - `status`: `pending | accepted | rejected | cancelled | completed`
- **`passengers`** (16) — roster del viaje una vez aceptada la reserva. `pickup_order?, eta_seconds?, status (waiting | picked_up | dropped_off | no_show)`.

### Comunicación
- **`chats`** (15) — 1:1 por reserva. `booking_id` es **único y NOT NULL** (ése es el candado que habría que abrir para chats grupales). Guarda `driver_id`, `passenger_id`, `last_message_at`.
- **`messages`** (34) — `type: text | image | location | quick_delay`, `content?, image_url?, location_lat/lng?, read_at?`.
- **`notifications`** (77) — `type` (10 valores), `title, body, data (jsonb), read_at?`.

### Reputación, dinero, gamificación, seguridad
- **`ratings`** (7) — `punctuality, friendliness, driving?, communication` (1-5) + comentario.
- **`payments`** (2) — `method: card | cash`, `status`, `stripe_payment_intent_id?`.
- **`achievements`** (4) / **`user_achievements`** (23) — logros con criterio en `jsonb`.
- **`user_statistics`** (15) — `trips_as_driver/passenger, distance_km_total, money_saved_eur, co2_saved_kg, punctuality_score, total_points, level`.
- **`reports`** (0) / **`blocked_users`** (0).

### Triggers activos

| Tabla | Trigger | Para qué |
|---|---|---|
| `messages` | `reject_phone_numbers_before_message_insert` | Bloquea teléfonos (**la aplicación real** de la restricción) |
| `messages` | `on_message_created_touch_chat` | Mantiene `chats.last_message_at` |
| `trips` / `bookings` | `*_within_seville` | Rechaza coordenadas fuera de Sevilla (INSERT y UPDATE de coordenadas) |
| `bookings` | `bookings_seats_available` | Rechaza reservar más plazas de las libres (INSERT y UPDATE de `seats_requested`) |
| 7 tablas | `set_*_updated_at` | Marcas de tiempo |
| `auth.users` | `handle_new_user` | Crea el perfil y `user_statistics` leyendo `raw_user_meta_data` |

RLS activo en las 17 tablas (31 políticas).

### Migraciones

**Las 25 están aplicadas en producción.** No hay pendientes.

`0001`–`0013` esquema base, RLS, storage, realtime, reportes. Luego:

| | |
|---|---|
| `0014` | Bloqueo de teléfonos en el chat |
| `0015` | Nombre en altas por OAuth (Google manda `full_name`, no `first_name`) |
| `0016` | `universities` legible por `anon` (el registro las lee sin sesión) |
| `0017` | Universidades de Sevilla |
| `0018` | Detector de teléfonos endurecido (números escritos con palabras, símbolos raros) |
| `0019` | **El alta guarda universidad/carrera/correo/teléfono** vía metadatos |
| `0020` | Restricción geográfica a Sevilla |
| `0021` | Ubicación del conductor en vivo |
| `0022` | **Revierte 0021** (ver §7) |
| `0023` | Guarda de plazas en `bookings`: no se puede reservar más de lo que queda libre |
| `0024` | "Puntual estrella" exige 3 viajes (`min_trips`), no premiar el 100 por defecto |
| `0025` | "5 estrellas" exige los 10 viajes que ya prometía su descripción |

---

## 5. Funcionalidades implementadas

Niveles de madurez usados abajo:

- **Pulido** — probado con usuarios reales, con casos límite cubiertos
- **Funcional** — completo y verificado, pero poco rodado
- **Prototipo** — el camino feliz funciona; sin probar con gente

### 5.1 Registro y acceso — *funcional*

**Ruta:** `/register`, `/login` · **Código:** `features/auth/`

Dos vías: email/contraseña con confirmación por correo, o Google OAuth.

El formulario pide nombre, apellidos, universidad (desplegable), carrera, correo
universitario, correo de acceso, teléfono, contraseña y foto opcional.

**Detalle crítico:** todo el perfil viaja en `options.data` del `signUp` y lo escribe el
trigger `handle_new_user`, **no** un `UPDATE` posterior. Con la confirmación de correo
activada, `signUp` devuelve `user` pero **no `session`**, así que un `UPDATE` desde el
navegador iría como `anon`, RLS lo filtraría y afectaría a cero filas — que PostgREST no
reporta como error. Ese fallo silencioso dejó sin universidad al 100% de los registros
reales hasta que se arregló (migración `0019`).

**La foto es la excepción:** subirla a Storage sí exige sesión. Si no la hay, se omite en
lugar de reventar el alta.

**Limitación:** el correo sale de un Gmail personal; puede acabar en spam.

### 5.2 Publicar viaje — *funcional*

**Ruta:** `/trips/new` · **Código:** `features/trips/components/PublishTripForm.tsx`

Si el conductor no tiene vehículo, el formulario se sustituye por el alta de vehículo
(marca, modelo, color, matrícula, plazas 1-8).

Campos: origen y destino con autocompletado de Google **restringido a Sevilla**, fecha,
hora, plazas (1-7), precio por plaza, casilla de aceptación automática y notas.

**Bloquea el envío si las direcciones no se eligen del desplegable.** Escribirlas a mano no
las geocodifica, y el viaje quedaría con coordenadas inservibles e invisible para el
matching. Si Google Maps no está disponible (sin clave, sin red) se permite texto libre y se
degrada a `0,0`, que es el comportamiento documentado de reserva.

**Escritura:** directa desde el cliente vía RLS (política *"drivers manage their own
trips"*). No pasa por Server Action.

### 5.3 Buscar viajes — *funcional*

**Rutas:** `/` (formulario) → `/trips/search` (resultados) · **Código:**
`features/trips/components/{HomeScreen,SearchForm,SearchResultsScreen}.tsx`

El buscador vive en Inicio; **"Buscar" ya no está en la navegación**. `/trips/search` sigue
existiendo como pantalla de resultados y **no debe borrarse**.

Inicio muestra además: viajes activos del usuario (como conductor o pasajero) y hasta 4
sugerencias puntuadas por el motor de matching.

**Filtros de la consulta:** `status = 'scheduled'` y `departure_at >= ahora`. Los viajes ya
iniciados **no** aparecen en búsqueda (no tendría sentido ofrecer plazas de un coche que ya
salió), pero **sí** siguen en Inicio (ver 5.9).

Se excluyen los viajes propios y los de usuarios bloqueados.

### 5.4 Reservar plaza — *funcional*

**Código:** `features/bookings/components/BookingPanel.tsx` → `createBookingAction`

El modal pide **dónde recoger al pasajero** (autocompletado, opcional: vacío significa "voy
al punto de salida del conductor") y el número de plazas, y muestra el total.

Igual que al publicar, si Maps está activo **no deja escribir la dirección sin elegirla del
desplegable**.

**Server Action** porque hay que escribir en tablas que RLS no delega:
1. Valida sesión y que `available_seats >= seats_requested`
2. Inserta la reserva en `pending` con el `match_score` calculado
3. Si el viaje tiene `auto_accept_bookings`, la acepta al vuelo (mismo camino que 5.5)
4. Si no, notifica al conductor (`booking_requested`)

Restricción de unicidad `(trip_id, passenger_id)`: no se puede reservar dos veces el mismo
viaje.

### 5.5 Aceptar o rechazar — *funcional*

**Código:** `features/bookings/components/BookingRequestsPanel.tsx` → `respondToBookingAction`

El conductor ve de cada solicitud: nombre, valoración media, plazas pedidas y **📍 el punto
de recogida**, para poder juzgar el desvío antes de decidir.

Al **aceptar**, en una sola acción con service role:
1. `bookings.status = 'accepted'`
2. Decrementa `trips.available_seats` (vuelve a validar que haya sitio)
3. Crea la fila en `passengers` (el roster del viaje)
4. Crea el `chat` 1:1 conductor↔pasajero
5. Notifica al pasajero (`booking_accepted`)

Al **rechazar**: cambia el estado y notifica (`booking_rejected`). Las plazas no se tocan.

### 5.6 Chat — *funcional, sin probar entre dos usuarios simultáneos*

**Rutas:** `/chats`, `/chats/[id]` · **Código:** `features/chat/`

Es **1:1 por reserva**, no grupal (`chats.booking_id` es único y NOT NULL). Si un viaje
lleva tres pasajeros, el conductor tiene tres conversaciones.

Cuatro tipos de mensaje: `sendTextMessage`, `sendImageMessage`, `sendLocationMessage`,
`sendQuickDelayMessage` (plantillas de retraso).

- **Imágenes:** bucket privado `chat-attachments`, carpeta por `chat_id`, URL firmada a 7 días
- **Ubicación:** guarda lat/lng y se renderiza como enlace a Google Maps (no necesita clave)
- **Tiempo real:** suscripción a `postgres_changes` sobre `messages` que **invalida la
  query** en lugar de parchear la caché a mano — más red, pero elimina los duplicados
- **"Escribiendo…":** canal broadcast efímero, no se persiste
- **Leído:** `messages.read_at` al abrir el chat, solo mensajes ajenos
- **`chats.last_message_at`** lo mantiene un trigger, no el cliente

**Bloqueo de teléfonos (dos capas).** Cliente para respuesta inmediata, **y trigger de
Postgres que es la aplicación real** — los mensajes se insertan directamente desde el
navegador vía RLS, así que una comprobación solo en cliente se saltaría llamando a la API.
Detecta 9+ dígitos con separadores (` . - _ # * · •`), y también números **escritos con
palabras** ("seis uno dos…") y formas mixtas. `/` y `:` quedan fuera para no marcar fechas
ni horas. Verificado con 16 casos contra la base real.

**Limitación conocida:** evitable deletreando en otro idioma o mandando una foto. Es
fricción contra el caso común, no moderación infalible.

### 5.7 Iniciar ruta y recoger — *funcional*

**Código:** `features/route-assistant/` → `startRouteAction`

Al pulsar **"Iniciar ruta"** (solo el conductor, solo con pasajeros confirmados):

1. Calcula el **orden óptimo exacto** de recogidas (`lib/route-planner.ts`)
2. Calcula ETA por parada (distancia acumulada / 35 km/h urbano)
3. Persiste el plan en `routes.waypoints`
4. `trips.status = 'in_progress'`, `started_at = now()`
5. Escribe `pickup_order` y `eta_seconds` en cada `passengers`
6. Notifica a todos (`trip_starting_soon`) con su ETA

**Sobre el algoritmo:** antes era vecino-más-cercano, que optimiza cada tramo por separado
e **ignora el destino** — producía rutas que iban a por el pasajero más próximo y luego
obligaban a volver atrás. Ahora prueba **todas las permutaciones** (≤8 paradas; el
formulario limita a 7 plazas, así que en la práctica siempre es exacto) minimizando el
recorrido total origen→paradas→destino. Medido sobre 2.000 configuraciones aleatorias en
Sevilla con 2-5 pasajeros: el algoritmo viejo era peor en el **55,4%** de los casos, con
**4,43 km de más de media** y 28,73 km en el peor.

**Limitación:** distancia en línea recta (Haversine), no por carretera. Afinarlo exigiría
la Directions API con `optimizeWaypoints`, **imposible desde el servidor** porque la clave
está restringida por dominio.

Durante la ruta: lista ordenada de paradas con dirección y ETA, botón **"Recogido"** por
pasajero (notifica `passenger_picked_up`), deep link a Google Maps con las paradas ya
ordenadas, y estado en vivo para el pasajero.

### 5.8 Finalizar y valorar — *funcional*

**Código:** `completeTripAction` + `features/ratings/` → `submitRatingAction`

Al **finalizar**:
1. `trips.status = 'completed'`, roster a `dropped_off`, reservas a `completed`
2. Acredita `user_statistics` a todos: viajes, km, dinero ahorrado, CO₂, puntos
   (conductor +20, pasajero +10)
3. Reevalúa los logros de cada participante

**Constantes de impacto** (`lib/impact.ts`): coste alternativo **0,25 €/km**, **0,12 kg de
CO₂ por km**. Son estimaciones, no medición real.

**Valoración mutua:** puntualidad, trato, comunicación y —solo al conductor— conducción,
de 1 a 5, con comentario opcional. Recalcula `rating_avg` y `rating_count`.

### 5.9 Cancelar viaje — *funcional*

**Código:** `features/trips/components/CancelTripButton.tsx` → `cancelTripAction`

Visible solo para el conductor y solo con el viaje en `scheduled`. Tras confirmación:
marca el viaje cancelado, **cancela todas las reservas vivas** (pendientes y aceptadas) y
**notifica a cada pasajero** (`booking_cancelled`). Sin esto, un pasajero seguiría viendo
una reserva "aceptada" de un viaje que ya no existe.

**No hay forma de deshacer "Iniciar ruta"**: una vez en `in_progress`, no existe botón para
volver a `scheduled`. Hay que hacerlo por SQL.

**Viajes en curso en Inicio:** la consulta de Inicio incluye `scheduled` **e**
`in_progress`, con una ventana de 12 horas hacia atrás. Antes filtraba solo `scheduled` y
`departure_at >= ahora`, de modo que el viaje desaparecía de Inicio justo al iniciarlo y la
única vía de vuelta era la notificación.

### 5.10 Perfil, gamificación e impacto — *funcional*

**Ruta:** `/profile` · **Código:** `features/profile/`, `features/gamification/`

Estadísticas, logros, ranking entre universidades, vehículos, métodos de pago (solo
efectivo), centro de seguridad y tema claro/oscuro/sistema.

**Editable:** nombre, apellidos, **universidad**, **correo universitario**, carrera,
teléfono, bio, contacto de emergencia, aceptación automática y foto. Universidad y correo
universitario se añadieron después: sin ellos, quien se registró antes del arreglo no podía
reparar su perfil **ni llegar nunca a verificarse**.

**Verificación universitaria:** compara el dominio de `university_email` con el
`email_domain` de la universidad elegida. **No se envía ningún correo de confirmación** —
es una comprobación de dominio, no una verificación real.

**Logros** (4, con criterio en `jsonb`):

| Código | Criterio | Puntos |
|---|---|---|
| `first_trip` | 1 viaje completado | 50 |
| `punctual_star` | puntualidad > 95 **y 3 viajes completados** | 75 |
| `eco_warrior` | 20 kg de CO₂ ahorrados | 100 |
| `five_star` | media de 5,0 **y 10 viajes completados** | 150 |

**Niveles:** 200 puntos por nivel (`leveling.ts`).

### 5.11 Seguridad — *prototipo*

**Código:** `features/safety/`

- **SOS** — notifica (`sos_alert`) a todos los participantes del viaje
- **Reportar usuario** — 6 motivos, va a `reports` (0 filas: **nunca se ha usado**)
- **Bloquear usuario** — oculta sus viajes de las sugerencias
- **Contacto de emergencia** en el perfil
- **Compartir ubicación puntual** — solo pasajeros, canal broadcast efímero, se muestra como
  texto, no en el mapa

**Sin probar en situación real.** No hay moderación ni flujo de revisión de reportes: se
guardan en una tabla que nadie mira.

### 5.12 Notificaciones — *funcional*

**Ruta:** `/notifications` · **Código:** `features/notifications/`

10 tipos: `booking_requested`, `booking_accepted`, `booking_rejected`, `booking_cancelled`,
`trip_starting_soon`, `passenger_picked_up`, `new_message`, `new_rating`,
`achievement_unlocked`, `sos_alert`.

Campana con contador de no leídas, en vivo por Realtime. **Solo in-app: no hay push ni
email.** Si el usuario no tiene la app abierta, se entera al entrar.

### 5.13 Motor de matching — *funcional*

**Código:** `features/matching/scoring.ts` · **Documentación:** `docs/05-matching.md`

Puntuación 0-100 con pesos en un único sitio:

| Factor | Peso |
|---|---|
| Distancia al punto de recogida | 20 |
| Distancia al destino | 20 |
| Diferencia de hora | 15 |
| Desvío para el conductor | 12 |
| Precio (relativo al lote) | 10 |
| Duración | 8 |
| Valoración del conductor | 8 |
| Puntualidad | 5 |
| Conductor conocido | 2 |

Los factores sin datos se excluyen y el resto se renormaliza, para que la falta de contexto
no penalice (sin criterios de búsqueda, la puntuación se apoya solo en el conductor).

**No hay modelo entrenado ni IA.** Es un sistema de pesos explicables, pensado para
sustituirse por un modelo cuando haya volumen de datos. El `match_score` se guarda en cada
reserva, lo que va generando el histórico que haría falta para entrenarlo.

---

## 6. Estado operativo

| | |
|---|---|
| **Producción** | https://drivy-mvp.vercel.app |
| **Repositorio** | https://github.com/drivyuni-alt/drivy-mvp (público) |
| **Despliegue** | Vercel, automático al hacer push a `main` |
| **Supabase** | proyecto `drivy-mvp`, ref `cutsvvklbisilyaavruk`, región `eu-west-2` |
| **Google Cloud** | proyecto `drivy-503819`, prueba gratuita **hasta el 14 de noviembre de 2026** |
| **Último commit** | `77600f1` |

### Riesgos operativos conocidos

1. **Supabase se pausa por inactividad** (plan gratuito). Ya ocurrió una vez: el proyecto
   desapareció incluso del DNS, lo que parece un borrado. **Un proyecto pausado también
   pierde el registro DNS.** Es reactivable desde el panel hasta el **27 de septiembre de
   2027**. Hay un workflow de GitHub Actions (`.github/workflows/keepalive.yml`) que
   consulta la base cada 3 días y **falla a propósito si no responde**, para que llegue un
   email. Ojo: GitHub desactiva los workflows programados tras 60 días sin commits.
2. **Backups.** Solo hay el manual: `npm run backup` (`scripts/backup-db.mjs`) vuelca las 17
   tablas más `auth.users` a JSON en `backups/` (gitignored: contiene emails, mensajes y
   hashes de contraseña). El plan gratuito no da backups descargables.
3. **La clave de Google Maps está restringida por dominio**, así que **no se puede llamar
   desde el servidor**: devuelve `REQUEST_DENIED`. Por eso el orden de paradas se calcula con
   Haversine y no con la Directions API.
4. **Topes de cuota de Google sin poner.** `Map loads per day` sigue en "Ilimitado" y no se
   puede editar durante la prueba gratuita. **Hay que ponerlos (1.000/día acordado) el día
   que se pase a cuenta de pago.** Existe un presupuesto de aviso a 1 €, pero solo avisa.
5. **El correo depende de una cuenta de Gmail personal.** Funciona, pero la entregabilidad
   sufre (puede ir a spam) y no escala. **Es el cuello de botella real para captar usuarios.**

---

## 7. El intento fallido de ubicación en vivo (leer antes de reintentarlo)

Se implementó el seguimiento del conductor estilo Uber: tabla `trip_driver_locations` (una
fila por viaje, actualizada por el conductor) en la publicación de Realtime, con RLS que
solo permitía leerla al conductor y a los pasajeros **ya aceptados**. Migración `0021`.

**Nunca funcionó y se retiró** (migración `0022`, commit `77600f1`). Lo que se descartó con
pruebas:

- ✅ La base de datos permitía escribir (probado suplantando al conductor real, insert y
  `on conflict do update`)
- ✅ Las políticas RLS eran correctas (5 comprobaciones: ajeno no lee, ajeno no escribe,
  pasajero no falsea la posición del conductor)
- ✅ No había cabecera `Permissions-Policy` bloqueando
- ✅ Los ajustes de Windows y el permiso de sitio en Chrome estaban bien
- ❌ **El navegador nunca entregó una posición**, ni en escritorio ni en móvil

Se aprendieron dos cosas por el camino que conviene no repetir: **pedir la geolocalización
automáticamente al montar no funciona** (los navegadores exigen un gesto del usuario), y
**`PERMISSION_DENIED` no distingue** entre bloqueo del usuario, bloqueo del sistema
operativo y supresión del diálogo por el navegador — hay que cruzarlo con
`navigator.permissions`.

El diseño completo está en el historial (`0021` y commits `1f63f53`, `45a3e4c`, `2fe519f`).

---

## 8. Bugs conocidos y trabajo pendiente

### Sin resolver

- **Parpadeo al iniciar ruta** (reportado, no reproducido). La lista de recogidas daba un
  salto al pulsar "Iniciar ruta". Se mitigó (la mutación espera a que ambas consultas
  terminen, el roster conserva datos previos, el estado de carga ya no desmonta el panel)
  **pero no se confirmó la causa raíz**. Verificar en la próxima ruta real.
- **Duplicado de viajes.** Se publicaron dos viajes idénticos con 1,5 s de diferencia.
  Podría ser doble envío del formulario; no se ha investigado.
- El aviso de error del formulario de publicar no se borra hasta reintentar.
- **Un conductor que viaje solo no puede finalizar el viaje.** `startRouteAction` exige al
  menos un pasajero confirmado, así que un viaje sin reservas aceptadas nunca llega a
  `in_progress`, y `completeTripAction` exige `in_progress`: se queda en `scheduled` para
  siempre. No bloquea a nadie —el conductor puede cancelarlo, que es lo que en la práctica
  quiere hacer— y por eso se deja así de momento. Decidido no arreglarlo ahora.

### Sin probar de punta a punta

Chat, envío de fotos y notificaciones **con dos usuarios reales simultáneos**. Es la mayor
zona de incertidumbre que queda.

### Bloqueantes para lanzar de verdad

1. **Dominio propio + Resend** para el correo. Sin esto no se puede registrar gente en
   volumen. ~12 €/año de dominio, Resend gratis hasta 3.000/mes.
2. **Supabase Pro** (~25 $/mes) al lanzar: elimina la pausa y añade backups diarios.
3. **Textos legales.** No hay política de privacidad, términos de uso ni forma de borrar la
   cuenta. Se manejan nombres, correos, teléfonos, mensajes privados y ubicación de
   estudiantes reales en la UE. **Es el frente menos atendido del proyecto.**
4. **Encaje legal del carpooling**: compartir gastos es legal en España; obtener beneficio
   convierte el servicio en transporte de viajeros y exige licencia. El precio debe cubrir
   gastos y conviene dejarlo escrito en los términos.

### Decidido que NO se hace

Chat grupal, login con Apple, recálculo de ruta si alguien cancela a mitad, seguimiento en
vivo del conductor.

---

## 9. Cómo trabajar con este proyecto

### Entorno

`.env.local` (gitignored) con: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_APP_URL`. Las mismas están en Vercel
(Production + Preview). **Las variables nuevas no se aplican hasta un redespliegue.**

Además, sólo en local y sólo para aplicar migraciones, `SUPABASE_DB_URL` (ver más abajo).
Esa no va en Vercel.

### Migraciones: la CLI de Supabase NO funciona aquí

`npx supabase db push` falla con un error `uv_spawn` en este entorno Windows. Se aplican con
un script Node + `pg` contra la cadena de conexión del **Session pooler**
(`aws-1-eu-west-2.pooler.supabase.com:5432`), que vive en `.env.local` como
`SUPABASE_DB_URL`. La app no la usa —se conecta con `anon` y `service_role`—, así que existe
sólo para esto.

Se saca del panel de Supabase con **Connect** (botón de la barra superior) →
*Direct · Connection string* → método **Session pooler** → Type **URI**. Si se pierde la
contraseña, *Settings → Database → Reset database password* la regenera sin romper nada.

> ⚠️ **La conexión directa `db.<ref>.supabase.co` no sirve: solo resuelve por IPv6** y
> muchas redes no tienen salida IPv6. Usar siempre el pooler.

### Comprobaciones antes de dar algo por hecho

```bash
npm run typecheck
npm run lint
npm run build
npm test
```

### Tests

`npm test` usa el ejecutor de tests que trae Node (`node --test`), sin framework ni
dependencias añadidas. Node 22+ ya ejecuta TypeScript directamente; lo único que le falta es
resolver los imports sin extensión y el alias `@/`, y de eso se encarga
`tests/ts-resolver.mjs` (20 líneas). Los tests viven en `tests/*.test.ts` y no tocan Supabase
ni la red.

Hoy sólo hay uno, y es el que más falta hacía: `tests/route-planner.test.ts` fija el
escenario real que destapó que el orden de recogida era un vecino-más-cercano (25 km de más
en un trayecto con 3 pasajeros) y comprueba que `planPickupRoute` devuelve el óptimo global.
Lleva además un fuzz de 400 configuraciones con semilla fija, porque una poda mal hecha puede
fallar sólo en algunos casos. Se comprobó que detecta la regresión: forzando el heurístico,
falla.

**Verificar el despliegue por la API de GitHub, no rastreando los archivos JavaScript**: la
CDN de Vercel cachea y los ficheros de páginas autenticadas no se pueden leer desde fuera.

```bash
curl -s "https://api.github.com/repos/drivyuni-alt/drivy-mvp/deployments?per_page=1"
```

### Cultura del proyecto

- Los comentarios explican **por qué**, no qué. Muchos documentan un bug real que se pagó.
- Cada decisión no obvia queda en `docs/`.
- **Las restricciones de negocio se aplican en triggers de Postgres**, no solo en el
  cliente: viajes, reservas y mensajes se insertan directamente desde el navegador vía RLS,
  así que una comprobación en cliente se salta llamando a la API de Supabase.
- Casi todos los bugs importantes salieron de **usar la app de verdad**, no de revisar
  código. Merece la pena seguir haciendo pruebas reales.
