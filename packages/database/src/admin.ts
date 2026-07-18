import { createClient } from "@supabase/supabase-js";
import type { Database } from "@repo/types";
import { getServiceRoleSupabaseEnv } from "./env";

export function createAdminClient() {
  const env = getServiceRoleSupabaseEnv();

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
