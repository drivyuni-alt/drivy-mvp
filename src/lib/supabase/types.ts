/**
 * Hand-written mirror of the Supabase-generated `Database` type, matching
 * `supabase/migrations` exactly. Once a real Supabase project exists, replace this file
 * with the output of:
 *
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
 *
 * Kept 100% hand-typed (no `any`) so the app can be built before a Supabase project is
 * provisioned.
 *
 * Row/Insert/Update are defined as standalone named types per table (rather than
 * deriving `Update` via `Partial<Database["public"]["Tables"][...]["Insert"]>`) so
 * nothing in this file references the `Database` interface from within its own
 * definition — that self-reference confuses @supabase/postgrest-js's conditional-type
 * inference for `.update()` and silently resolves its argument type to `never`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "passenger" | "driver" | "both";
export type TripStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type BookingStatus = "pending" | "accepted" | "rejected" | "cancelled" | "completed";
export type PassengerStatus = "waiting" | "picked_up" | "dropped_off" | "no_show";
export type MessageType = "text" | "image" | "location" | "quick_delay";
export type PaymentStatus = "pending" | "authorized" | "captured" | "refunded" | "failed";
export type PaymentMethod = "card" | "cash";
export type NotificationType =
  | "booking_requested"
  | "booking_accepted"
  | "booking_rejected"
  | "booking_cancelled"
  | "trip_starting_soon"
  | "passenger_picked_up"
  | "new_message"
  | "new_rating"
  | "achievement_unlocked"
  | "sos_alert";
export type ReportReason =
  | "inappropriate_behavior"
  | "unsafe_driving"
  | "no_show"
  | "harassment"
  | "fraud"
  | "other";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export interface RouteWaypoint {
  passenger_id: string;
  lat: number;
  lng: number;
  address: string;
  eta_seconds: number;
  order: number;
}

// --- universities -----------------------------------------------------------
type UniversitiesRow = {
  id: string;
  name: string;
  short_name: string | null;
  email_domain: string;
  city: string;
  logo_url: string | null;
  created_at: string;
};
type UniversitiesInsert = {
  id?: string;
  name: string;
  short_name?: string | null;
  email_domain: string;
  city: string;
  logo_url?: string | null;
  created_at?: string;
};
type UniversitiesUpdate = Partial<UniversitiesInsert>;

// --- users -------------------------------------------------------------------
type UsersRow = {
  id: string;
  university_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  university_email: string | null;
  phone: string | null;
  degree: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  is_university_verified: boolean;
  is_identity_verified: boolean;
  auto_accept_bookings: boolean;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  stripe_customer_id: string | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
};
type UsersInsert = {
  id: string;
  university_id?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  university_email?: string | null;
  phone?: string | null;
  degree?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  role?: UserRole;
  is_university_verified?: boolean;
  is_identity_verified?: boolean;
  auto_accept_bookings?: boolean;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  stripe_customer_id?: string | null;
  rating_avg?: number;
  rating_count?: number;
  created_at?: string;
  updated_at?: string;
};
type UsersUpdate = Partial<UsersInsert>;

// --- vehicles ------------------------------------------------------------
type VehiclesRow = {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  color: string;
  plate: string;
  seats: number;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};
type VehiclesInsert = {
  id?: string;
  owner_id: string;
  make: string;
  model: string;
  color: string;
  plate: string;
  seats: number;
  photo_url?: string | null;
  created_at?: string;
  updated_at?: string;
};
type VehiclesUpdate = Partial<VehiclesInsert>;

// --- routes ----------------------------------------------------------------
type RoutesRow = {
  id: string;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  distance_meters: number | null;
  duration_seconds: number | null;
  polyline: string | null;
  waypoints: RouteWaypoint[];
  created_at: string;
  updated_at: string;
};
type RoutesInsert = {
  id?: string;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  distance_meters?: number | null;
  duration_seconds?: number | null;
  polyline?: string | null;
  waypoints?: RouteWaypoint[];
  created_at?: string;
  updated_at?: string;
};
type RoutesUpdate = Partial<RoutesInsert>;

// --- trips -------------------------------------------------------------------
type TripsRow = {
  id: string;
  driver_id: string;
  vehicle_id: string;
  route_id: string | null;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  departure_at: string;
  estimated_arrival_at: string | null;
  available_seats: number;
  price_per_seat: number;
  status: TripStatus;
  auto_accept_bookings: boolean;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};
type TripsInsert = {
  id?: string;
  driver_id: string;
  vehicle_id: string;
  route_id?: string | null;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  departure_at: string;
  estimated_arrival_at?: string | null;
  available_seats: number;
  price_per_seat: number;
  status?: TripStatus;
  auto_accept_bookings?: boolean;
  notes?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  created_at?: string;
  updated_at?: string;
};
type TripsUpdate = Partial<TripsInsert>;

// --- bookings ------------------------------------------------------------------
type BookingsRow = {
  id: string;
  trip_id: string;
  passenger_id: string;
  seats_requested: number;
  status: BookingStatus;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  price_total: number;
  match_score: number | null;
  requested_at: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
};
type BookingsInsert = {
  id?: string;
  trip_id: string;
  passenger_id: string;
  seats_requested?: number;
  status?: BookingStatus;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  price_total: number;
  match_score?: number | null;
  requested_at?: string;
  responded_at?: string | null;
  created_at?: string;
  updated_at?: string;
};
type BookingsUpdate = Partial<BookingsInsert>;

// --- passengers ------------------------------------------------------------
/**
 * Una fila por viaje: la última posición conocida del conductor mientras la ruta está en
 * curso. Ver supabase/migrations/0021_driver_live_location.sql.
 */
