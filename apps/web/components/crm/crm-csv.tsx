"use client";

import { Button } from "@repo/ui/button";

export function CrmCsvExportButton({
  filename,
  rows,
}: {
  filename: string;
  rows: Array<Record<string, string | number | null | undefined>>;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => {
        if (rows.length === 0) return;
        const headers = Object.keys(rows[0]!);
        const escape = (value: string | number | null | undefined) => {
          const raw = String(value ?? "");
          if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
          return raw;
        };
        const csv = [
          headers.join(","),
          ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
      }}
    >
      Export CSV
    </Button>
  );
}
