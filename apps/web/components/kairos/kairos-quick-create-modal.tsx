"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  createCrmContactAction,
  createCrmDealAction,
  createCrmNoteAction,
} from "../../app/(protected)/actions/crm";
import {
  createInboxTaskAction,
  scheduleInboxMeetingAction,
} from "../../app/(protected)/actions/inbox";
import { useAppChrome } from "../app/app-chrome-provider";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

const TITLES: Record<string, string> = {
  customer: "Create Customer",
  deal: "Create Deal",
  task: "Create Task",
  reminder: "Create Reminder",
  note: "Create Note",
  meeting: "Schedule Meeting",
};

function defaultReminderDueAt() {
  const d = new Date();
  d.setHours(d.getHours() + 24);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export function KairosQuickCreateModal() {
  const router = useRouter();
  const {
    quickCreate,
    closeQuickCreate,
    pushToast,
    advanceWorkflow,
    showActionStatus,
  } = useAppChrome();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const open = Boolean(quickCreate);

  useEffect(() => {
    setError(null);
  }, [quickCreate]);

  const draft = quickCreate?.draft ?? {};
  const entity = quickCreate?.entity;
  const workflowContinue = quickCreate?.workflowContinue;

  function onOpenChange(next: boolean) {
    if (!next) closeQuickCreate();
  }

  function afterSuccess(redirect: string, title: string, description: string) {
    pushToast({ title, description, variant: "success" });
    closeQuickCreate();
    if (workflowContinue) {
      advanceWorkflow();
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  function submitCustomer(form: FormData) {
    startTransition(async () => {
      setError(null);
      await showActionStatus("Creating customer...", 500);
      const result = await createCrmContactAction({
        firstName: String(form.get("firstName") ?? ""),
        lastName: String(form.get("lastName") ?? ""),
        email: String(form.get("email") ?? "") || null,
        phone: String(form.get("phone") ?? "") || null,
        title: String(form.get("title") ?? "") || null,
        source: String(form.get("source") ?? "Kairos") || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      afterSuccess("/customers", "Customer created", "Added to your CRM contacts.");
    });
  }

  function submitDeal(form: FormData) {
    startTransition(async () => {
      setError(null);
      await showActionStatus("Creating deal...", 500);
      const result = await createCrmDealAction({
        title: String(form.get("title") ?? ""),
        amount: Number(form.get("amount") ?? 0),
        stage: String(form.get("stage") ?? "qualified"),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      afterSuccess("/deals", "Deal created", "Added to your pipeline.");
    });
  }

  function submitTask(form: FormData, asReminder = false) {
    startTransition(async () => {
      setError(null);
      await showActionStatus(
        asReminder ? "Creating reminder..." : "Creating task...",
        500,
      );
      const dueRaw = String(form.get("dueAt") ?? "");
      const dueAt = dueRaw ? new Date(dueRaw).toISOString() : null;
      const result = await createInboxTaskAction({
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? "") || null,
        dueAt,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      afterSuccess(
        "/inbox/tasks",
        asReminder ? "Reminder created" : "Task created",
        asReminder ? "Due date saved on your task list." : "Added to Inbox tasks.",
      );
    });
  }

  function submitNote(form: FormData) {
    startTransition(async () => {
      setError(null);
      await showActionStatus("Saving note...", 500);
      const result = await createCrmNoteAction({
        body: String(form.get("body") ?? ""),
        contactId: String(form.get("contactId") ?? "") || null,
        companyId: String(form.get("companyId") ?? "") || null,
        dealId: String(form.get("dealId") ?? "") || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      afterSuccess("/crm/notes", "Note saved", "Added to your CRM notes.");
    });
  }

  function submitMeeting(form: FormData) {
    startTransition(async () => {
      setError(null);
      await showActionStatus("Scheduling meeting...", 500);
      const startsAt = new Date(String(form.get("startsAt") ?? ""));
      const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
      const result = await scheduleInboxMeetingAction({
        title: String(form.get("title") ?? ""),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        location: String(form.get("location") ?? "") || null,
        threadId: String(form.get("threadId") ?? "") || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      afterSuccess("/calendar", "Meeting scheduled", "Added to your calendar.");
    });
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-md data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="bos-glass-strong bos-noise fixed top-1/2 left-1/2 z-[131] w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[22px] p-6 shadow-elevated outline-none max-sm:top-auto max-sm:bottom-0 max-sm:translate-y-0 max-sm:rounded-b-none">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Kairos Action
              </p>
              <DialogPrimitive.Title className="mt-1 text-lg font-semibold tracking-tight">
                {entity ? TITLES[entity] : "Create"}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-sm text-secondary">
                Prefills from your command when available.
                {workflowContinue ? " · Workflow step" : ""}
              </DialogPrimitive.Description>
            </div>
            <button
              type="button"
              onClick={closeQuickCreate}
              className="rounded-xl border border-border/60 bg-elevated/60 p-1.5 text-muted transition hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {entity === "customer" ? (
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                submitCustomer(new FormData(event.currentTarget));
              }}
            >
              <Field label="First name">
                <Input
                  name="firstName"
                  required
                  defaultValue={draft.firstName ?? ""}
                  placeholder="Ada"
                  autoFocus
                />
              </Field>
              <Field label="Last name">
                <Input
                  name="lastName"
                  defaultValue={draft.lastName ?? ""}
                  placeholder="Lovelace"
                />
              </Field>
              <Field label="Email">
                <Input name="email" type="email" placeholder="ada@example.com" />
              </Field>
              <Field label="Phone">
                <Input name="phone" placeholder="+1…" />
              </Field>
              <Field label="Title">
                <Input name="title" placeholder="Founder" />
              </Field>
              <Field label="Source">
                <Input name="source" defaultValue="Kairos" placeholder="Kairos" />
              </Field>
              {error ? (
                <p className="text-sm text-error sm:col-span-2">{error}</p>
              ) : null}
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="ghost" onClick={closeQuickCreate}>
                  Cancel
                </Button>
                <Button type="submit" loading={pending}>
                  Create customer
                </Button>
              </div>
            </form>
          ) : null}

          {entity === "deal" ? (
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                submitDeal(new FormData(event.currentTarget));
              }}
            >
              <div className="sm:col-span-2">
                <Field label="Deal title">
                  <Input
                    name="title"
                    required
                    defaultValue={draft.title ?? ""}
                    placeholder="Enterprise plan"
                    autoFocus
                  />
                </Field>
              </div>
              <Field label="Amount">
                <Input name="amount" type="number" min="0" step="0.01" defaultValue="0" />
              </Field>
              <Field label="Stage">
                <select
                  name="stage"
                  className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm text-foreground"
                  defaultValue="qualified"
                >
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </Field>
              {error ? (
                <p className="text-sm text-error sm:col-span-2">{error}</p>
              ) : null}
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="ghost" onClick={closeQuickCreate}>
                  Cancel
                </Button>
                <Button type="submit" loading={pending}>
                  Create deal
                </Button>
              </div>
            </form>
          ) : null}

          {entity === "task" ? (
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                submitTask(new FormData(event.currentTarget), false);
              }}
            >
              <Field label="Task">
                <Input
                  name="title"
                  required
                  defaultValue={draft.title ?? ""}
                  placeholder="Follow up with customer"
                  autoFocus
                />
              </Field>
              <Field label="Description">
                <Input
                  name="description"
                  defaultValue={draft.description ?? ""}
                  placeholder="Optional notes"
                />
              </Field>
              {error ? <p className="text-sm text-error">{error}</p> : null}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={closeQuickCreate}>
                  Cancel
                </Button>
                <Button type="submit" loading={pending}>
                  Create task
                </Button>
              </div>
            </form>
          ) : null}

          {entity === "reminder" ? (
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                submitTask(new FormData(event.currentTarget), true);
              }}
            >
              <Field label="Reminder">
                <Input
                  name="title"
                  required
                  defaultValue={draft.title ?? ""}
                  placeholder="Call Ada about proposal"
                  autoFocus
                />
              </Field>
              <Field label="Due">
                <Input
                  name="dueAt"
                  type="datetime-local"
                  required
                  defaultValue={draft.dueAt ?? defaultReminderDueAt()}
                />
              </Field>
              <Field label="Notes">
                <Input
                  name="description"
                  defaultValue={draft.description ?? "Reminder from Kairos"}
                  placeholder="Optional notes"
                />
              </Field>
              {error ? <p className="text-sm text-error">{error}</p> : null}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={closeQuickCreate}>
                  Cancel
                </Button>
                <Button type="submit" loading={pending}>
                  Create reminder
                </Button>
              </div>
            </form>
          ) : null}

          {entity === "note" ? (
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                submitNote(new FormData(event.currentTarget));
              }}
            >
              <Field label="Note">
                <textarea
                  name="body"
                  required
                  autoFocus
                  defaultValue={draft.body ?? draft.title ?? ""}
                  placeholder="Capture the important context…"
                  rows={5}
                  className="w-full rounded-xl border border-border/70 bg-elevated/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </Field>
              <input type="hidden" name="contactId" value={draft.customerId ?? ""} />
              <input type="hidden" name="companyId" value={draft.companyId ?? ""} />
              <input type="hidden" name="dealId" value={draft.dealId ?? ""} />
              {error ? <p className="text-sm text-error">{error}</p> : null}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={closeQuickCreate}>
                  Cancel
                </Button>
                <Button type="submit" loading={pending}>
                  Save note
                </Button>
              </div>
            </form>
          ) : null}

          {entity === "meeting" ? (
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                submitMeeting(new FormData(event.currentTarget));
              }}
            >
              <Field label="Meeting">
                <Input
                  name="title"
                  required
                  autoFocus
                  defaultValue={draft.title ?? ""}
                  placeholder="Customer follow-up"
                />
              </Field>
              <Field label="Starts">
                <Input
                  name="startsAt"
                  type="datetime-local"
                  required
                  defaultValue={draft.startsAt ?? defaultReminderDueAt()}
                />
              </Field>
              <Field label="Location">
                <Input name="location" defaultValue={draft.location ?? ""} placeholder="Zoom or office" />
              </Field>
              <input type="hidden" name="threadId" value={draft.threadId ?? ""} />
              {error ? <p className="text-sm text-error">{error}</p> : null}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={closeQuickCreate}>
                  Cancel
                </Button>
                <Button type="submit" loading={pending}>
                  Schedule meeting
                </Button>
              </div>
            </form>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