type TripDriverLocationsRow = {
  trip_id: string;
  driver_id: string;
  lat: number;
  lng: number;
  heading: number | null;
  updated_at: string;
};
type TripDriverLocationsInsert = {
  trip_id: string;
  driver_id: string;
  lat: number;
  lng: number;
  heading?: number | null;
  updated_at?: string;
};
type TripDriverLocationsUpdate = {
  trip_id?: string;
  driver_id?: string;
  lat?: number;
  lng?: number;
  heading?: number | null;
  updated_at?: string;
};

type PassengersRow = {
  id: string;
  trip_id: string;
  booking_id: string;
  user_id: string;
  pickup_order: number | null;
  eta_seconds: number | null;
  status: PassengerStatus;
  picked_up_at: string | null;
  dropped_off_at: string | null;
  created_at: string;
  updated_at: string;
};
type PassengersInsert = {
  id?: string;
  trip_id: string;
  booking_id: string;
  user_id: string;
  pickup_order?: number | null;
  eta_seconds?: number | null;
  status?: PassengerStatus;
  picked_up_at?: string | null;
  dropped_off_at?: string | null;
  created_at?: string;
  updated_at?: string;
};
type PassengersUpdate = Partial<PassengersInsert>;

// --- chats -------------------------------------------------------------------
type ChatsRow = {
  id: string;
  trip_id: string;
  booking_id: string;
  driver_id: string;
  passenger_id: string;
  last_message_at: string | null;
  created_at: string;
};
type ChatsInsert = {
  id?: string;
  trip_id: string;
  booking_id: string;
  driver_id: string;
  passenger_id: string;
  last_message_at?: string | null;
  created_at?: string;
};
type ChatsUpdate = Partial<ChatsInsert>;

// --- messages ------------------------------------------------------------------
type MessagesRow = {
  id: string;
  chat_id: string;
  sender_id: string;
  type: MessageType;
  content: string | null;
  image_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
  read_at: string | null;
  created_at: string;
};
type MessagesInsert = {
  id?: string;
  chat_id: string;
  sender_id: string;
  type?: MessageType;
  content?: string | null;
  image_url?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  read_at?: string | null;
  created_at?: string;
};
type MessagesUpdate = Partial<MessagesInsert>;

// --- ratings -------------------------------------------------------------------
type RatingsRow = {
  id: string;
  trip_id: string;
  booking_id: string;
  rater_id: string;
  ratee_id: string;
  punctuality: number;
  friendliness: number;
  driving: number | null;
  communication: number;
  comment: string | null;
  created_at: string;
};
type RatingsInsert = {
  id?: string;
  trip_id: string;
  booking_id: string;
  rater_id: string;
  ratee_id: string;
  punctuality: number;
  friendliness: number;
  driving?: number | null;
  communication: number;
  comment?: string | null;
  created_at?: string;
};
type RatingsUpdate = Partial<RatingsInsert>;

// --- payments --------------------------------------------------------------
type PaymentsRow = {
  id: string;
  booking_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
};
type PaymentsInsert = {
  id?: string;
  booking_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  currency?: string;
  method?: PaymentMethod;
  status?: PaymentStatus;
  stripe_payment_intent_id?: string | null;
  created_at?: string;
  updated_at?: string;
};
type PaymentsUpdate = Partial<PaymentsInsert>;

// --- notifications -------------------------------------------------------
type NotificationsRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Json;
  read_at: string | null;
  created_at: string;
};
type NotificationsInsert = {
  id?: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Json;
  read_at?: string | null;
  created_at?: string;
};
type NotificationsUpdate = Partial<NotificationsInsert>;

