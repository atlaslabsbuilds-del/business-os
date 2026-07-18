"use client";

import * as React from "react";
import { Button } from "@repo/ui/button";
import { IconSparkles } from "@repo/ui/icons";
import { cn } from "@repo/ui/utils";
import { ModelSelector } from "./model-selector";
import type { ChatModelOption } from "@repo/ai";

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  models: ChatModelOption[];
  model: string;
  provider: ChatModelOption["provider"];
  onModelChange: (model: string, provider: ChatModelOption["provider"]) => void;
};

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  disabled,
  models,
  model,
  provider,
  onModelChange,
}: ComposerProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && !isStreaming && value.trim()) {
        onSubmit();
      }
    }
  }

  return (
    <div className="border-t border-border bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-border bg-surface/80 shadow-soft">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Business OS AI…"
            rows={1}
            disabled={disabled}
            className={cn(
              "max-h-[200px] min-h-[52px] w-full resize-none bg-transparent px-4 py-3.5 text-sm text-foreground outline-none placeholder:text-muted",
              disabled && "opacity-60",
            )}
          />
          <div className="flex items-center justify-between gap-3 border-t border-border/80 px-3 py-2">
            <ModelSelector
              models={models}
              model={model}
              provider={provider}
              onChange={onModelChange}
              disabled={isStreaming}
            />
            <div className="flex items-center gap-2">
              {isStreaming ? (
                <Button type="button" variant="secondary" size="sm" onClick={onStop}>
                  Stop
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={disabled || !value.trim()}
                  onClick={onSubmit}
                  className="gap-1.5"
                >
                  <IconSparkles className="h-3.5 w-3.5" />
                  Send
                </Button>
              )}
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
