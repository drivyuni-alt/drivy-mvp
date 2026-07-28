# Decisiones técnicas y asunciones — Fase 1

## Decisiones

- **Next.js 15 + React 19 + App Router.** Versión estable más reciente en el momento de
  construir el MVP; App Router porque el resto del stack (Server Components, Server
  Actions futuras, `@supabase/ssr`) está diseñado para él.
- **`@supabase/ssr`** (no `@supabase/auth-helpers-nextjs`, que está deprecado) para los
  clientes de browser/servidor y el middleware de refresco de sesión.
- **Sin librería de componentes de terceros** (no shadcn/ui, no Radix): el design system
  vive 100% en `src/components/ui` con Tailwind + `clsx`/`tailwind-merge`, tal y como
  pedía el prompt original. Esto da control total sobre el look Uber/Airbnb/Linear que
  se busca, a cambio de construir accesibilidad (foco, `aria-*`, Escape en modales) a
  mano — ya cubierto en `Modal`, `Input` y `Select`.
- **`buttonVariants()` exportado junto a `<Button>`**: Next.js `<Link>` no debe anidarse
  dentro de un `<button>` (HTML inválido, rompe la hidratación). Cualquier CTA que
  navegue usa `<Link className={buttonVariants(...)}>` en vez de envolver el `Link` en
  un `Button`.
- **Tipos de Supabase escritos a mano** en vez de generados: no hay todavía un proyecto
  Supabase real conectado. El archivo deja dicho en su cabecera el comando exacto
  (`supabase gen types typescript`) para sustituirlo en cuanto exista.
- **Pagos**: se modela `payments` con `stripe_payment_intent_id` nullable y `status`
  gestionado manualmente; no se instala el SDK de Stripe ni se piden claves. La UI de
  Fase 2+ puede mostrar "pago en efectivo" sin bloquear el flujo de reserva.
- **Storage**: bucket `avatars` público en lectura, con policies que restringen la
  escritura a `avatars/<user_id>/...` (ver `0009_storage.sql`). Suficiente para Fase 1;
  un bucket para fotos de vehículo se añadirá cuando el formulario de "publicar viaje"
  (Fase 2) lo necesite.

## Qué falta / asunciones a validar antes de Fase 2

1. **Sin proyecto Supabase real conectado todavía.** `.env.example` documenta las
   variables necesarias; hasta que se rellene `.env.local` con un proyecto real (o se
   levante Supabase local con Docker vía `supabase start`), el registro/login no
   funcionará end-to-end aunque el código esté completo y tipado.
2. **Apple Sign-In** requiere configurar el proveedor en el dashboard de Supabase (Team
   ID, Key ID, clave privada de Apple Developer) — el código ya llama a
   `signInWithOAuth({ provider: "apple" })`, pero no funcionará hasta configurarlo.
3. **Verificación de correo universitario**: hoy el campo `university_email` se guarda
   tal cual lo escribe el usuario, sin validar que el dominio coincida con
   `universities.email_domain` ni enviar un correo de verificación. `is_university_verified`
   se queda en `false` por defecto — la lógica de verificación (matching de dominio +
   email de confirmación) es trabajo de Fase 2/5 y no estaba en el alcance de Fase 1.
4. **`role` de usuario** (`passenger | driver | both`) se guarda pero ninguna pantalla lo
   usa aún para adaptar la UI — se activará en Fase 2 al construir home/publicar viaje.
5. **Sin tests automatizados** en esta fase (no se pidieron); dado que no hay Node
   instalado de fábrica en este entorno, la verificación de Fase 1 se limitó a
   `npm run build` + `npm run typecheck` + arranque de `npm run dev` manual.
