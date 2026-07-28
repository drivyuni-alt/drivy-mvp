-- Realistic mock data for local development (`supabase db reset` runs this
-- automatically after the migrations). No real payments, no real Stripe calls.
--
-- We insert into `auth.users` first (minimal required columns) so that the
-- `on_auth_user_created` trigger provisions the matching `public.users` +
-- `public.user_statistics` rows, then we UPDATE `public.users` with the full mock
-- profile. This mirrors exactly what happens on a real sign-up.

-- ---------------------------------------------------------------------------
-- Universities
-- ---------------------------------------------------------------------------
insert into public.universities (id, name, short_name, email_domain, city, logo_url) values
  ('11111111-1111-1111-1111-111111111101', 'Universidad Complutense de Madrid', 'UCM', 'ucm.es', 'Madrid', null),
  ('11111111-1111-1111-1111-111111111102', 'Universidad Autónoma de Madrid', 'UAM', 'uam.es', 'Madrid', null),
  ('11111111-1111-1111-1111-111111111103', 'Universidad Politécnica de Madrid', 'UPM', 'upm.es', 'Madrid', null);

-- ---------------------------------------------------------------------------
-- Users (auth.users -> trigger creates public.users -> we fill in the rest)
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222201', 'authenticated', 'authenticated', 'marta.gonzalez@example.com', crypt('drivy1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Marta","last_name":"González"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222202', 'authenticated', 'authenticated', 'diego.ramos@example.com', crypt('drivy1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Diego","last_name":"Ramos"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222203', 'authenticated', 'authenticated', 'lucia.fernandez@example.com', crypt('drivy1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Lucía","last_name":"Fernández"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222204', 'authenticated', 'authenticated', 'pablo.martin@example.com', crypt('drivy1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Pablo","last_name":"Martín"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222205', 'authenticated', 'authenticated', 'sara.lopez@example.com', crypt('drivy1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Sara","last_name":"López"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222206', 'authenticated', 'authenticated', 'javier.ortiz@example.com', crypt('drivy1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Javier","last_name":"Ortiz"}', now(), now(), '', '', '', '');

update public.users set
  university_id = '11111111-1111-1111-1111-111111111101',
  university_email = 'marta.gonzalez@ucm.es',
  phone = '+34611000201',
  degree = 'Ingeniería Informática',
  role = 'driver',
  is_university_verified = true,
  is_identity_verified = true,
  auto_accept_bookings = false,
  rating_avg = 4.9,
  rating_count = 37
where id = '22222222-2222-2222-2222-222222222201';

update public.users set
  university_id = '11111111-1111-1111-1111-111111111103',
  university_email = 'diego.ramos@upm.es',
  phone = '+34611000202',
  degree = 'Ingeniería Industrial',
  role = 'driver',
  is_university_verified = true,
  is_identity_verified = true,
  auto_accept_bookings = true,
  rating_avg = 4.7,
  rating_count = 21
where id = '22222222-2222-2222-2222-222222222202';

update public.users set
  university_id = '11111111-1111-1111-1111-111111111101',
  university_email = 'lucia.fernandez@ucm.es',
  phone = '+34611000203',
  degree = 'Derecho',
  role = 'passenger',
  is_university_verified = true,
  is_identity_verified = false,
  rating_avg = 4.8,
  rating_count = 12
where id = '22222222-2222-2222-2222-222222222203';

update public.users set
  university_id = '11111111-1111-1111-1111-111111111102',
  university_email = 'pablo.martin@uam.es',
  phone = '+34611000204',
  degree = 'Economía',
  role = 'passenger',
  is_university_verified = true,
  is_identity_verified = true,
  rating_avg = 4.6,
  rating_count = 8
where id = '22222222-2222-2222-2222-222222222204';

update public.users set
  university_id = '11111111-1111-1111-1111-111111111101',
  university_email = 'sara.lopez@ucm.es',
  phone = '+34611000205',
  degree = 'Medicina',
  role = 'passenger',
  is_university_verified = true,
  is_identity_verified = false,
  rating_avg = 5.0,
  rating_count = 4
where id = '22222222-2222-2222-2222-222222222205';

