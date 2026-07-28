import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@repo/types";
import { createAdminClient } from "./admin";

export const WAITLIST_TEAM_SIZES = ["1", "2-10", "11-50", "51-200", "200+"] as const;
export type WaitlistTeamSize = (typeof WAITLIST_TEAM_SIZES)[number];

export type WaitlistEntry = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  teamSize: WaitlistTeamSize;
  status: string;
  referralCode: string;
  referredBy: string | null;
  shareCompanyPublicly: boolean;
  marketingConsent: boolean;
  createdAt: string;
};

export type WaitlistPublicSignup = {
  id: string;
  message: string;
  createdAt: string;
};

export type WaitlistStats = {
  count: number;
  recent: WaitlistPublicSignup[];
};

export type WaitlistSuccessData = {
  id: string;
  name: string;
  position: number;
  referralCount: number;
  referralUrl: string;
  estimatedEarlyAccess: string;
};

type WaitlistRow = Database["public"]["Tables"]["waitlist"]["Row"];

function adminOrDefault(client?: SupabaseClient<Database>) {
  return client ?? createAdminClient();
}

function mapWaitlistRow(row: WaitlistRow): WaitlistEntry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    teamSize: row.team_size as WaitlistTeamSize,
    status: row.status,
    referralCode: row.referral_code,
    referredBy: row.referred_by,
    shareCompanyPublicly: row.share_company_publicly,
    marketingConsent: row.marketing_consent,
    createdAt: row.created_at,
  };
}

function generateReferralCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function formatPublicSignupMessage(row: Pick<WaitlistRow, "company" | "share_company_publicly">, index: number): string {
  if (row.share_company_publicly && row.company?.trim()) {
    return `${row.company.trim()} joined the waitlist.`;
  }
  return index % 2 === 0 ? "Founder joined recently." : "New founder joined the waitlist.";
}

function computePosition(
  entryId: string,
  entries: Array<{ id: string; createdAt: string }>,
  referralCounts: Map<string, number>,
): number {
  const sorted = [...entries].sort((left, right) => {
    const byTime = left.createdAt.localeCompare(right.createdAt);
    return byTime !== 0 ? byTime : left.id.localeCompare(right.id);
  });

  const rawPosition = sorted.findIndex((entry) => entry.id === entryId) + 1;
  if (rawPosition <= 0) {
    return sorted.length;
  }

  const referralBoost = referralCounts.get(entryId) ?? 0;
  return Math.max(1, rawPosition - referralBoost);
}

async function buildReferralCounts(
  supabase: SupabaseClient<Database>,
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("waitlist")
    .select("referred_by")
    .eq("status", "active")
    .not("referred_by", "is", null);

  if (error) {
    throw new Error(`Failed to count waitlist referrals: ${error.message}`);
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.referred_by) continue;
    counts.set(row.referred_by, (counts.get(row.referred_by) ?? 0) + 1);
  }
  return counts;
}

async function listActiveWaitlistEntries(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("waitlist")
    .select("id, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Failed to list waitlist entries: ${error.message}`);
  }

  return (data ?? []).map((row) => ({ id: row.id, createdAt: row.created_at }));
}

export async function getWaitlistCount(client?: SupabaseClient<Database>): Promise<number> {
  const supabase = adminOrDefault(client);
  const { count, error } = await supabase
    .from("waitlist")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  if (error) {
    throw new Error(`Failed to count waitlist entries: ${error.message}`);
  }

  return count ?? 0;
}

