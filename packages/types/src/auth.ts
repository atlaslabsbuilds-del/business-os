import { z } from "zod";

const strongPassword = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol");

export const appRoleSchema = z.enum(["user", "admin", "owner"]);
export type AppRole = z.infer<typeof appRoleSchema>;

export const authProviderSchema = z.enum(["email", "google"]);
export type AuthProvider = z.infer<typeof authProviderSchema>;

export type AuthUser = {
  id: string;
  email: string | null;
  emailConfirmedAt: string | null;
  appMetadata: Record<string, unknown>;
  userMetadata: Record<string, unknown>;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  user: AuthUser;
};

export type Profile = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationMember = {
  id: string;
  organizationId: string;
  userId: string;
  role: AppRole;
  createdAt: string;
  updatedAt: string;
};

export type UserRoleRecord = {
  id: string;
  userId: string;
  role: AppRole;
  createdAt: string;
  updatedAt: string;
};

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: strongPassword,
});

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "Full name is required")
      .max(120, "Full name must be at most 120 characters"),
    email: z.string().trim().email("Enter a valid email address"),
    password: strongPassword,
    confirmPassword: z.string().min(12, "Confirm your password"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: strongPassword,
    confirmPassword: z.string().min(12, "Confirm your password"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
