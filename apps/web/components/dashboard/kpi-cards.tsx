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
import { AnimatedMetric } from "../app/animated-metric";
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
      title: "Revenue today",
      value: formatCurrency(snapshot.today.revenue),
      hint: `${snapshot.kpis.openDeals} open deals · ${formatCurrency(snapshot.kpis.revenue)} pipeline`,
      href: "/analytics?focus=revenue",
      icon: <CircleDollarSign className="h-4 w-4" aria-hidden />,
    },
    {
      title: "New customers",
      value: snapshot.today.newCustomers.toLocaleString(),
      hint: `${snapshot.crm.contacts} total contacts · ${snapshot.crm.companies} companies`,
      href: "/customers?focus=signups",
      icon: <Target className="h-4 w-4" aria-hidden />,
    },
    {
      title: "Pending tasks",
      value: snapshot.today.pendingTasks.toLocaleString(),
      hint: "Inbox follow-ups and client tasks",
      href: "/inbox/tasks",
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden />,
    },
    {
      title: "Calendar",
      value: snapshot.today.meetings.toLocaleString(),
      hint: "Meetings scheduled for today",
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
          <Card className="bos-float group relative h-full overflow-hidden transition duration-300 hover:border-primary/35">
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(circle at top right, rgba(249,115,22,0.08), transparent 55%)",
              }}
              aria-hidden
            />
            <CardHeader className="relative">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{item.title}</CardTitle>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted text-primary transition duration-300 group-hover:scale-105 group-hover:shadow-[0_0_24px_rgba(249,115,22,0.2)]">
                  {item.icon}
                </span>
              </div>
              <CardDescription>{item.hint}</CardDescription>
            </CardHeader>
            <p className="relative px-6 pb-6 text-3xl font-semibold tracking-tight text-foreground">
              <AnimatedMetric value={item.value} />
            </p>
          </Card>
        </Link>
      ))}
    </section>
  );
}
