# Motor de matching IA — Fase 3

Código: [`src/features/matching/scoring.ts`](../src/features/matching/scoring.ts)
(algoritmo), [`types.ts`](../src/features/matching/types.ts) (contexto y tipos),
[`api.ts`](../src/features/matching/api.ts) /
[`hooks.ts`](../src/features/matching/hooks.ts) (datos que alimentan el contexto).

## Qué reemplaza

Fase 2 dejó un placeholder (`get-recommended-trips.ts`) que sólo miraba la valoración
del conductor y qué tan pronto salía el viaje, documentado explícitamente como
temporal. Esta fase lo sustituye por una heurística ponderada con los factores que
pedía el prompt original, aislada detrás de una única función —
`scoreTrips(trips, context)` — para que **sustituirla por un modelo entrenado en el
futuro no requiera tocar ningún componente de UI**, sólo el cuerpo de esa función y de
sus factores internos.

## Los 9 factores y sus pesos

| Factor | Peso | Qué mide | Cómo se calcula sin backend de rutas real |
|---|---|---|---|
| Distancia a recogida | 20 | ¿Qué tan cerca sale el viaje de donde quiere salir el pasajero? | Haversine entre el origen buscado y `trip.origin_lat/lng`; 100 pts a 0 km, 0 pts a ≥10 km |
| Distancia a destino | 20 | ¿Qué tan cerca llega el viaje de a dónde quiere ir el pasajero? | Igual que arriba, sobre destino |
| Hora de salida | 15 | ¿Coincide con la hora deseada? | Diferencia en minutos entre `departure_at` y la hora buscada; 100 pts a 0 min, 0 pts a ≥180 min |
| Desvío para el conductor | 12 | ¿Le pilla de paso al conductor recoger aquí? | Distancia *cross-track* (perpendicular a la línea origen→destino del viaje) del punto de recogida buscado — fórmula esférica de "cross-track distance", sin necesidad de la Directions API |
| Duración | 8 | ¿El viaje no da muchas vueltas respecto a lo que tardaría el pasajero yendo directo? | Ratio entre la duración estimada del viaje (Haversine + velocidad media) y la duración directa del propio trayecto del pasajero; 100 pts hasta 1.2x, 0 pts a partir de 2.5x |
| Precio | 10 | ¿Es barato relativo a las demás opciones de esta búsqueda? | Normalización min-max del precio dentro del propio lote de resultados (no un umbral fijo) |
| Valoración del conductor | 8 | Historial de valoraciones | `rating_avg / 5 * 100`; conductores sin valoraciones aún reciben 70 (neutral) en vez de 0 |
| Puntualidad histórica | 5 | `user_statistics.punctuality_score` | Directo, ya está en escala 0–100 |
| Conductor conocido | 2 | ¿El pasajero ya ha viajado (y completado) con este conductor? | Bonus binario 0/100 según si `driver_id` aparece en su historial de reservas completadas |

Los pesos suman 100 y viven en `MATCH_WEIGHTS` (un único objeto, fácil de retocar).

**Plazas disponibles** se pidió como factor en el prompt, pero se trata como **filtro
duro** (`available_seats > 0` y `>= seats_requested`) en `searchTrips`, no como
puntuación continua — un viaje sin plazas no es "menos compatible", es simplemente no
reservable. Queda anotado como candidato a convertirse en un factor continuo (más
plazas libres = más margen) si en el futuro se prioriza flexibilidad sobre disponibilidad
estricta.

## Degradación elegante con contexto parcial

No todas las pantallas tienen la misma información sobre lo que quiere el pasajero:

- **Búsqueda** (`/trips/search`): tiene origen, destino, fecha y hora reales → los 9
  factores aplican.
- **Home** (`/`) y **reserva desde el detalle de viaje**: el pasajero no ha escrito una
  búsqueda todavía → no hay coordenadas ni hora deseada.

En vez de forzar esos factores a 0 (lo que penalizaría injustamente cualquier viaje
cuando simplemente no sabemos qué busca el pasajero), `combineScores()` **excluye los
factores sin dato y renormaliza los pesos restantes** para que sigan sumando 100. Con
cero contexto en absoluto, el score cae a un neutral fijo (50) en vez de a 0.

Esto es la pieza central del diseño: `MatchingContext` (`searchOrigin`,
`searchDestination`, `desiredDepartureAt`, `knownDriverIds`) es un objeto con todo
opcional, y cada función de factor devuelve `number | null` — `null` significa "no
puedo opinar sobre esto todavía", no "puntuación mínima".

## El badge en el listado

`MatchScoreBadge` (`src/features/matching/components/MatchScoreBadge.tsx`) muestra
"⭐ NN% Compatible" con color `brand` a partir de 90%, `success` a partir de 75%, y
neutral por debajo. `scoreTrips()` ya devuelve los resultados ordenados de mayor a
menor compatibilidad, así que el mejor viaje siempre encabeza el listado sin lógica
adicional en los componentes.

## Cómo se sustituiría por un modelo entrenado

1. **Recolectar señal de verdad-terreno**: cada vez que un pasajero reserva, acepta o
   ignora un viaje recomendado, registrar `(features, acción)`. Las `features` son
   exactamente las mismas nueve entradas que ya calcula `scoreTrip` (podemos loguear el
   `ScoreBreakdown` completo), así que no hace falta rediseñar el pipeline de datos, sólo
   empezar a persistirlo (tabla `matching_events`, no incluida todavía).
2. **Entrenar un modelo tabular simple primero** (regresión logística o gradient
   boosting sobre los 9 features) para predecir "probabilidad de que el pasajero
   reserve este viaje" en vez de una suma ponderada a mano. Un modelo tabular pequeño ya
   supera a pesos fijos porque aprende interacciones (p. ej. que el precio importa menos
   cuando el conductor es muy puntual).
3. **Sustitución sin tocar UI**: `scoreTrips(trips, context)` seguiría siendo la única
   función que importan los componentes. Su nueva implementación llamaría a un endpoint
   de inferencia (o cargaría el modelo en el propio proceso Node) en vez de calcular la
   suma ponderada, pero devolvería el mismo `ScoredTrip[]` con `matchScore` 0–100.
4. **Mantener la heurística como fallback**: si el modelo no tiene suficientes datos
   para un usuario nuevo (cold start) o el servicio de inferencia falla, caer de vuelta
   a `scoreTrips` actual es razonable — por eso vale la pena dejarla tal cual, no
   borrarla, cuando llegue ese momento.

## Qué falta / asunciones a validar

1. **Sin tabla de eventos de matching todavía** — es el primer paso real antes de poder
   entrenar nada (punto 1 de arriba).
2. **El `matchScore` guardado en `bookings.match_score`** es el de la puntuación con el
   contexto disponible *en el momento de reservar*, no se recalcula después — es
   intencional (es un registro histórico), pero significa que no sirve para medir la
   calidad del algoritmo actual sin cruzarlo con qué contexto tenía cada pasajero en
   ese momento.
3. **La distancia cross-track mide contra la línea infinita**, no contra el segmento
   origen–destino — un punto muy alejado "por detrás" del origen o "por delante" del
   destino puede leerse como "en la ruta". Con una API de rutas real (Fase 4+) esto se
   sustituiría por el desvío real que calcula el propio Directions API.
