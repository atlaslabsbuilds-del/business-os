"use client";

import { Button } from "@repo/ui/button";
import { ProjectsShell } from "../../../components/projects/projects-shell";

export default function ProjectsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ProjectsShell title="Projects" description="Something went wrong loading projects.">
      <div className="bos-glass-strong flex min-h-[280px] flex-col items-center justify-center rounded-3xl p-8 text-center">
        <p className="text-lg font-semibold">Projects could not load</p>
        <Button className="mt-5" onClick={reset}>Retry</Button>
      </div>
    </ProjectsShell>
  );
}
