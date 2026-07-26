"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/utils";
import type { ChatMessage } from "@repo/types";

type MessageProps = {
  message: ChatMessage;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
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
}: MessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "group flex w-full gap-4 px-4 py-5 sm:px-6",
        isUser ? "bg-transparent" : "bg-surface/30",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold",
          isUser
            ? "bg-elevated text-secondary"
            : "bg-primary-muted text-primary",
        )}
      >
        {isUser ? "You" : "AI"}
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
        {!isUser && canRegenerate && onRegenerate ? (
          <div className="opacity-0 transition group-hover:opacity-100">
            <Button type="button" variant="ghost" size="sm" onClick={onRegenerate}>
              Regenerate
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
