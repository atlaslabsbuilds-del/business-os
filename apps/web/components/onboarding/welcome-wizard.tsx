"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import type { WorkspaceBetaLaunchProfile, WorkspaceTemplateKey } from "@repo/types";
import {
  getBetaLaunchProfileAction,
  seedDemoWorkspaceAction,
  updateBetaLaunchProfileAction,
} from "../../app/(protected)/actions/beta-launch";
import { WORKSPACE_TEMPLATES } from "../../lib/workspace-templates";
import { OnboardingChecklist } from "../ai/onboarding-checklist";

const WIZARD_STEPS = [
  { label: "Workspace setup", href: "/settings" },
  { label: "Invite team", href: "/team" },
  { label: "Connect integrations", href: "/integrations" },
  { label: "Create first project", href: "/projects" },
  { label: "Create first document", href: "/documents" },
  { label: "Talk to Kairos", href: "/chat" },
];

export function WelcomeWizard({
  initialProfile,
  workspaceName,
}: {
  initialProfile: WorkspaceBetaLaunchProfile;
  workspaceName: string;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [readiness, setReadiness] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    startTransition(async () => {
      const result = await getBetaLaunchProfileAction();
      if (result.ok) {
        setProfile(result.data.profile);
        setReadiness(result.data.readiness.score);
      }
    });
  }, []);

  function selectTemplate(templateKey: WorkspaceTemplateKey) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateBetaLaunchProfileAction({
        templateKey,
        launchStage: "setup",
      });
      if (result.ok) {
        setProfile(result.data.profile);
        setMessage(`${templateName(templateKey)} template selected.`);
      } else {
        setMessage(result.error);
      }
    });
  }

  function seedDemo() {
    setMessage(null);
    startTransition(async () => {
      const result = await seedDemoWorkspaceAction({
        templateKey: profile.templateKey || "startup",
      });
      if (result.ok) {
        setProfile(result.data.profile);
        setMessage(
          result.data.seeded
            ? "Demo workspace generated."
            : "Demo data was already generated.",
        );
      } else {
        setMessage(result.error);
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="bos-gradient-border bos-glass-strong bos-noise relative overflow-hidden rounded-[28px] p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.16),transparent_55%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Badge variant="accent">Public Beta</Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome to {workspaceName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary">
              Choose a workspace template, invite your team, connect integrations,
              create your first project and document, then ask Kairos to help.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-elevated/50 p-4 text-right">
            <p className="text-3xl font-semibold text-primary">{readiness ?? 25}%</p>
            <p className="text-xs text-muted">beta readiness</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {WORKSPACE_TEMPLATES.map((template) => {
          const Icon = template.icon;
          const active = profile.templateKey === template.key;
          return (
            <button
              key={template.key}
              type="button"
              onClick={() => selectTemplate(template.key)}
              disabled={pending}
              className={`rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/40 ${
                active
                  ? "border-primary/40 bg-primary-muted/20"
                  : "border-border bg-surface"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-2xl bg-primary/15 p-2.5 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                {active ? <Badge variant="accent">Selected</Badge> : null}
              </div>
              <h2 className="mt-4 text-base font-semibold">{template.name}</h2>
              <p className="mt-2 text-xs leading-5 text-secondary">{template.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {template.modules.slice(0, 4).map((module) => (
                  <span
                    key={module}
                    className="rounded-full border border-border px-2 py-1 text-[10px] text-muted"
                  >
                    {module}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bos-glass rounded-[24px] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-primary">
                Quick start
              </p>
              <h2 className="mt-2 text-xl font-semibold">Launch path</h2>
            </div>
            <Button onClick={seedDemo} disabled={pending} size="sm">
              Generate demo workspace
            </Button>
          </div>
          {message ? <p className="mt-3 text-sm text-secondary">{message}</p> : null}
          <ol className="mt-5 space-y-2">
            {WIZARD_STEPS.map((step, index) => (
              <li
                key={step.href}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-elevated/40 px-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                <Link
                  href={step.href}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Open
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <OnboardingChecklist />
      </section>
    </div>
  );
}

function templateName(key: string): string {
  return WORKSPACE_TEMPLATES.find((template) => template.key === key)?.name ?? "Blank";
}