update public.users set
  university_id = '11111111-1111-1111-1111-111111111102',
  university_email = 'javier.ortiz@uam.es',
  phone = '+34611000206',
  degree = 'Administración de Empresas',
  role = 'driver',
  is_university_verified = true,
  is_identity_verified = true,
  auto_accept_bookings = false,
  rating_avg = 4.5,
  rating_count = 15
where id = '22222222-2222-2222-2222-222222222206';

-- ---------------------------------------------------------------------------
-- Vehicles
-- ---------------------------------------------------------------------------
insert into public.vehicles (id, owner_id, make, model, color, plate, seats, photo_url) values
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', 'Seat', 'Ibiza', 'Blanco', '1234ABC', 4, null),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222202', 'Volkswagen', 'Golf', 'Gris', '5678BCD', 4, null),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222206', 'Renault', 'Clio', 'Azul', '9012CDE', 4, null);

-- ---------------------------------------------------------------------------
-- Routes
-- ---------------------------------------------------------------------------
insert into public.routes (
  id, origin_address, origin_lat, origin_lng, destination_address, destination_lat, destination_lng,
  distance_meters, duration_seconds, waypoints
) values
  (
    '44444444-4444-4444-4444-444444444401',
    'Alcorcón, Madrid', 40.3458, -3.8249,
    'Ciudad Universitaria, Madrid', 40.4457, -3.7284,
    18500, 1620, '[]'
  ),
  (
    '44444444-4444-4444-4444-444444444402',
    'Móstoles, Madrid', 40.3223, -3.8649,
    'Campus Sur UPM, Madrid', 40.3892, -3.7311,
    15200, 1380, '[]'
  );

-- ---------------------------------------------------------------------------
-- Trips
-- ---------------------------------------------------------------------------
insert into public.trips (
  id, driver_id, vehicle_id, route_id, origin_address, origin_lat, origin_lng,
  destination_address, destination_lat, destination_lng, departure_at, estimated_arrival_at,
  available_seats, price_per_seat, status, auto_accept_bookings, notes
) values
  (
    '55555555-5555-5555-5555-555555555501',
    '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301',
    '44444444-4444-4444-4444-444444444401',
    'Alcorcón, Madrid', 40.3458, -3.8249,
    'Ciudad Universitaria, Madrid', 40.4457, -3.7284,
    date_trunc('day', now() + interval '1 day') + interval '8 hours',
    date_trunc('day', now() + interval '1 day') + interval '8 hours 27 minutes',
    2, 3.50, 'scheduled', false, 'Salgo puntual, tengo hueco para maletas pequeñas.'
  ),
  (
    '55555555-5555-5555-5555-555555555502',
    '22222222-2222-2222-2222-222222222202',
    '33333333-3333-3333-3333-333333333302',
    '44444444-4444-4444-4444-444444444402',
    'Móstoles, Madrid', 40.3223, -3.8649,
    'Campus Sur UPM, Madrid', 40.3892, -3.7311,
    date_trunc('day', now() + interval '2 days') + interval '7 hours 30 minutes',
    date_trunc('day', now() + interval '2 days') + interval '7 hours 53 minutes',
    3, 2.80, 'scheduled', true, null
  ),
  (
    '55555555-5555-5555-5555-555555555503',
    '22222222-2222-2222-2222-222222222206',
    '33333333-3333-3333-3333-333333333303',
    null,
    'Getafe, Madrid', 40.3057, -3.7327,
    'Universidad Autónoma de Madrid', 40.5443, -3.6968,
    now() - interval '5 days',
    now() - interval '5 days' + interval '35 minutes',
    0, 3.00, 'completed', false, null
  );

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
insert into public.bookings (
  id, trip_id, passenger_id, seats_requested, status, pickup_address, pickup_lat, pickup_lng,
  dropoff_address, dropoff_lat, dropoff_lng, price_total, match_score, responded_at
) values
  (
    '66666666-6666-6666-6666-666666666601',
    '55555555-5555-5555-5555-555555555501',
    '22222222-2222-2222-2222-222222222203',
    1, 'accepted', 'Alcorcón Central, Madrid', 40.3465, -3.8261,
    'Facultad de Derecho, Ciudad Universitaria', 40.4489, -3.7268,
    3.50, 96, now() - interval '2 hours'
  ),
  (
    '66666666-6666-6666-6666-666666666602',
    '55555555-5555-5555-5555-555555555501',
    '22222222-2222-2222-2222-222222222205',
    1, 'pending', 'Alcorcón, Parque Oeste', 40.3441, -3.8285,
    'Facultad de Medicina, Ciudad Universitaria', 40.4478, -3.7213,
    3.50, 81, null
  ),
  (
    '66666666-6666-6666-6666-666666666603',
    '55555555-5555-5555-5555-555555555503',
    '22222222-2222-2222-2222-222222222204',
    1, 'completed', 'Getafe Centro, Madrid', 40.3061, -3.7318,
    'Universidad Autónoma de Madrid', 40.5443, -3.6968,
    3.00, 92, now() - interval '5 days'
  );

