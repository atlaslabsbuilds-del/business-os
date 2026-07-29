export default function NotificationsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="bos-gradient-border bos-glass-strong h-36 animate-pulse rounded-[24px]" />
      <div className="h-16 animate-pulse rounded-2xl border border-border bg-surface" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-border bg-surface"
          />
        ))}
      </div>
    </div>
  );
}
