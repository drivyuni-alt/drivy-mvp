-- Notifications, gamification (achievements catalog + unlocks), and the denormalized
-- per-user statistics used across the profile screen and the matching engine.

create type public.notification_type as enum (
  'booking_requested',
  'booking_accepted',
  'booking_rejected',
  'booking_cancelled',
  'trip_starting_soon',
  'passenger_picked_up',
  'new_message',
  'new_rating',
  'achievement_unlocked',
  'sos_alert'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb, -- e.g. {"trip_id": "...", "booking_id": "..."}
  read_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.notifications is 'In-app notification feed for a user.';

create index notifications_user_id_created_at_idx on public.notifications (user_id, created_at desc);
create index notifications_user_id_unread_idx on public.notifications (user_id) where read_at is null;

-- Catalog of unlockable achievements. `criteria` is interpreted by application code
-- (e.g. {"type": "trips_completed", "count": 10}); kept data-driven so new achievements
-- don't require a migration.
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  icon text not null,
  points integer not null default 0,
  criteria jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.achievements is 'Catalog of gamification achievements/badges.';

create table public.user_achievements (
  user_id uuid not null references public.users (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

comment on table public.user_achievements is 'Join table: which achievements a user has unlocked.';

-- Denormalized, incrementally-updated stats per user. Kept as its own table (rather than
-- computed on the fly with aggregate queries) because it is read on almost every screen
-- (profile, home, matching engine's "historial de puntualidad" input) and updated
-- relatively rarely (trip completion, rating submission).
create table public.user_statistics (
  user_id uuid primary key references public.users (id) on delete cascade,
  trips_as_driver integer not null default 0,
  trips_as_passenger integer not null default 0,
  distance_km_total numeric(10, 2) not null default 0,
  money_saved_eur numeric(10, 2) not null default 0,
  co2_saved_kg numeric(10, 2) not null default 0,
  punctuality_score numeric(5, 2) not null default 100, -- 0-100, feeds the matching engine
  total_points integer not null default 0,
  level integer not null default 1,
  updated_at timestamptz not null default now()
);

comment on table public.user_statistics is
  'Denormalized per-user stats, incrementally updated on trip completion and rating
   submission. punctuality_score feeds the Fase 3 matching engine.';

create trigger set_user_statistics_updated_at
  before update on public.user_statistics
  for each row execute function public.set_updated_at();
