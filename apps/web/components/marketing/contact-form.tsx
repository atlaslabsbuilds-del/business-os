"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { submitContactAction } from "../../app/actions/contact";

const fieldClass =
  "w-full rounded-2xl border border-border bg-elevated/50 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await submitContactAction({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        company: String(form.get("company") ?? "") || null,
        message: String(form.get("message") ?? ""),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setDone(true);
      event.currentTarget.reset();
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/10 px-6 py-10 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" aria-hidden />
        <h2 className="mt-4 text-xl font-semibold text-foreground">Message sent</h2>
        <p className="mt-2 text-sm text-secondary">
          Thanks for reaching out. Our team will get back to you shortly.
        </p>
        <Button className="mt-6" variant="secondary" onClick={() => setDone(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-surface/80 p-6 shadow-soft sm:p-8">
      {error ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : null}
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-secondary">Name</span>
        <input name="name" required autoComplete="name" className={fieldClass} placeholder="Alex Rivera" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-secondary">Email</span>
        <input name="email" type="email" required autoComplete="email" className={fieldClass} placeholder="you@company.com" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-secondary">
          Company <span className="text-muted">(optional)</span>
        </span>
        <input name="company" autoComplete="organization" className={fieldClass} placeholder="Northstar Studio" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-secondary">Message</span>
        <textarea
          name="message"
          required
          rows={5}
          minLength={10}
          className={fieldClass}
          placeholder="How can we help?"
        />
      </label>
      <Button type="submit" loading={pending} className="w-full sm:w-auto">
        Send message
      </Button>
    </form>
  );
}
