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
    <section className="bos-gradient-border bos-glass-strong bos-noise relative overflow-hidden rounded-[28px] p-6 sm:p-8 pbos-animate-rise">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.12),transparent_55%)]"
        aria-hidden
      />
      <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="space-y-4">
          <Badge variant="accent" className="w-fit gap-1.5">
            <Sparkles className="h-3 w-3" aria-hidden />
            Command Center
          </Badge>
          <div>
            <p className="text-sm text-secondary">
              {greetingForNow()}, {email?.split("@")[0] ?? "there"}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {workspaceName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary">
              Your operating system for CRM, Inbox, Content, Calendar, and AI — unified in one workspace.
              {email ? (
                <>
                  {" "}
                  Signed in as <span className="text-foreground">{email}</span>.
                </>
              ) : null}
            </p>
          </div>
        </div>
        <div className="bos-glass grid grid-cols-3 gap-2 rounded-2xl p-2 sm:min-w-[320px]">
          <MiniStat label="Members" value={members} />
          <MiniStat label="Invites" value={pendingInvites} />
          <MiniStat label="Role" value={role} />
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-elevated/60 px-3 py-2.5 text-center transition duration-200 hover:bg-elevated">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold capitalize text-foreground">{value}</p>
    </div>
  );
}
