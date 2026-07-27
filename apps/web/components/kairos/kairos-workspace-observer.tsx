"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { rememberWorkspaceFactAction } from "../../app/(protected)/actions/platform";
import { useAppChrome } from "../app/app-chrome-provider";

const PAGE_FREQUENCY_KEY = "bos_kairos_page_frequency_v1";

/**
 * Lightweight client-side memory signal collector.
 * It only persists a page after the user has opened it three times.
 */
export function KairosWorkspaceObserver() {
  const pathname = usePathname();
  const { pushToast } = useAppChrome();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/auth")) return;

    try {
      const raw = window.localStorage.getItem(PAGE_FREQUENCY_KEY);
      const counts = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      const nextCount = (counts[pathname] ?? 0) + 1;
      counts[pathname] = nextCount;
      window.localStorage.setItem(PAGE_FREQUENCY_KEY, JSON.stringify(counts));

      if (nextCount !== 3) return;

      void rememberWorkspaceFactAction({
        fact: `Frequently opened page: ${pathname}`,
        summary: "Kairos noticed this workspace page is opened often.",
        sourceModule: "navigation",
        scope: "frequent_pages",
        importance: 1,
        metadata: { pathname, visits: nextCount },
      }).then((response) => {
        if (response.ok) {
          pushToast({
            title: "Memory Updated",
            description: "Kairos remembered a frequently opened page.",
            variant: "info",
          });
        }
      });
    } catch {
      // Storage is optional and can be unavailable in privacy mode.
    }
  }, [pathname, pushToast]);

  return null;
}
