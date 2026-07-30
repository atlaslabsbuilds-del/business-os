import type { Metadata } from "next";
import { listBetaReleaseNotes } from "@repo/database/beta-launch";
import { MarketingShell } from "../../../components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "Changelog",
  description: "VanderBase public beta release notes and changelog.",
  alternates: { canonical: "/help/changelog" },
};

export const dynamic = "force-dynamic";

export default async function ChangelogPage() {
  const releases = await listBetaReleaseNotes({ limit: 20 }).catch(() => [
    {
      id: "public-beta-1",
      version: "public-beta-1",
      title: "Public Beta Launch",
      summary:
        "VanderBase public beta is ready with CRM, Finance, Projects, Documents, Calendar, Analytics, Notifications, Security, PWA, and Kairos.",
      highlights: [
        "Public beta onboarding",
        "Workspace templates",
        "Demo data generator",
        "Security dashboard",
        "Notification center",
      ],
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ]);

  return (
    <MarketingShell
      title="Changelog"
      subtitle="Release notes for public beta customers and early access teams."
    >
      <div className="space-y-4">
        {releases.map((release) => (
          <article
            key={release.id}
            className="rounded-3xl border border-border bg-surface p-6"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-primary">
              {release.version} · {new Date(release.publishedAt).toLocaleDateString()}
            </p>
            <h2 className="mt-2 text-xl font-semibold">{release.title}</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">{release.summary}</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {release.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="rounded-2xl border border-border/70 bg-elevated/40 px-3 py-2 text-sm"
                >
                  {highlight}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </MarketingShell>
  );
}
