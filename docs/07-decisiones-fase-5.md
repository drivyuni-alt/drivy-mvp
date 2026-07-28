# Decisiones técnicas y asunciones — Fase 5

## Perfil, estadísticas y pagos

- **`user_statistics` se actualiza al finalizar el viaje**, no en tiempo real durante el
  trayecto. `completeTripAction` (`features/route-assistant/actions.ts`) es el único
  punto donde `trips_as_driver/passenger`, `distance_km_total`, `money_saved_eur`,
  `co2_saved_kg` y `total_points` cambian — coherente con el patrón ya establecido de
  concentrar las escrituras derivadas en un Server Action con el cliente service role.
- **"Dinero ahorrado" y "CO₂ ahorrado" son estimaciones documentadas, no un modelo de
  verdad-terreno** (`src/lib/impact.ts`): se asume que ir en coche solo cuesta
  0,25 €/km y que un coche solo emite 0,12 kg CO₂/km, y de ahí se calcula lo "ahorrado"
  frente a lo pagado. Son constantes con nombre, en un único archivo, listas para
  ajustarse cuando haya datos reales.
- **Nivel = `floor(puntos / 200) + 1`** (`features/gamification/leveling.ts`), la
  fórmula más simple que cumple "más puntos, más nivel"; fácil de sustituir por una
  curva no lineal si hace falta más adelante.
- **Métodos de pago**: la Fase 1 ya dejó `payments` con `stripe_payment_intent_id`
  nullable y sin instalar el SDK de Stripe. Esta fase sólo añade la tarjeta "Efectivo"
  en el perfil como recordatorio visual de que no hay cobros reales — no se tocó nada
  de la arquitectura de pagos.

## Valoraciones y logros

- **`submitRatingAction` recalcula `users.rating_avg`/`rating_count` a mano** (media
  ponderada incremental) en vez de un trigger de Postgres, para mantener toda la lógica
  de negocio en el mismo sitio que el resto de Server Actions de la app.
- **Los logros se re-evalúan después de cada viaje completado y cada valoración**
  (`features/gamification/unlock-achievements.ts`), reutilizando el mismo `criteria`
  JSON que ya sembraba `supabase/seed.sql` desde la Fase 1
  (`{"type":"trips_completed","count":N}`, etc.). La función que interpreta ese JSON
  (`evaluate-achievements.ts`) es pura y no toca la base de datos — fácil de testear o
  de mover a un cron si en el futuro se prefiere evaluar logros por lotes en vez de al
  vuelo.
- **Ranking entre universidades sin vista SQL**: se agrega en el cliente (dos consultas
  planas + `reduce`), igual que el resto de la app evita selects anidados porque
  `Database["public"]["Views"]` está vacío en `src/lib/supabase/types.ts`. A la escala
  de un MVP universitario esto es perfectamente razonable; con miles de usuarios habría
  que pasar a una vista materializada.

## Seguridad

- **Verificación de correo universitario simplificada**: `verifyUniversityEmail` sólo
  compara el dominio del correo introducido contra `universities.email_domain` — no se
  envía ningún correo de confirmación real porque el MVP no tiene backend de envío de
  emails (Resend, SendGrid...). Documentado como limitación explícita, no como bug.
- **Verificación de identidad** se deja como placeholder ("Próximamente") — es un flujo
  de KYC con subida de documento y revisión manual/automática que está fuera del
  alcance razonable de este MVP.
- **"Compartir trayecto en tiempo real" es sólo dentro de la app**, no un enlace
  público externo. Las posiciones se retransmiten por un canal de Realtime Broadcast
  (`location:<trip_id>`) y nunca se persisten en Postgres — cualquier participante con
  la pantalla del viaje abierta las ve mientras dura la retransmisión. Un enlace público
  para compartir con alguien sin cuenta requeriría hacer legible `trips` (y
  potencialmente la ubicación en vivo) sin autenticación, lo que cambia el modelo de
  RLS de toda la app; se deja como extensión futura documentada, no implementada.
- **Botón SOS**: las llamadas al 112 y al contacto de emergencia son enlaces `tel:`
  puramente del lado del cliente (no requieren red); sólo "avisar a los demás
  participantes" pasa por un Server Action, porque escribir en `notifications` necesita
  el cliente con service role.
- **Bloquear usuarios filtra resultados de búsqueda y recomendaciones**
  (`HomeScreen`/`SearchResultsScreen` excluyen viajes cuyo conductor está bloqueado),
  pero es un filtro de aplicación, no de RLS — se decidió así a propósito: si fuera una
  policy de RLS, un conductor podría deducir que un pasajero lo ha bloqueado por la
  ausencia de ciertas consultas, filtrando en el cliente ese vector de información no
  se expone (ver el comentario en `0012_reports_and_blocks.sql`).
- **Reportar usuarios no tiene panel de moderación** — los reportes quedan en la tabla
  `reports` con `status: 'open'` para revisión manual futura; no hay journey de
  admin en este MVP.

## Qué falta / asunciones a validar

1. Sin Supabase real conectado — como en el resto de fases, la verificación de correo,
   Realtime de ubicación en vivo y las escrituras de service role sólo se comprueban
   end-to-end con un proyecto real.
2. Sin cancelación de viaje/reserva todavía (heredado de la Fase 2) — por eso la
   pestaña "Cancelados" del historial estará vacía hasta que exista esa función.
3. El "conductor conocido" del motor de matching (Fase 3) no excluye automáticamente a
   un conductor bloqueado del cálculo de `knownDriverIds` — en la práctica es
   irrelevante porque el bloqueo ya oculta esos viajes antes de llegar al scoring.
