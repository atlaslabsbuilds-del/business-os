"use client";

import { useEffect, useState } from "react";
import type { WaitlistStats } from "@repo/database/waitlist";

const POLL_MS = 12_000;

export function useWaitlistStats() {
  const [stats, setStats] = useState<WaitlistStats>({ count: 0, recent: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/waitlist/stats", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load waitlist stats.");
        }
        const data = (await response.json()) as WaitlistStats;
        if (!cancelled) {
          setStats(data);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load waitlist stats.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return { stats, loading, error };
}