-- ---------------------------------------------------------------------------
-- Passengers (operational roster)
-- ---------------------------------------------------------------------------
insert into public.passengers (id, trip_id, booking_id, user_id, pickup_order, status, picked_up_at, dropped_off_at) values
  (
    '77777777-7777-7777-7777-777777777701',
    '55555555-5555-5555-5555-555555555501',
    '66666666-6666-6666-6666-666666666601',
    '22222222-2222-2222-2222-222222222203',
    1, 'waiting', null, null
  ),
  (
    '77777777-7777-7777-7777-777777777702',
    '55555555-5555-5555-5555-555555555503',
    '66666666-6666-6666-6666-666666666603',
    '22222222-2222-2222-2222-222222222204',
    1, 'dropped_off', now() - interval '5 days' + interval '5 minutes', now() - interval '5 days' + interval '35 minutes'
  );

-- ---------------------------------------------------------------------------
-- Chats & messages (auto-created when booking 66..601 was accepted)
-- ---------------------------------------------------------------------------
insert into public.chats (id, trip_id, booking_id, driver_id, passenger_id, last_message_at) values
  (
    '88888888-8888-8888-8888-888888888801',
    '55555555-5555-5555-5555-555555555501',
    '66666666-6666-6666-6666-666666666601',
    '22222222-2222-2222-2222-222222222201',
    '22222222-2222-2222-2222-222222222203',
    now() - interval '1 hour'
  );

insert into public.messages (chat_id, sender_id, type, content, read_at, created_at) values
  ('88888888-8888-8888-8888-888888888801', '22222222-2222-2222-2222-222222222201', 'text', '¡Hola Lucía! Confirmado tu hueco para mañana 😊', now() - interval '110 minutes', now() - interval '2 hours'),
  ('88888888-8888-8888-8888-888888888801', '22222222-2222-2222-2222-222222222203', 'text', 'Genial, muchas gracias! Estaré en la parada a la hora acordada', now() - interval '100 minutes', now() - interval '105 minutes'),
  ('88888888-8888-8888-8888-888888888801', '22222222-2222-2222-2222-222222222201', 'text', 'Perfecto, nos vemos mañana', now() - interval '1 hour', now() - interval '1 hour');

-- ---------------------------------------------------------------------------
-- Ratings (for the completed trip 555..503)
-- ---------------------------------------------------------------------------
insert into public.ratings (trip_id, booking_id, rater_id, ratee_id, punctuality, friendliness, driving, communication, comment) values
  (
    '55555555-5555-5555-5555-555555555503', '66666666-6666-6666-6666-666666666603',
    '22222222-2222-2222-2222-222222222204', '22222222-2222-2222-2222-222222222206',
    5, 5, 5, 5, 'Javier condujo genial y llegó puntual, repetiré seguro.'
  ),
  (
    '55555555-5555-5555-5555-555555555503', '66666666-6666-6666-6666-666666666603',
    '22222222-2222-2222-2222-222222222206', '22222222-2222-2222-2222-222222222204',
    5, 5, null, 5, 'Pablo estuvo listo antes de tiempo, todo perfecto.'
  );

