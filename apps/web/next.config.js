import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");

const appDir = path.dirname(fileURLToPath(import.meta.url));

// Explicitly load this app's env files (not the monorepo root).
const { loadedEnvFiles } = loadEnvConfig(appDir);

function mask(value) {
  if (!value) return "UNDEFINED";
  if (value.length <= 12) return "[SET]";
  return `${value.slice(0, 24)}… (len=${value.length})`;
}

console.log("\n[web] Environment loading");
console.log(`[web] appDir: ${appDir}`);
console.log(
  `[web] loaded env files: ${
    loadedEnvFiles.length
      ? loadedEnvFiles.map((file) => path.resolve(appDir, file.path)).join(", ")
      : "(none)"
  }`,
);
console.log(`[web] NEXT_PUBLIC_SUPABASE_URL=${mask(process.env.NEXT_PUBLIC_SUPABASE_URL)}`);
console.log(
  `[web] NEXT_PUBLIC_SUPABASE_ANON_KEY=${mask(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}`,
);
console.log(
  `[web] SUPABASE_SERVICE_ROLE_KEY=${mask(process.env.SUPABASE_SERVICE_ROLE_KEY)}`,
);
console.log(`[web] NEXT_PUBLIC_SITE_URL=${mask(process.env.NEXT_PUBLIC_SITE_URL)}\n`);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@repo/ai",
    "@repo/auth",
    "@repo/config",
    "@repo/database",
    "@repo/types",
    "@repo/ui",
  ],
  // Ensure public env is present for Next's compile-time inlining into client bundles.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
};

export default nextConfig;
