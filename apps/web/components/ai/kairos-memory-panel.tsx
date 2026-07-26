"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Brain, Pencil, Plus, Trash2 } from "lucide-react";
import type { WorkspaceAiMemory, WorkspaceAiSettings } from "@repo/types";
import { Button } from "@repo/ui/button";
import {
  deleteKairosMemoryAction,
  rememberWorkspaceFactAction,
  setKairosMemoryEnabledAction,
  updateKairosMemoryAction,
} from "../../app/(protected)/actions/platform";
import { useAppChrome } from "../app/app-chrome-provider";

export function KairosMemoryPanel({
  initialMemory,
  initialSettings,
}: {
  initialMemory: WorkspaceAiMemory[];
  initialSettings: WorkspaceAiSettings;
}) {
  const { pushToast } = useAppChrome();
  const [memory, setMemory] = useState(initialMemory);
  const [enabled, setEnabled] = useState(initialSettings.memoryEnabled);
  const [fact, setFact] = useState("");
  const [scope, setScope] = useState("workspace");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFact, setEditFact] = useState("");
  const [pending, startTransition] = useTransition();

  const scopes = useMemo(
    () =>
      Array.from(new Set(memory.map((item) => item.scope))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [memory],
  );

  function toggleMemory() {
    startTransition(async () => {
      const next = !enabled;
      const result = await setKairosMemoryEnabledAction({ enabled: next });
      if (!result.ok) {
        pushToast({ title: "Memory setting failed", description: result.error, variant: "error" });
        return;
      }
      setEnabled(result.data.enabled);
      pushToast({
        title: result.data.enabled ? "Memory enabled" : "Memory paused",
        description: result.data.enabled
          ? "Kairos will keep learning your workspace."
          : "Kairos will stop saving new memory.",
        variant: "success",
      });
    });
  }

  function addMemory() {
    if (!fact.trim()) return;
    startTransition(async () => {
      const result = await rememberWorkspaceFactAction({
        fact,
        scope,
        sourceModule: "assistant",
        importance: 3,
      });
      if (!result.ok) {
        pushToast({ title: "Could not save", description: result.error, variant: "error" });
        return;
      }
      setMemory((prev) => [
        {
          id: result.data.id,
          workspaceId: initialSettings.workspaceId,
          sourceModule: "assistant",
          scope,
          fact,
          summary: null,
          importance: 3,
          createdBy: null,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setFact("");
      pushToast({ title: "Memory saved", variant: "success" });
    });
  }

  function saveEdit(id: string) {
    startTransition(async () => {
      const result = await updateKairosMemoryAction({
        memoryId: id,
        fact: editFact,
      });
      if (!result.ok) {
        pushToast({ title: "Update failed", description: result.error, variant: "error" });
        return;
      }
      setMemory((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, fact: editFact, updatedAt: new Date().toISOString() } : item,
        ),
      );
      setEditingId(null);
      pushToast({ title: "Memory updated", variant: "success" });
    });
  }

  function removeMemory(id: string) {
    startTransition(async () => {
      const result = await deleteKairosMemoryAction({ memoryId: id });
      if (!result.ok) {
        pushToast({ title: "Delete failed", description: result.error, variant: "error" });
        return;
      }
      setMemory((prev) => prev.filter((item) => item.id !== id));
      pushToast({ title: "Memory deleted", variant: "success" });
    });
  }

  return (
    <div className="space-y-5">
      <div className="bos-glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Brain className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold">Kairos Memory</p>
            <p className="text-xs text-secondary">
              Workspace context, brand voice, preferences, and workflows.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleMemory}
          disabled={pending}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
            enabled
              ? "bg-primary text-white"
              : "border border-border/70 bg-elevated/60 text-secondary"
          }`}
          aria-pressed={enabled}
        >
          Memory {enabled ? "On" : "Off"}
        </button>
      </div>

      <div className="bos-glass space-y-3 rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Add memory
        </p>
        <div className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
          <input
            value={fact}
            onChange={(event) => setFact(event.target.value)}
            placeholder="e.g. Brand voice is confident, concise, and warm."
            className="h-11 rounded-xl border border-border/70 bg-elevated/50 px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            disabled={!enabled || pending}
          />
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            className="h-11 rounded-xl border border-border/70 bg-elevated/50 px-3 text-sm outline-none"
            disabled={!enabled || pending}
          >
            <option value="workspace">Workspace</option>
            <option value="brand_voice">Brand voice</option>
            <option value="writing_style">Writing style</option>
            <option value="goals">Business goals</option>
            <option value="preferences">Team preferences</option>
            <option value="prompts">Favorite prompts</option>
            <option value="workflows">Favorite workflows</option>
            {scopes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Button onClick={addMemory} loading={pending} disabled={!enabled || !fact.trim()}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            Save
          </Button>
        </div>
      </div>

      <ul className="space-y-2">
        {memory.length === 0 ? (
          <li className="bos-glass rounded-2xl p-6 text-sm text-secondary">
            No memory yet. Add brand voice, goals, or preferred workflows.
          </li>
        ) : (
          memory.map((item, index) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bos-glass rounded-2xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted">
                    <span>{item.scope}</span>
                    <span>·</span>
                    <span>{item.sourceModule}</span>
                    <span>·</span>
                    <span>Priority {item.importance}</span>
                  </div>
                  {editingId === item.id ? (
                    <textarea
                      value={editFact}
                      onChange={(event) => setEditFact(event.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-border/70 bg-elevated/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <p className="text-sm leading-6 text-foreground">{item.fact}</p>
                  )}
                  {item.summary ? (
                    <p className="text-xs text-secondary">{item.summary}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  {editingId === item.id ? (
                    <Button size="sm" onClick={() => saveEdit(item.id)} loading={pending}>
                      Save
                    </Button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-lg p-2 text-muted hover:bg-elevated hover:text-foreground"
                      aria-label="Edit memory"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditFact(item.fact);
                      }}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded-lg p-2 text-muted hover:bg-elevated hover:text-error"
                    aria-label="Delete memory"
                    onClick={() => removeMemory(item.id)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </motion.li>
          ))
        )}
      </ul>
    </div>
  );
}