// --- achievements ------------------------------------------------------------
type AchievementsRow = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  criteria: Json;
  created_at: string;
};
type AchievementsInsert = {
  id?: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  points?: number;
  criteria?: Json;
  created_at?: string;
};
type AchievementsUpdate = Partial<AchievementsInsert>;

// --- user_achievements ---------------------------------------------------
type UserAchievementsRow = {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
};
type UserAchievementsInsert = {
  user_id: string;
  achievement_id: string;
  unlocked_at?: string;
};
type UserAchievementsUpdate = Partial<UserAchievementsInsert>;

// --- user_statistics -------------------------------------------------------
type UserStatisticsRow = {
  user_id: string;
  trips_as_driver: number;
  trips_as_passenger: number;
  distance_km_total: number;
  money_saved_eur: number;
  co2_saved_kg: number;
  punctuality_score: number;
  total_points: number;
  level: number;
  updated_at: string;
};
type UserStatisticsInsert = {
  user_id: string;
  trips_as_driver?: number;
  trips_as_passenger?: number;
  distance_km_total?: number;
  money_saved_eur?: number;
  co2_saved_kg?: number;
  punctuality_score?: number;
  total_points?: number;
  level?: number;
  updated_at?: string;
};
type UserStatisticsUpdate = Partial<UserStatisticsInsert>;

// --- reports -----------------------------------------------------------------
type ReportsRow = {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  trip_id: string | null;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
};
type ReportsInsert = {
  id?: string;
  reporter_id: string;
  reported_user_id: string;
  trip_id?: string | null;
  reason: ReportReason;
  details?: string | null;
  status?: ReportStatus;
  created_at?: string;
};
type ReportsUpdate = Partial<ReportsInsert>;

// --- blocked_users -----------------------------------------------------------
type BlockedUsersRow = {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};
type BlockedUsersInsert = {
  blocker_id: string;
  blocked_id: string;
  created_at?: string;
};
type BlockedUsersUpdate = Partial<BlockedUsersInsert>;

export interface Database {
  public: {
    Tables: {
      universities: {
        Row: UniversitiesRow;
        Insert: UniversitiesInsert;
        Update: UniversitiesUpdate;
        Relationships: [];
      };
      users: {
        Row: UsersRow;
        Insert: UsersInsert;
        Update: UsersUpdate;
        Relationships: [];
      };
      vehicles: {
        Row: VehiclesRow;
        Insert: VehiclesInsert;
        Update: VehiclesUpdate;
        Relationships: [];
      };
      routes: {
        Row: RoutesRow;
        Insert: RoutesInsert;
        Update: RoutesUpdate;
        Relationships: [];
      };
      trips: {
        Row: TripsRow;
        Insert: TripsInsert;
        Update: TripsUpdate;
        Relationships: [];
      };
      bookings: {
        Row: BookingsRow;
        Insert: BookingsInsert;
        Update: BookingsUpdate;
        Relationships: [];
      };
      passengers: {
        Row: PassengersRow;
        Insert: PassengersInsert;
        Update: PassengersUpdate;
        Relationships: [];
      };
      trip_driver_locations: {
        Row: TripDriverLocationsRow;
        Insert: TripDriverLocationsInsert;
        Update: TripDriverLocationsUpdate;
        Relationships: [];
      };
      chats: {
        Row: ChatsRow;
        Insert: ChatsInsert;
        Update: ChatsUpdate;
        Relationships: [];
      };
      messages: {
        Row: MessagesRow;
        Insert: MessagesInsert;
        Update: MessagesUpdate;
        Relationships: [];
      };
      ratings: {
        Row: RatingsRow;
        Insert: RatingsInsert;
        Update: RatingsUpdate;
        Relationships: [];
      };
      payments: {
        Row: PaymentsRow;
        Insert: PaymentsInsert;
        Update: PaymentsUpdate;
        Relationships: [];
      };
      notifications: {
        Row: NotificationsRow;
        Insert: NotificationsInsert;
        Update: NotificationsUpdate;
        Relationships: [];
      };
      achievements: {
        Row: AchievementsRow;
        Insert: AchievementsInsert;
        Update: AchievementsUpdate;
        Relationships: [];
      };
      user_achievements: {
        Row: UserAchievementsRow;
        Insert: UserAchievementsInsert;
        Update: UserAchievementsUpdate;
        Relationships: [];
      };
      user_statistics: {
        Row: UserStatisticsRow;
        Insert: UserStatisticsInsert;
        Update: UserStatisticsUpdate;
        Relationships: [];
      };
      reports: {
        Row: ReportsRow;
        Insert: ReportsInsert;
        Update: ReportsUpdate;
        Relationships: [];
      };
      blocked_users: {
        Row: BlockedUsersRow;
        Insert: BlockedUsersInsert;
        Update: BlockedUsersUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
