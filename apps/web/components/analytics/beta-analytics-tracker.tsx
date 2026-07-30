"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackBetaEventAction } from "../../app/(protected)/actions/beta-launch";

export function BetaAnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const eventCategory =
      pathname === "/chat" || pathname.startsWith("/ai") ? "ai_usage" : "feature_usage";
    void trackBetaEventAction({
      eventName: "page_view",
      eventCategory,
      path: pathname,
      metadata: { module: moduleFromPath(pathname) },
    });
  }, [pathname]);

  return null;
}

function moduleFromPath(pathname: string): string {
  const [, first] = pathname.split("/");
  return first || "dashboard";
}
