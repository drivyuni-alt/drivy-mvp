# Arquitectura — Fase 1

## Estructura de carpetas

```
src/
├── app/            App Router: rutas, layouts, route handlers
│   ├── (auth)/     login, register — layout centrado sin nav
│   └── (main)/     rutas autenticadas (Fase 2+), con nav/layout compartido
├── components/
│   ├── ui/         design system genérico (Button, Card, Input, Select, Modal, Badge, Skeleton)
│   └── layout/     piezas de layout de la app (ThemeEffect, y en Fase 2: Navbar, MobileNav)
├── features/       lógica de negocio por dominio: auth, trips, bookings, matching, chat, profile
│   └── <domain>/
│       ├── types.ts       tipos de dominio del feature
│       ├── api.ts         llamadas a Supabase (fetch/insert/update)
│       ├── hooks.ts       hooks de TanStack Query que envuelven api.ts
│       └── components/    componentes de UI específicos del feature
├── lib/
│   ├── supabase/   client.ts (browser), server.ts (RSC/route handlers), types.ts (schema DB)
│   └── utils.ts    helpers compartidos (cn, etc.)
├── store/          stores de Zustand (estado de cliente, no de servidor)
├── types/          tipos compartidos entre features
└── middleware.ts   refresco de sesión de Supabase en cada request
```

### Por qué esta separación

- **`components/ui` vs `features/*/components`**: `ui` no sabe nada de Drivy (podría
  copiarse a otro proyecto); los componentes de features sí conocen el dominio
  (`BookingCard`, `MatchScoreBadge`, etc.). Esto evita que la lógica de negocio se filtre
  al design system.
- **`api.ts` vs `hooks.ts`**: `api.ts` son funciones puras async que hablan con Supabase
  (fáciles de testear o de mover a un route handler/edge function más adelante);
  `hooks.ts` sólo añade el cacheo/estado de carga de TanStack Query encima. La UI nunca
  importa `@supabase/supabase-js` directamente.
- **Route groups `(auth)` y `(main)`**: permiten layouts distintos (auth: pantalla
  centrada sin navegación; main: con navbar/tabs) sin que el nombre del grupo aparezca
  en la URL.
- **Zustand vs TanStack Query**: TanStack Query es la fuente de verdad para cualquier
  dato que viva en Supabase (usuarios, viajes, reservas...). Zustand sólo guarda estado
  de cliente que no persiste en el servidor (tema, filtros de búsqueda abiertos, estado
  de un wizard). Mezclar ambos para el mismo dato es la fuente de bugs más común en este
  tipo de stack, así que se evita explícitamente.

## Autenticación

- Supabase Auth con tres proveedores: email/password, Google y Apple OAuth.
- `src/middleware.ts` refresca la cookie de sesión en cada request siguiendo el patrón
  oficial de `@supabase/ssr` para Next.js App Router.
- Al hacer `signUp`, un trigger de Postgres (`handle_new_user`, ver
  `supabase/migrations/0008_rls_policies.sql`) crea automáticamente la fila en
  `public.users` y en `public.user_statistics`. El cliente sólo hace un `UPDATE`
  posterior para rellenar universidad, carrera, teléfono y foto — así el perfil nunca
  puede quedar huérfano de su fila base, ni siquiera si el usuario cierra la pestaña
  a mitad del formulario.
- OAuth redirige a `/auth/callback` (route handler) que intercambia el `code` por una
  sesión server-side antes de continuar a la app.

## Tema claro/oscuro

- Preferencia guardada en Zustand con `persist` (`src/store/theme-store.ts`), valores
  `light | dark | system`.
- Un `<script>` inline y bloqueante en `app/layout.tsx` aplica la clase `dark` a
  `<html>` **antes** de la hidratación, leyendo directamente `localStorage`, para evitar
  el flash de tema incorrecto. `ThemeEffect` (client component) mantiene la clase
  sincronizada después de la carga inicial y reacciona a cambios del tema del sistema
  operativo cuando `theme === "system"`.
