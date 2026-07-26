"use client";

import { cn } from "@repo/ui/utils";

export function TabNav({
  items,
  active,
  onChange,
  label,
}: {
  items: Array<{ id: string; label: string }>;
  active: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <nav className="bos-glass flex gap-1 overflow-x-auto rounded-2xl p-1.5" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "whitespace-nowrap rounded-xl px-3 py-2 text-sm transition duration-200",
            active === item.id
              ? "bg-primary text-white shadow-[0_8px_24px_rgba(249,115,22,0.25)]"
              : "text-secondary hover:bg-elevated/70 hover:text-foreground",
          )}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
