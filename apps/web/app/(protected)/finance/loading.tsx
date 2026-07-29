import { CardGridSkeleton, ChartSkeleton, SkeletonBlock } from "../../../components/dashboard/section-shell";

export default function FinanceLoading() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading finance">
      <CardGridSkeleton count={6} />
      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <ChartSkeleton className="h-72" />
        <SkeletonBlock className="h-72 w-full" />
      </div>
      <SkeletonBlock className="h-40 w-full" />
    </div>
  );
}
