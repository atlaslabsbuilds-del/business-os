"use client";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      <span className="h-2 w-2 animate-pulse rounded-full bg-accent/70 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-accent/70 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-accent/70 [animation-delay:300ms]" />
    </div>
  );
}