export async function getWaitlistStats(client?: SupabaseClient<Database>): Promise<WaitlistStats> {
  const supabase = adminOrDefault(client);
  const [count, recentResult] = await Promise.all([
    getWaitlistCount(supabase),
    supabase
      .from("waitlist")
      .select("id, company, share_company_publicly, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (recentResult.error) {
    throw new Error(`Failed to load recent waitlist signups: ${recentResult.error.message}`);
  }

  const recent = (recentResult.data ?? []).map((row, index) => ({
    id: row.id,
    message: formatPublicSignupMessage(row, index),
    createdAt: row.created_at,
  }));

  return { count, recent };
}

export async function getWaitlistEntryByReferralCode(
  code: string,
  client?: SupabaseClient<Database>,
): Promise<WaitlistEntry | null> {
  const supabase = adminOrDefault(client);
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const { data, error } = await supabase
    .from("waitlist")
    .select("*")
    .eq("referral_code", normalized)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve waitlist referral: ${error.message}`);
  }

  return data ? mapWaitlistRow(data) : null;
}

export async function joinWaitlist(input: {
  name: string;
  email: string;
  company?: string | null;
  teamSize: WaitlistTeamSize;
  marketingConsent: boolean;
  referredByCode?: string | null;
  shareCompanyPublicly?: boolean;
  siteUrl: string;
  client?: SupabaseClient<Database>;
}): Promise<
  | { ok: true; entry: WaitlistEntry; position: number; referralCount: number }
  | { ok: false; code: "duplicate_email" | "invalid_referral" | "validation"; message: string }
> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const company = input.company?.trim() || null;

  if (!name || !email || !WAITLIST_TEAM_SIZES.includes(input.teamSize)) {
    return { ok: false, code: "validation", message: "Please complete all required fields." };
  }

  if (!input.marketingConsent) {
    return {
      ok: false,
      code: "validation",
      message: "Please agree to receive product updates to join the waitlist.",
    };
  }

  const supabase = adminOrDefault(input.client);

  let referredById: string | null = null;
  if (input.referredByCode?.trim()) {
    const referrer = await getWaitlistEntryByReferralCode(input.referredByCode, supabase);
    if (!referrer) {
      return { ok: false, code: "invalid_referral", message: "That referral link is not valid." };
    }
    referredById = referrer.id;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referralCode = generateReferralCode();
    const { data, error } = await supabase
      .from("waitlist")
      .insert({
        name,
        email,
        company,
        team_size: input.teamSize,
        referral_code: referralCode,
        referred_by: referredById,
        share_company_publicly: input.shareCompanyPublicly ?? false,
        marketing_consent: input.marketingConsent,
        status: "active",
      })
      .select("*")
      .single();

    if (!error && data) {
      const entry = mapWaitlistRow(data);
      const [entries, referralCounts] = await Promise.all([
        listActiveWaitlistEntries(supabase),
        buildReferralCounts(supabase),
      ]);
      const position = computePosition(entry.id, entries, referralCounts);
      const referralCount = referralCounts.get(entry.id) ?? 0;
      void input.siteUrl;
      return { ok: true, entry, position, referralCount };
    }

    if (error?.code === "23505") {
      if (error.message.includes("waitlist_email_unique") || error.message.includes("email")) {
        return {
          ok: false,
          code: "duplicate_email",
          message: "This email is already on the VanderBase waitlist.",
        };
      }
      continue;
    }

    throw new Error(`Failed to join waitlist: ${error?.message ?? "Unknown error"}`);
  }

  throw new Error("Failed to generate a unique referral code.");
}

export async function getWaitlistSuccessData(input: {
  entryId: string;
  siteUrl: string;
  client?: SupabaseClient<Database>;
}): Promise<WaitlistSuccessData | null> {
  const supabase = adminOrDefault(input.client);
  const { data, error } = await supabase
    .from("waitlist")
    .select("*")
    .eq("id", input.entryId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load waitlist entry: ${error.message}`);
  }

  if (!data) return null;

  const [entries, referralCounts] = await Promise.all([
    listActiveWaitlistEntries(supabase),
    buildReferralCounts(supabase),
  ]);

  const entry = mapWaitlistRow(data);
  const referralCount = referralCounts.get(entry.id) ?? 0;
  const position = computePosition(entry.id, entries, referralCounts);
  const baseUrl = input.siteUrl.replace(/\/$/, "");

  return {
    id: entry.id,
    name: entry.name,
    position,
    referralCount,
    referralUrl: `${baseUrl}/ref/${entry.referralCode}`,
    estimatedEarlyAccess: "Q4 2026",
  };
}
