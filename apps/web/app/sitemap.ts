import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/roadmap`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/cookies`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/refund`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/signin`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/signup`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
