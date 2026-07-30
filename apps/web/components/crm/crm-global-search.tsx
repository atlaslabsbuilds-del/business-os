"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@repo/ui/input";
import { IconSearch } from "@repo/ui/icons";
import { searchCrmGlobalAction } from "../../app/(protected)/actions/crm";

type SearchResult = {
  contacts: Array<{ id: string; firstName: string; lastName: string; email: string | null }>;
  companies: Array<{ id: string; name: string; domain: string | null }>;
  deals: Array<{ id: string; title: string; amount: number; stage: string }>;
};

export function CrmGlobalSearch() {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [results, setResults] = useState<SearchResult | null>(null);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setResults(null);
      return;
    }
    const handle = window.setTimeout(() => {
      startTransition(async () => {
        const response = await searchCrmGlobalAction({ query });
        if (response.ok) setResults(response.data);
      });
    }, 220);
    return () => window.clearTimeout(handle);
  }, [value]);

  const hasResults =
    !!results &&
    (results.contacts.length > 0 ||
      results.companies.length > 0 ||
      results.deals.length > 0);

  return (
    <div className="relative w-full max-w-md">
      <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <Input
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder="Search CRM instantly"
        className="pl-9"
      />
      {open && value.trim().length >= 2 ? (
        <div className="bos-glass-strong absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border p-2 shadow-elevated">
          {pending && !results ? (
            <p className="px-3 py-4 text-sm text-secondary">Searching…</p>
          ) : !hasResults ? (
            <p className="px-3 py-4 text-sm text-secondary">No matches</p>
          ) : (
            <div className="max-h-80 space-y-3 overflow-y-auto p-1">
              {results!.contacts.length > 0 ? (
                <ResultGroup title="Contacts">
                  {results!.contacts.map((contact) => (
                    <Link
                      key={contact.id}
                      href="/crm/contacts"
                      className="block rounded-xl px-3 py-2 text-sm hover:bg-elevated"
                    >
                      {[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                      {contact.email ? (
                        <span className="ml-2 text-xs text-muted">{contact.email}</span>
                      ) : null}
                    </Link>
                  ))}
                </ResultGroup>
              ) : null}
              {results!.companies.length > 0 ? (
                <ResultGroup title="Companies">
                  {results!.companies.map((company) => (
                    <Link
                      key={company.id}
                      href="/crm/companies"
                      className="block rounded-xl px-3 py-2 text-sm hover:bg-elevated"
                    >
                      {company.name}
                      {company.domain ? (
                        <span className="ml-2 text-xs text-muted">{company.domain}</span>
                      ) : null}
                    </Link>
                  ))}
                </ResultGroup>
              ) : null}
              {results!.deals.length > 0 ? (
                <ResultGroup title="Deals">
                  {results!.deals.map((deal) => (
                    <Link
                      key={deal.id}
                      href="/crm/deals"
                      className="block rounded-xl px-3 py-2 text-sm hover:bg-elevated"
                    >
                      {deal.title}
                      <span className="ml-2 text-xs text-muted">
                        ${deal.amount.toLocaleString()} · {deal.stage}
                      </span>
                    </Link>
                  ))}
                </ResultGroup>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ResultGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="px-3 pb-1 text-[11px] uppercase tracking-wide text-muted">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
