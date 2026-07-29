"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "vb_verify_resend_at";
const COOLDOWN_SECONDS = 60;

function getRemainingSeconds(): number {
  if (typeof window === "undefined") return 0;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return 0;
  const elapsed = Math.floor((Date.now() - Number(stored)) / 1000);
  return Math.max(0, COOLDOWN_SECONDS - elapsed);
}

export function useResendCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    setSecondsLeft(getRemainingSeconds());
    const interval = window.setInterval(() => {
      setSecondsLeft(getRemainingSeconds());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const startCountdown = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
    setSecondsLeft(COOLDOWN_SECONDS);
  }, []);

  return {
    secondsLeft,
    canResend: secondsLeft === 0,
    startCountdown,
  };
}
