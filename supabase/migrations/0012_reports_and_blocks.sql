-- Fase 5 safety features: reporting another user and blocking them.

create type public.report_reason as enum (
  'inappropriate_behavior',
  'unsafe_driving',
  'no_show',
  'harassment',
  'fraud',
  'other'
);

create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users (id) on delete cascade,
  reported_user_id uuid not null references public.users (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete set null,
  reason public.report_reason not null,
  details text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_user_id)
);

comment on table public.reports is 'User-submitted safety reports, reviewed manually (no moderation UI in the MVP).';

create index reports_reported_user_id_idx on public.reports (reported_user_id);

create table public.blocked_users (
  blocker_id uuid not null references public.users (id) on delete cascade,
  blocked_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

comment on table public.blocked_users is
  'One-directional block: blocker no longer wants to see/be matched with blocked_id.
   Search results and matching should exclude trips driven by a blocked user (see
   docs/07-decisiones-fase-5.md); this is enforced in application code, not RLS,
   because a driver should not be able to tell whether a passenger has blocked them.';

-- reports ------------------------------------------------------------------
alter table public.reports enable row level security;

create policy "users can create a report"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

create policy "users can read their own submitted reports"
  on public.reports for select
  to authenticated
  using (auth.uid() = reporter_id);

-- blocked_users --------------------------------------------------------------
alter table public.blocked_users enable row level security;

create policy "users manage their own block list"
  on public.blocked_users for all
  to authenticated
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);
