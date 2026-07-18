"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@repo/ui/input";
import { IconSearch } from "@repo/ui/icons";

export function CrmSearch({
  placeholder = "Search…",
  param = "q",
}: {
  placeholder?: string;
  param?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(param) ?? "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    setValue(searchParams.get(param) ?? "");
  }, [searchParams, param]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (value.trim()) next.set(param, value.trim());
      else next.delete(param);
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`);
      });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [value, param, pathname, router, searchParams]);

  return (
    <div className="relative w-full max-w-sm">
      <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
