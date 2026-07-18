import { z } from "zod";

export const publicSupabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
});

export const serviceRoleSupabaseEnvSchema = publicSupabaseEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
});

export type PublicSupabaseEnv = z.infer<typeof publicSupabaseEnvSchema>;
export type ServiceRoleSupabaseEnv = z.infer<typeof serviceRoleSupabaseEnvSchema>;

/**
 * Read public Supabase env with *static* `process.env.NEXT_PUBLIC_*` access.
 *
 * Next.js only inlines NEXT_PUBLIC_ vars into client bundles when the key is a
 * static member expression. Dynamic access like `process.env[key]` or reading
 * through a generic `env` parameter leaves these undefined in the browser.
 */
function readPublicSupabaseEnvFromProcess() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

function readServiceRoleSupabaseEnvFromProcess() {
  return {
    ...readPublicSupabaseEnvFromProcess(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function getPublicSupabaseEnv(
  env?: NodeJS.ProcessEnv,
): PublicSupabaseEnv {
  const source = env
    ? {
        NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    : readPublicSupabaseEnvFromProcess();

  const parsed = publicSupabaseEnvSchema.safeParse(source);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid public Supabase environment: ${details}`);
  }

  return parsed.data;
}

export function getServiceRoleSupabaseEnv(
  env?: NodeJS.ProcessEnv,
): ServiceRoleSupabaseEnv {
  const source = env
    ? {
        NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
      }
    : readServiceRoleSupabaseEnvFromProcess();

  const parsed = serviceRoleSupabaseEnvSchema.safeParse(source);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid service-role Supabase environment: ${details}`);
  }

  return parsed.data;
}
