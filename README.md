# Drivy — MVP

Plataforma de carpooling universitario con motor de matching por IA.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Supabase (Auth + PostgreSQL + Realtime + Storage)
- Google Maps Platform
- Zustand
- TanStack Query
- Framer Motion

## Desarrollo

```bash
npm install
cp .env.example .env.local   # rellenar con tus credenciales de Supabase / Google Maps
npm run dev
```

## Estructura

Ver [`docs/00-arquitectura.md`](docs/00-arquitectura.md) para la explicación de la
estructura de carpetas y las decisiones técnicas de cada fase.

## Base de datos

El esquema SQL vive en [`supabase/migrations`](supabase/migrations) y los datos de
prueba en [`supabase/seed.sql`](supabase/seed.sql). Ver
[`docs/01-modelo-datos.md`](docs/01-modelo-datos.md) para el diagrama de relaciones.

## Estado del proyecto

MVP en construcción por fases. Ver `docs/` para el detalle de qué está implementado
en cada fase y qué asunciones se hicieron.
