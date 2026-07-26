import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Inbox,
  Target,
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import type { DashboardSnapshot } from "@repo/types";
import { formatCurrency } from "./format";

export function KpiCards({ snapshot }: { snapshot: DashboardSnapshot }) {
  const items: Array<{
    title: string;
    value: string;
    hint: string;
    href: string;
    icon: ReactNode;
  }> = [
    {
      title: "Revenue pipeline",
      value: formatCurrency(snapshot.kpis.revenue),
      hint: `${snapshot.kpis.openDeals} open deals in CRM`,
      href: "/crm/deals",
      icon: <CircleDollarSign className="h-4 w-4" aria-hidden />,
    },
    {
      title: "Leads",
      value: snapshot.kpis.leads.toLocaleString(),
      hint: `${snapshot.crm.contacts} contacts · ${snapshot.crm.companies} companies`,
      href: "/crm/leads",
      icon: <Target className="h-4 w-4" aria-hidden />,
    },
    {
      title: "Open tasks",
      value: snapshot.kpis.openTasks.toLocaleString(),
      hint: "Inbox follow-ups and client tasks",
      href: "/inbox/tasks",
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden />,
    },
    {
      title: "Calendar",
      value: snapshot.kpis.upcomingEvents.toLocaleString(),
      hint: "Upcoming meetings and events",
      href: "/inbox/calendar",
      icon: <CalendarDays className="h-4 w-4" aria-hidden />,
    },
    {
      title: "Inbox",
      value: snapshot.kpis.unread.toLocaleString(),
      hint: `${snapshot.inbox.openThreads} open threads`,
      href: "/inbox",
      icon: <Inbox className="h-4 w-4" aria-hidden />,
    },
    {
      title: "AI credits",
      value: snapshot.kpis.aiCredits.toLocaleString(),
      hint: `${snapshot.chat.conversations} assistant conversations`,
      href: "/chat",
      icon: <Bot className="h-4 w-4" aria-hidden />,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 pbos-stagger">
      {items.map((item) => (
        <Link key={item.title} href={item.href} className="block">
          <Card className="group h-full transition duration-200 hover:border-primary/40 hover:bg-elevated">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{item.title}</CardTitle>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-muted text-primary transition duration-200 group-hover:scale-105">
                  {item.icon}
                </span>
              </div>
              <CardDescription>{item.hint}</CardDescription>
            </CardHeader>
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              {item.value}
            </p>
          </Card>
        </Link>
      ))}
    </section>
  );
}
