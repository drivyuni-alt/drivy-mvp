-- Row Level Security for every table, plus the trigger that provisions a `public.users`
-- profile (and its `user_statistics` row) the moment someone signs up via Supabase Auth.
--
-- Policy philosophy for the MVP (documented in docs/02-decisiones-fase-1.md):
--   * Profile-ish data (users, vehicles, trips, universities, achievements) is readable
--     by any authenticated user, because search/matching/trip-detail screens need to
--     show driver/vehicle info before a relationship (booking) exists.
--   * Transactional data (bookings, passengers, chats, messages, payments,
--     notifications) is only readable/writable by its participants.
--   * Rows that should only ever be written by trusted server code (payments status
--     transitions, notifications, user_statistics, achievement unlocks) get no
--     authenticated insert/update policy at all — those writes go through the Supabase
--     service role from a server action / edge function, never the browser client.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email
  );

  insert into public.user_statistics (user_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- universities ----------------------------------------------------------------
alter table public.universities enable row level security;

create policy "universities are readable by authenticated users"
  on public.universities for select
  to authenticated
  using (true);

-- users -------------------------------------------------------------------------
alter table public.users enable row level security;

create policy "user profiles are readable by authenticated users"
  on public.users for select
  to authenticated
  using (true);

create policy "users can update their own profile"
  on public.users for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- vehicles ------------------------------------------------------------------
alter table public.vehicles enable row level security;

create policy "vehicles are readable by authenticated users"
  on public.vehicles for select
  to authenticated
  using (true);

create policy "owners manage their own vehicles"
  on public.vehicles for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- routes ----------------------------------------------------------------------
alter table public.routes enable row level security;

create policy "routes are readable by authenticated users"
  on public.routes for select
  to authenticated
  using (true);

create policy "authenticated users can create and update routes"
  on public.routes for all
  to authenticated
  using (true)
  with check (true);

-- trips -------------------------------------------------------------------------
alter table public.trips enable row level security;

create policy "trips are readable by authenticated users"
  on public.trips for select
  to authenticated
  using (true);

create policy "drivers manage their own trips"
  on public.trips for all
  to authenticated
  using (auth.uid() = driver_id)
  with check (auth.uid() = driver_id);

-- bookings ----------------------------------------------------------------------
alter table public.bookings enable row level security;

create policy "participants can read a booking"
  on public.bookings for select
  to authenticated
  using (
    auth.uid() = passenger_id
    or auth.uid() = (select driver_id from public.trips where id = trip_id)
  );

create policy "passengers can create bookings"
  on public.bookings for insert
  to authenticated
  with check (auth.uid() = passenger_id);

create policy "participants can update a booking"
  on public.bookings for update
  to authenticated
  using (
    auth.uid() = passenger_id
    or auth.uid() = (select driver_id from public.trips where id = trip_id)
  );

-- passengers ----------------------------------------------------------------
alter table public.passengers enable row level security;

create policy "participants can read the passenger roster"
  on public.passengers for select
  to authenticated
  using (
    auth.uid() = user_id
    or auth.uid() = (select driver_id from public.trips where id = trip_id)
  );

create policy "driver updates the passenger roster"
  on public.passengers for update
  to authenticated
  using (auth.uid() = (select driver_id from public.trips where id = trip_id));

-- chats & messages ------------------------------------------------------
alter table public.chats enable row level security;

create policy "participants can read their chat"
  on public.chats for select
  to authenticated
  using (auth.uid() = driver_id or auth.uid() = passenger_id);

alter table public.messages enable row level security;

create policy "participants can read chat messages"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
        and (chats.driver_id = auth.uid() or chats.passenger_id = auth.uid())
    )
  );

create policy "participants can send chat messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
        and (chats.driver_id = auth.uid() or chats.passenger_id = auth.uid())
    )
  );

-- ratings -----------------------------------------------------------------------
alter table public.ratings enable row level security;

create policy "participants can read a rating"
  on public.ratings for select
  to authenticated
  using (auth.uid() = rater_id or auth.uid() = ratee_id);

create policy "participants can submit a rating"
  on public.ratings for insert
  to authenticated
  with check (auth.uid() = rater_id);

-- payments (schema-only for the MVP, see docs/02-decisiones-fase-1.md) -------
alter table public.payments enable row level security;

create policy "participants can read a payment"
  on public.payments for select
  to authenticated
  using (auth.uid() = payer_id or auth.uid() = payee_id);

-- notifications ---------------------------------------------------------------
alter table public.notifications enable row level security;

create policy "users read their own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can mark their notifications as read"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- achievements & user_achievements -----------------------------------------
alter table public.achievements enable row level security;

create policy "achievements catalog is readable by authenticated users"
  on public.achievements for select
  to authenticated
  using (true);

alter table public.user_achievements enable row level security;

create policy "unlocked achievements are readable by authenticated users"
  on public.user_achievements for select
  to authenticated
  using (true);

-- user_statistics ----------------------------------------------------------
alter table public.user_statistics enable row level security;

create policy "user statistics are readable by authenticated users"
  on public.user_statistics for select
  to authenticated
  using (true);
