import type { Metadata } from "next";
import Link from "next/link";
import { getUser } from "@repo/auth/server";
import { listRoadmapFeedback } from "@repo/database/feedback";
import { Button } from "@repo/ui/button";
import { VanderBaseLogo } from "../../components/branding/vanderbase-logo";
import { RoadmapBoard } from "../../components/feedback/feedback-client";

export const metadata: Metadata = {
  title: "Product Roadmap | VanderBase",
  description: "See what VanderBase is planning, building, and shipping — and vote on feature requests.",
};

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const user = await getUser();
  const items = await listRoadmapFeedback({ userId: user?.id ?? null });

  return (
    <div className="bos-atmosphere min-h-screen">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4 sm:px-8 sm:py-5">
          <Link href="/" className="inline-flex items-center" aria-label="VanderBase">
            <VanderBaseLogo size="nav" priority />
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/feedback">
                <Button size="sm">Submit feedback</Button>
              </Link>
            ) : (
              <Link href="/signin">
                <Button size="sm" variant="secondary">
                  Sign in to vote
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Roadmap</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            What we&apos;re building next
          </h1>
          <p className="mt-3 text-sm leading-6 text-secondary">
            Feature requests that reach Planned, In Progress, or Completed appear here. Sign in to vote
            and help prioritize the roadmap.
          </p>
        </div>
        <RoadmapBoard items={items} />
      </main>
    </div>
  );
}
