"use client";

import { createBrowserClient } from "@repo/database/browser";
import type {
  ForgotPasswordInput,
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
} from "@repo/types/auth";

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

export async function signInWithGoogle(redirectTo: string) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
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
    throw new Error(error.message);
  }

  return data;
}

export async function signOutClient() {
  const supabase = createBrowserClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}
