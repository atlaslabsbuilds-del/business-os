"use client";

import { createBrowserClient } from "@repo/database/browser";
import type {
  ForgotPasswordInput,
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
} from "@repo/types/auth";
import { buildAuthCallbackUrl, getSiteUrl } from "./site-url";

export { buildAuthCallbackUrl, getSiteUrl };

export async function signInWithPassword(input: SignInInput) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signUpWithPassword(
  input: SignUpInput,
  emailRedirectTo: string,
) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo,
      data: {
        full_name: input.fullName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signInWithGoogle(
  redirectTo?: string,
  nextPath = "/dashboard",
) {
  const supabase = createBrowserClient();
  const callbackUrl =
    redirectTo ?? buildAuthCallbackUrl(nextPath, getSiteUrl());
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function requestPasswordReset(
  input: ForgotPasswordInput,
  redirectTo: string,
) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updatePassword(input: ResetPasswordInput) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.updateUser({
    password: input.password,
  });

  if (error) {
    throw new Error(mapPasswordUpdateError(error.message));
  }

  return data;
}

function mapPasswordUpdateError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("expired") ||
    lower.includes("session missing") ||
    lower.includes("not authenticated") ||
    lower.includes("jwt")
  ) {
    return "This reset link has expired. Request a new one and try again.";
  }
  if (
    lower.includes("already been used") ||
    lower.includes("reuse") ||
    lower.includes("invalid") ||
    lower.includes("flow state")
  ) {
    return "This reset link is no longer valid. Request a new one and try again.";
  }
  if (
    lower.includes("weak") ||
    lower.includes("at least") ||
    lower.includes("password should") ||
    lower.includes("too short")
  ) {
    return "Choose a stronger password (12+ characters with upper, lower, number, and symbol).";
  }
  if (lower.includes("same") || lower.includes("different from the old")) {
    return "Choose a password that is different from your current one.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }
  return message || "Unable to update password. Please try again.";
}

export async function signOutClient() {
  const supabase = createBrowserClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function resendVerificationEmail(email: string, emailRedirectTo: string) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getAuthSession() {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }
  return data.session;
}

/** Listen for password-recovery session establishment (email link). */
export function onPasswordRecovery(
  callback: (ready: boolean) => void,
): () => void {
  const supabase = createBrowserClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
      callback(Boolean(session));
    }
  });
  return () => subscription.unsubscribe();
}
