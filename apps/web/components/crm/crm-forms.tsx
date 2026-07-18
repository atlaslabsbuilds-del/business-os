"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  createCrmActivityAction,
  createCrmCompanyAction,
  createCrmContactAction,
  createCrmDealAction,
  createCrmLeadAction,
  createCrmNoteAction,
  createCrmTagAction,
  deleteCrmActivityAction,
  deleteCrmCompanyAction,
  deleteCrmContactAction,
  deleteCrmDealAction,
  deleteCrmNoteAction,
  deleteCrmTagAction,
  updateCrmDealAction,
} from "../../app/(protected)/actions/crm";

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

export function CreateContactForm({ asLead = false }: { asLead?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3 rounded-2xl border border-border bg-surface/60 p-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const payload = {
          firstName: String(form.get("firstName") ?? ""),
          lastName: String(form.get("lastName") ?? ""),
          email: String(form.get("email") ?? "") || null,
          phone: String(form.get("phone") ?? "") || null,
          title: String(form.get("title") ?? "") || null,
          source: String(form.get("source") ?? "") || null,
        };
        startTransition(async () => {
          setError(null);
          const result = asLead
            ? await createCrmLeadAction(payload)
            : await createCrmContactAction(payload);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          event.currentTarget.reset();
          router.refresh();
        });
      }}
    >
      <Field label="First name">
        <Input name="firstName" required placeholder="Ada" />
      </Field>
      <Field label="Last name">
        <Input name="lastName" placeholder="Lovelace" />
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
        <Input name="source" placeholder="Website" />
      </Field>
      {error ? <p className="text-sm text-error sm:col-span-2">{error}</p> : null}
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending}>
          {asLead ? "Create lead" : "Create contact"}
        </Button>
      </div>
    </form>
  );
}

export function CreateCompanyForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3 rounded-2xl border border-border bg-surface/60 p-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          setError(null);
          const result = await createCrmCompanyAction({
            name: String(form.get("name") ?? ""),
            domain: String(form.get("domain") ?? "") || null,
            industry: String(form.get("industry") ?? "") || null,
            website: String(form.get("website") ?? "") || null,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          event.currentTarget.reset();
          router.refresh();
        });
      }}
    >
      <Field label="Company name">
        <Input name="name" required placeholder="Acme Inc" />
      </Field>
      <Field label="Domain">
        <Input name="domain" placeholder="acme.com" />
      </Field>
      <Field label="Industry">
        <Input name="industry" placeholder="SaaS" />
      </Field>
      <Field label="Website">
        <Input name="website" placeholder="https://acme.com" />
      </Field>
      {error ? <p className="text-sm text-error sm:col-span-2">{error}</p> : null}
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending}>
          Create company
        </Button>
      </div>
    </form>
  );
}

export function CreateDealForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3 rounded-2xl border border-border bg-surface/60 p-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          setError(null);
          const result = await createCrmDealAction({
            title: String(form.get("title") ?? ""),
            amount: Number(form.get("amount") ?? 0),
            stage: String(form.get("stage") ?? "qualified"),
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          event.currentTarget.reset();
          router.refresh();
        });
      }}
    >
      <Field label="Deal title">
        <Input name="title" required placeholder="Enterprise plan" />
      </Field>
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
      {error ? <p className="text-sm text-error sm:col-span-2">{error}</p> : null}
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending}>
          Create deal
        </Button>
      </div>
    </form>
  );
}

export function CreateActivityForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3 rounded-2xl border border-border bg-surface/60 p-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          setError(null);
          const result = await createCrmActivityAction({
            subject: String(form.get("subject") ?? ""),
            type: String(form.get("type") ?? "task"),
            body: String(form.get("body") ?? "") || null,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          event.currentTarget.reset();
          router.refresh();
        });
      }}
    >
      <Field label="Subject">
        <Input name="subject" required placeholder="Follow up call" />
      </Field>
      <Field label="Type">
        <select
          name="type"
          className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm text-foreground"
          defaultValue="task"
        >
          <option value="call">Call</option>
          <option value="email">Email</option>
          <option value="meeting">Meeting</option>
          <option value="task">Task</option>
          <option value="note">Note</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Details">
          <Input name="body" placeholder="Optional notes" />
        </Field>
      </div>
      {error ? <p className="text-sm text-error sm:col-span-2">{error}</p> : null}
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending}>
          Create activity
        </Button>
      </div>
    </form>
  );
}

export function CreateNoteForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3 rounded-2xl border border-border bg-surface/60 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const contactId = String(form.get("contactId") ?? "").trim();
        startTransition(async () => {
          setError(null);
          if (!contactId) {
            setError("Contact ID is required for standalone notes");
            return;
          }
          const result = await createCrmNoteAction({
            body: String(form.get("body") ?? ""),
            contactId,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          event.currentTarget.reset();
          router.refresh();
        });
      }}
    >
      <Field label="Contact ID">
        <Input name="contactId" required placeholder="UUID of contact" />
      </Field>
      <Field label="Note">
        <Input name="body" required placeholder="Meeting summary…" />
      </Field>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <Button type="submit" loading={pending}>
        Add note
      </Button>
    </form>
  );
}

export function CreateTagForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface/60 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          setError(null);
          const result = await createCrmTagAction({
            name: String(form.get("name") ?? ""),
            color: String(form.get("color") ?? "#4f46e5"),
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          event.currentTarget.reset();
          router.refresh();
        });
      }}
    >
      <div className="min-w-[180px] flex-1">
        <Field label="Tag name">
          <Input name="name" required placeholder="vip" />
        </Field>
      </div>
      <div className="w-28">
        <Field label="Color">
          <Input name="color" type="color" defaultValue="#4f46e5" />
        </Field>
      </div>
      <Button type="submit" loading={pending}>
        Create tag
      </Button>
      {error ? <p className="w-full text-sm text-error">{error}</p> : null}
    </form>
  );
}

export function DeleteButton({
  id,
  kind,
}: {
  id: string;
  kind: "contact" | "company" | "deal" | "activity" | "note" | "tag";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      loading={pending}
      onClick={() => {
        startTransition(async () => {
          const actions = {
            contact: deleteCrmContactAction,
            company: deleteCrmCompanyAction,
            deal: deleteCrmDealAction,
            activity: deleteCrmActivityAction,
            note: deleteCrmNoteAction,
            tag: deleteCrmTagAction,
          };
          await actions[kind]({ id });
          router.refresh();
        });
      }}
    >
      Delete
    </Button>
  );
}

export function DealStageSelect({
  id,
  stage,
}: {
  id: string;
  stage: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      className="h-8 rounded-lg border border-border bg-elevated px-2 text-xs text-foreground"
      defaultValue={stage}
      disabled={pending}
      onChange={(event) => {
        startTransition(async () => {
          await updateCrmDealAction({ id, stage: event.target.value });
          router.refresh();
        });
      }}
    >
      <option value="qualified">Qualified</option>
      <option value="proposal">Proposal</option>
      <option value="negotiation">Negotiation</option>
      <option value="won">Won</option>
      <option value="lost">Lost</option>
    </select>
  );
}
