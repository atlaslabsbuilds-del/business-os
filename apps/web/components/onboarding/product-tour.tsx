"use client";

import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";

const TOUR_KEY = "vb-product-tour-v1";

const STEPS = [
  {
    title: "Welcome to VanderBase",
    body: "Your AI-native Business OS — CRM, projects, finance, documents, and Kairos in one workspace.",
  },
  {
    title: "Command with Kairos",
    body: "Ask Kairos to summarize activity, show unread notifications, review security, or optimize your workspace.",
  },
  {
    title: "Stay notified",
    body: "The Notification Center consolidates mentions, tasks, finance, CRM, calendar, and system alerts.",
  },
  {
    title: "Install the app",
    body: "VanderBase is PWA-ready — install for offline support, fast startup, and a mobile-first shell.",
  },
];

export function ProductTour() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(TOUR_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) return null;
  const step = STEPS[index] ?? STEPS[0];
  if (!step) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <Card elevated className="w-full max-w-md pbos-animate-rise">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.16em] text-primary">
            Product tour · {index + 1}/{STEPS.length}
          </p>
          <CardTitle>{step.title}</CardTitle>
          <CardDescription>{step.body}</CardDescription>
        </CardHeader>
        <div className="flex justify-between gap-2 px-5 pb-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              try {
                window.localStorage.setItem(TOUR_KEY, "1");
              } catch {
                /* ignore */
              }
              setOpen(false);
            }}
          >
            Skip
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (index >= STEPS.length - 1) {
                try {
                  window.localStorage.setItem(TOUR_KEY, "1");
                } catch {
                  /* ignore */
                }
                setOpen(false);
                return;
              }
              setIndex((value) => value + 1);
            }}
          >
            {index >= STEPS.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
