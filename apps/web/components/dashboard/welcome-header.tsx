import { Sparkles } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { greetingForNow } from "./format";

export function WelcomeHeader({
  workspaceName,
  email,
  role,
  members,
  pendingInvites,
}: {
  workspaceName: string;
  email: string | null;
  role: string;
  members: number;
  pendingInvites: number;
}) {
  return (
    <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end pbos-animate-rise">
      <div className="space-y-3">
        <Badge variant="accent" className="w-fit gap-1.5">
          <Sparkles className="h-3 w-3" aria-hidden />
          Dashboard 2.0
        </Badge>
        <div>
          <p className="text-sm text-secondary">{greetingForNow()}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {workspaceName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
            Your Personal Brand OS command center — Actora CRM, Inbox, and AI
            Assistant in one workspace.
            {email ? (
              <>
                {" "}
                Signed in as <span className="text-foreground">{email}</span>.
              </>
            ) : null}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-surface p-2 text-center shadow-soft sm:min-w-[320px]">
        <MiniStat label="Members" value={members} />
        <MiniStat label="Invites" value={pendingInvites} />
        <MiniStat label="Role" value={role} />
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-elevated px-3 py-2 transition duration-200 hover:bg-background">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-medium capitalize text-foreground">
        {value}
      </p>
    </div>
  );
}
