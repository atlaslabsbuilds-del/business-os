import { z } from "zod";

export const websiteProjectTypeSchema = z.enum([
  "website",
  "landing_page",
  "link_in_bio",
  "media_kit",
  "portfolio",
]);
export type WebsiteProjectType = z.infer<typeof websiteProjectTypeSchema>;

export type WebsiteProject = {
  id: string;
  workspaceId: string;
  createdBy: string;
  name: string;
  projectType: WebsiteProjectType;
  template: string;
  status: "draft" | "published" | "archived";
  slug: string;
  theme: Record<string, unknown>;
  settings: Record<string, unknown>;
  analytics: { views: number; clicks: number; submissions: number };
  createdAt: string;
  updatedAt: string;
};

export type WebsiteBlock = {
  id: string;
  type: "hero" | "features" | "testimonials" | "pricing" | "faq" | "cta" | "text" | "gallery";
  props: Record<string, unknown>;
};

export type WebsitePage = {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  blocks: WebsiteBlock[];
  seo: Record<string, unknown>;
  sortOrder: number;
  updatedAt: string;
};

export type WebsiteLink = {
  id: string;
  projectId: string;
  label: string;
  url: string;
  icon: string | null;
  sortOrder: number;
  clicks: number;
  active: boolean;
};

export type WebsiteForm = {
  id: string;
  projectId: string | null;
  name: string;
  formType: "contact" | "lead_capture" | "newsletter";
  fields: unknown[];
  submissions: number;
  active: boolean;
};

export type WebsiteDomain = {
  id: string;
  projectId: string | null;
  domain: string;
  status: "pending" | "verified" | "error";
  sslStatus: "pending" | "active" | "error";
  dnsInstructions: Record<string, unknown>;
};

export type WebsiteDashboardStats = {
  projects: number;
  published: number;
  pages: number;
  links: number;
  views: number;
  clicks: number;
  submissions: number;
  domains: number;
};

export const createWebsiteProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  projectType: websiteProjectTypeSchema.default("website"),
  template: z.string().trim().min(1).max(80).default("creator"),
  prompt: z.string().trim().max(3000).optional(),
});

export const generateWebsiteSchema = z.object({
  name: z.string().trim().min(1).max(120),
  projectType: websiteProjectTypeSchema,
  prompt: z.string().trim().min(3).max(3000),
  template: z.string().trim().min(1).max(80).default("creator"),
});

export type CreateWebsiteProjectInput = z.infer<typeof createWebsiteProjectSchema>;
export type GenerateWebsiteInput = z.infer<typeof generateWebsiteSchema>;
