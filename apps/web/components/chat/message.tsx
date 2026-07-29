"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/utils";
import type { ChatMessage } from "@repo/types";
import type { KairosState } from "../../lib/kairos";
import { KairosAvatar } from "../kairos/kairos-avatar";

type MessageProps = {
  message: ChatMessage;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
  kairosState?: KairosState;
};

function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = React.useState(false);
  const code = String(children).replace(/\n$/, "");

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const language = className?.replace("language-", "") ?? "code";

  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-border bg-[#0d0f14]">
      <div className="flex items-center justify-between border-b border-border/80 px-3 py-2 text-[11px] uppercase tracking-wide text-muted">
        <span>{language}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs opacity-0 transition group-hover:opacity-100"
          onClick={copy}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-foreground/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function Message({
  message,
  isStreaming,
  onRegenerate,
  canRegenerate,
  kairosState = "idle",
}: MessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = React.useState(false);

  async function copyMessage() {
    if (!message.content.trim()) return;
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className={cn(
        "group flex w-full gap-4 px-4 py-5 sm:px-6",
        isUser ? "bg-transparent" : "bg-surface/30",
      )}
    >
      <div className="shrink-0">
        {isUser ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-elevated text-xs font-semibold text-secondary">
            You
          </div>
        ) : (
          <KairosAvatar
            size="xs"
            state={isStreaming ? "speaking" : kairosState}
            aria-label="Kairos"
          />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="prose prose-invert max-w-none text-sm leading-relaxed text-foreground/95 prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-accent prose-code:rounded prose-code:bg-elevated prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[13px] prose-pre:p-0 prose-pre:bg-transparent">
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const inline = !className;
                  if (inline) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                  return <CodeBlock className={className}>{children}</CodeBlock>;
                },
              }}
            >
              {message.content || (isStreaming ? " " : "")}
            </ReactMarkdown>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          {!isUser && message.content.trim() ? (
            <Button type="button" variant="ghost" size="sm" onClick={copyMessage}>
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  Copy
                </>
              )}
            </Button>
          ) : null}
          {!isUser && canRegenerate && onRegenerate ? (
            <Button type="button" variant="ghost" size="sm" onClick={onRegenerate}>
              Regenerate
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
