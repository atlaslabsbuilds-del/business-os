import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@repo/types";
import { createServerClient } from "./server";

export async function clientOrDefault(client?: SupabaseClient<Database>) {
  return client ?? (await createServerClient());
}

export function jsonToRecord(json: Json): Record<string, unknown> {
  if (typeof json === "object" && json !== null && !Array.isArray(json)) {
    return json as Record<string, unknown>;
  }
  return {};
}
