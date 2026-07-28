-- Post-trip ratings (either direction: driver -> passenger or passenger -> driver) and
-- the payment record for a booking. Payments is schema-only for the MVP: no Stripe keys,
-- no real charge is ever created (see docs/02-decisiones-fase-1.md).

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  rater_id uuid not null references public.users (id) on delete cascade,
  ratee_id uuid not null references public.users (id) on delete cascade,
  punctuality smallint not null check (punctuality between 1 and 5),
  friendliness smallint not null check (friendliness between 1 and 5),
  driving smallint check (driving between 1 and 5), -- only set when rating a driver
  communication smallint not null check (communication between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (booking_id, rater_id)
);

comment on table public.ratings is
  'Post-trip rating from one participant about another. `driving` is null when a driver
   rates a passenger.';

create index ratings_ratee_id_idx on public.ratings (ratee_id);

create type public.payment_status as enum (
  'pending',
  'authorized',
  'captured',
  'refunded',
  'failed'
);

create type public.payment_method as enum ('card', 'cash');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  payer_id uuid not null references public.users (id) on delete cascade,
  payee_id uuid not null references public.users (id) on delete cascade,
  amount numeric(7, 2) not null check (amount >= 0),
  currency text not null default 'EUR',
  method public.payment_method not null default 'cash',
  status public.payment_status not null default 'pending',
  stripe_payment_intent_id text, -- populated only once real Stripe integration is wired up
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.payments is
  'Payment record for a booking. Architecture is Stripe-ready (stripe_payment_intent_id)
   but the MVP never calls Stripe; `method` defaults to cash and `status` is managed
   manually.';

create trigger set_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();
