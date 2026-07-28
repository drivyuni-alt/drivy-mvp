import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/**
 * Service-role Supabase client for privileged writes that must bypass RLS:
 * creating notifications, provisioning the passenger roster + chat when a booking is
 * accepted, updating user_statistics, unlocking achievements, etc. (see
 * supabase/migrations/0008_rls_policies.sql — those tables intentionally have no
 * `authenticated` insert/update policy).
 *
 * Only ever import this from Server Actions / Route Handlers (the `server-only`
 * import throws a build error if it's ever pulled into client code).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
