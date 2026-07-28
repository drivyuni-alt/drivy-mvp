-- Universities catalog and the app-level user profile.
-- `public.users` extends `auth.users` (Supabase Auth) with a 1:1 profile row,
-- created via a trigger the first time someone signs up (see 0008_rls_policies.sql).

create table public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  email_domain text not null unique, -- e.g. "ucm.es", used to auto-verify university email
  city text not null,
  logo_url text,
  created_at timestamptz not null default now()
);

comment on table public.universities is
  'Catalog of participating universities. email_domain drives automatic university-email verification.';

create type public.user_role as enum ('passenger', 'driver', 'both');

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  university_id uuid references public.universities (id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  university_email text,
  phone text,
  degree text, -- carrera
  avatar_url text,
  bio text,
  role public.user_role not null default 'passenger',
  is_university_verified boolean not null default false,
  is_identity_verified boolean not null default false,
  auto_accept_bookings boolean not null default false,
  emergency_contact_name text,
  emergency_contact_phone text,
  stripe_customer_id text, -- reserved for future Stripe integration, unused in MVP
  rating_avg numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is
  'App-level profile for an authenticated user. 1:1 with auth.users.';
comment on column public.users.stripe_customer_id is
  'Placeholder for future Stripe Customer id. No real payments are processed in the MVP.';

create trigger set_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create index users_university_id_idx on public.users (university_id);
