import { SkeletonBlock } from "./section-shell";

export function DashboardSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-7xl flex-col gap-6"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <SkeletonBlock className="h-6 w-28" />
          <SkeletonBlock className="h-10 w-64" />
          <SkeletonBlock className="h-4 w-full max-w-xl" />
        </div>
        <SkeletonBlock className="h-20 w-full sm:w-80" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-36" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <SkeletonBlock className="h-80" />
        <SkeletonBlock className="h-80" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonBlock className="h-72" />
        <SkeletonBlock className="h-72" />
        <SkeletonBlock className="h-72" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonBlock className="h-72" />
        <SkeletonBlock className="h-72" />
      </div>
    </div>
  );
}
