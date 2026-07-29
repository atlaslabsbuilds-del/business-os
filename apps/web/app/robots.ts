import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/contact", "/terms", "/privacy", "/cookies", "/refund", "/signin", "/signup"],
        disallow: [
          "/dashboard",
          "/crm",
          "/inbox",
          "/chat",
          "/ai",
          "/settings",
          "/team",
          "/account",
          "/onboarding",
          "/workspace",
          "/content",
          "/social",
          "/website",
          "/calendar",
          "/finance",
          "/analytics",
          "/finance",
          "/api/",
          "/waitlist/success",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
