"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Copy, GitCompare, RotateCcw } from "lucide-react";
import type { AiOutputVersion } from "@repo/types";
import { Button } from "@repo/ui/button";
import {
  createAiVersionAction,
  duplicateAiVersionAction,
  renameAiVersionAction,
  restoreAiVersionAction,
} from "../../app/(protected)/actions/platform";
import { useAppChrome } from "../app/app-chrome-provider";

export function VersionHistoryPanel({
  initialVersions,
}: {
  initialVersions: AiOutputVersion[];
}) {
  const { pushToast } = useAppChrome();
  const [versions, setVersions] = useState(initialVersions);
  const [selectedId, setSelectedId] = useState(initialVersions[0]?.id ?? "");
  const [compareId, setCompareId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [pending, startTransition] = useTransition();

  const selected = versions.find((item) => item.id === selectedId) ?? null;
  const compare = versions.find((item) => item.id === compareId) ?? null;

  const sorted = useMemo(
    () =>
      [...versions].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [versions],
  );

  function createVersion() {
    if (!title.trim() || !content.trim()) return;
    startTransition(async () => {
      const result = await createAiVersionAction({
        entityType: "ai_output",
        title,
        content,
      });
      if (!result.ok) {
        pushToast({ title: "Could not save version", description: result.error, variant: "error" });
        return;
      }
      const next: AiOutputVersion = {
        id: result.data.id,
        workspaceId: "",
        entityType: "ai_output",
        entityId: null,
        title,
        content,
        versionNumber: (versions[0]?.versionNumber ?? 0) + 1,
        isCurrent: true,
        createdBy: null,
        parentVersionId: null,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setVersions((prev) => [next, ...prev.map((item) => ({ ...item, isCurrent: false }))]);
      setSelectedId(next.id);
      setTitle("");
      setContent("");
      pushToast({ title: "Version saved", variant: "success" });
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-3">
        <div className="bos-glass space-y-2 rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Save AI output
          </p>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Version title"
            className="h-10 w-full rounded-xl border border-border/70 bg-elevated/50 px-3 text-sm outline-none"
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Paste generated content…"
            rows={5}
            className="w-full rounded-xl border border-border/70 bg-elevated/50 px-3 py-2 text-sm outline-none"
          />
          <Button onClick={createVersion} loading={pending} disabled={!title.trim() || !content.trim()}>
            Save version
          </Button>
        </div>
        <ul className="bos-glass max-h-[520px] space-y-1 overflow-auto rounded-2xl p-2">
          {sorted.length === 0 ? (
            <li className="p-3 text-sm text-secondary">No versions yet.</li>
          ) : (
            sorted.map((version) => (
              <li key={version.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(version.id);
                    setRenameValue(version.title);
                  }}
                  className={`w-full rounded-xl px-3 py-2.5 text-left transition ${
                    selectedId === version.id
                      ? "bg-primary/15"
                      : "hover:bg-elevated/60"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{version.title}</span>
                    {version.isCurrent ? (
                      <span className="text-[10px] uppercase text-primary">Current</span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted">
                    v{version.versionNumber} · {new Date(version.createdAt).toLocaleString()}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>

      <section className="bos-glass rounded-2xl p-5">
        {!selected ? (
          <p className="text-sm text-secondary">Select a version to restore, compare, or rename.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                className="h-10 min-w-[220px] flex-1 rounded-xl border border-border/70 bg-elevated/50 px-3 text-sm outline-none"
              />
              <Button
                size="sm"
                variant="secondary"
                loading={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await renameAiVersionAction({
                      versionId: selected.id,
                      title: renameValue,
                    });
                    if (!result.ok) {
                      pushToast({ title: "Rename failed", description: result.error, variant: "error" });
                      return;
                    }
                    setVersions((prev) =>
                      prev.map((item) =>
                        item.id === selected.id ? { ...item, title: renameValue } : item,
                      ),
                    );
                    pushToast({ title: "Renamed", variant: "success" });
                  })
                }
              >
                Rename
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  startTransition(async () => {
                    const result = await restoreAiVersionAction({ versionId: selected.id });
                    if (!result.ok) {
                      pushToast({ title: "Restore failed", description: result.error, variant: "error" });
                      return;
                    }
                    pushToast({ title: "Version restored", variant: "success" });
                    window.location.reload();
                  })
                }
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Restore
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  startTransition(async () => {
                    const result = await duplicateAiVersionAction({ versionId: selected.id });
                    if (!result.ok) {
                      pushToast({ title: "Duplicate failed", description: result.error, variant: "error" });
                      return;
                    }
                    pushToast({ title: "Duplicated", variant: "success" });
                    window.location.reload();
                  })
                }
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Duplicate
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setCompareId((current) => (current === selected.id ? null : selected.id))
                }
              >
                <GitCompare className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Compare
              </Button>
            </div>
            <p className="text-xs text-muted">
              Author {selected.createdBy?.slice(0, 8) ?? "Kairos"} ·{" "}
              {new Date(selected.createdAt).toLocaleString()}
            </p>
            <motion.pre
              key={selected.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="whitespace-pre-wrap rounded-xl bg-elevated/50 p-4 text-sm leading-6 text-foreground"
            >
              {selected.content}
            </motion.pre>
            {compare && compare.id !== selected.id ? (
              <div className="rounded-xl border border-border/60 p-4">
                <p className="mb-2 text-xs uppercase tracking-[0.14em] text-muted">
                  Compare with {compare.title}
                </p>
                <pre className="whitespace-pre-wrap text-sm text-secondary">{compare.content}</pre>
              </div>
            ) : compare ? (
              <div className="text-xs text-muted">
                Select another version from the list to compare against this one.
              </div>
            ) : null}
            {compareId === selected.id ? (
              <ul className="flex flex-wrap gap-2">
                {sorted
                  .filter((item) => item.id !== selected.id)
                  .slice(0, 6)
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCompareId(item.id)}
                      className="rounded-full border border-border/70 px-3 py-1 text-xs text-secondary hover:text-foreground"
                    >
                      vs {item.title}
                    </button>
                  ))}
              </ul>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
