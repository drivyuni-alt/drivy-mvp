-- Chats are 1:1 between driver and passenger, created automatically when a booking is
-- accepted (see docs/01-modelo-datos.md). Messages support the Fase 4 realtime chat:
-- text, images, live location, and "quick delay" templates.

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  driver_id uuid not null references public.users (id) on delete cascade,
  passenger_id uuid not null references public.users (id) on delete cascade,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.chats is
  '1:1 chat between a trip''s driver and a passenger, auto-created on booking acceptance.';

create index chats_trip_id_idx on public.chats (trip_id);
create index chats_driver_id_idx on public.chats (driver_id);
create index chats_passenger_id_idx on public.chats (passenger_id);

create type public.message_type as enum (
  'text',
  'image',
  'location',
  'quick_delay'
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  sender_id uuid not null references public.users (id) on delete cascade,
  type public.message_type not null default 'text',
  content text, -- text body, or the quick_delay template key (e.g. "delay_5min")
  image_url text,
  location_lat double precision,
  location_lng double precision,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.messages is 'Individual messages within a chat.';

create index messages_chat_id_created_at_idx on public.messages (chat_id, created_at);
