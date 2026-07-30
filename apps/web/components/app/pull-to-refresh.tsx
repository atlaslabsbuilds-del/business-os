"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}) {
  const startY = useRef(0);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const reset = useCallback(() => setPull(0), []);

  useEffect(() => {
    const onTouchStart = (event: TouchEvent) => {
      if (window.scrollY > 0 || refreshing) return;
      startY.current = event.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (window.scrollY > 0 || refreshing) return;
      const current = event.touches[0]?.clientY ?? 0;
      const delta = Math.max(0, Math.min(88, current - startY.current));
      if (delta > 8) setPull(delta);
    };
    const onTouchEnd = async () => {
      if (pull > 64) {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
      reset();
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, pull, refreshing, reset]);

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center text-xs text-primary transition-opacity lg:hidden"
        style={{ opacity: pull > 12 || refreshing ? 1 : 0, transform: `translateY(${Math.max(pull - 24, 0)}px)` }}
        aria-live="polite"
      >
        {refreshing ? "Refreshing…" : pull > 64 ? "Release to refresh" : "Pull to refresh"}
      </div>
      {children}
    </div>
  );
}