-- ---------------------------------------------------------------------------
-- Payments (schema-only, no real Stripe calls)
-- ---------------------------------------------------------------------------
insert into public.payments (booking_id, payer_id, payee_id, amount, currency, method, status) values
  ('66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222203', '22222222-2222-2222-2222-222222222201', 3.50, 'EUR', 'cash', 'pending'),
  ('66666666-6666-6666-6666-666666666603', '22222222-2222-2222-2222-222222222204', '22222222-2222-2222-2222-222222222206', 3.00, 'EUR', 'cash', 'captured');

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
insert into public.notifications (user_id, type, title, body, data, read_at) values
  (
    '22222222-2222-2222-2222-222222222203', 'booking_accepted', 'Reserva confirmada',
    'Marta ha aceptado tu reserva para el viaje a Ciudad Universitaria.',
    jsonb_build_object('trip_id', '55555555-5555-5555-5555-555555555501', 'booking_id', '66666666-6666-6666-6666-666666666601'),
    now() - interval '90 minutes'
  ),
  (
    '22222222-2222-2222-2222-222222222201', 'booking_requested', 'Nueva solicitud de reserva',
    'Sara quiere reservar 1 plaza en tu viaje a Ciudad Universitaria.',
    jsonb_build_object('trip_id', '55555555-5555-5555-5555-555555555501', 'booking_id', '66666666-6666-6666-6666-666666666602'),
    null
  );

-- ---------------------------------------------------------------------------
-- Achievements catalog + unlocks
-- ---------------------------------------------------------------------------
insert into public.achievements (id, code, name, description, icon, points, criteria) values
  ('99999999-9999-9999-9999-999999999901', 'first_trip', 'Primer viaje', 'Completa tu primer viaje en Drivy.', '🚗', 50, '{"type":"trips_completed","count":1}'),
  ('99999999-9999-9999-9999-999999999902', 'eco_warrior', 'Eco Warrior', 'Ahorra más de 20kg de CO2 compartiendo coche.', '🌱', 100, '{"type":"co2_saved_kg","count":20}'),
  ('99999999-9999-9999-9999-999999999903', 'punctual_star', 'Puntual estrella', 'Mantén una puntuación de puntualidad superior al 95%.', '⏱️', 75, '{"type":"punctuality_score","count":95}'),
  ('99999999-9999-9999-9999-999999999904', 'five_star', '5 estrellas', 'Consigue una valoración media de 5.0 con al menos 10 viajes.', '⭐', 150, '{"type":"rating_avg","count":5}');

insert into public.user_achievements (user_id, achievement_id) values
  ('22222222-2222-2222-2222-222222222201', '99999999-9999-9999-9999-999999999901'),
  ('22222222-2222-2222-2222-222222222201', '99999999-9999-9999-9999-999999999903'),
  ('22222222-2222-2222-2222-222222222206', '99999999-9999-9999-9999-999999999901'),
  ('22222222-2222-2222-2222-222222222206', '99999999-9999-9999-9999-999999999902');

-- ---------------------------------------------------------------------------
-- User statistics (trigger already inserted a default row per user; top it up)
-- ---------------------------------------------------------------------------
update public.user_statistics set trips_as_driver = 37, distance_km_total = 890, money_saved_eur = 0, co2_saved_kg = 142.5, punctuality_score = 98.2, total_points = 620, level = 6 where user_id = '22222222-2222-2222-2222-222222222201';
update public.user_statistics set trips_as_driver = 21, distance_km_total = 410, money_saved_eur = 0, co2_saved_kg = 76.1, punctuality_score = 95.0, total_points = 340, level = 4 where user_id = '22222222-2222-2222-2222-222222222202';
update public.user_statistics set trips_as_passenger = 12, distance_km_total = 205, money_saved_eur = 148.30, co2_saved_kg = 38.9, punctuality_score = 100, total_points = 210, level = 3 where user_id = '22222222-2222-2222-2222-222222222203';
update public.user_statistics set trips_as_passenger = 8, distance_km_total = 130, money_saved_eur = 96.00, co2_saved_kg = 24.2, punctuality_score = 92.5, total_points = 140, level = 2 where user_id = '22222222-2222-2222-2222-222222222204';
update public.user_statistics set trips_as_passenger = 4, distance_km_total = 60, money_saved_eur = 44.00, co2_saved_kg = 11.4, punctuality_score = 100, total_points = 70, level = 1 where user_id = '22222222-2222-2222-2222-222222222205';
update public.user_statistics set trips_as_driver = 15, distance_km_total = 320, money_saved_eur = 0, co2_saved_kg = 58.7, punctuality_score = 90.0, total_points = 260, level = 3 where user_id = '22222222-2222-2222-2222-222222222206';
