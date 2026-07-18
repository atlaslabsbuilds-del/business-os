import { z } from "zod";

export const appEnvironmentSchema = z.enum(["development", "test", "production"]);

export type AppEnvironment = z.infer<typeof appEnvironmentSchema>;

export type AppConfig = {
  appName: string;
  environment: AppEnvironment;
};

export function getDefaultAppConfig(
  environment: AppEnvironment = "development",
): AppConfig {
  return {
    appName: "business-os",
    environment: appEnvironmentSchema.parse(environment),
  };
}

export {
  getPublicSupabaseEnv,
  getServiceRoleSupabaseEnv,
  publicSupabaseEnvSchema,
  serviceRoleSupabaseEnvSchema,
  type PublicSupabaseEnv,
  type ServiceRoleSupabaseEnv,
} from "./env";
