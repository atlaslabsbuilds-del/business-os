export function IntegrationCardSkeleton() {
  return (
    <div className="bos-glass animate-pulse space-y-4 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-elevated" />
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-elevated" />
            <div className="h-3 w-16 rounded bg-elevated" />
          </div>
        </div>
        <div className="h-5 w-20 rounded-lg bg-elevated" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-elevated" />
        <div className="h-3 w-4/5 rounded bg-elevated" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-20 rounded-xl bg-elevated" />
        <div className="h-8 w-24 rounded-xl bg-elevated" />
      </div>
    </div>
  );
}

export function IntegrationsHubSkeleton() {
  return (
    <div className="space-y-5" aria-busy aria-label="Loading integrations">
      <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
        <div className="h-10 w-full max-w-xl animate-pulse rounded-2xl bg-elevated" />
        <div className="flex gap-2">
          <div className="h-9 w-28 animate-pulse rounded-xl bg-elevated" />
          <div className="h-9 w-24 animate-pulse rounded-xl bg-elevated" />
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="bos-glass h-72 animate-pulse rounded-2xl bg-elevated/40" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <IntegrationCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
