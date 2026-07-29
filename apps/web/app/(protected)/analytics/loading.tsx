import { CardGridSkeleton, ChartSkeleton } from "../../../components/dashboard/section-shell";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 p-1" aria-busy aria-label="Loading analytics">
      <CardGridSkeleton count={4} />
      <ChartSkeleton className="h-72" />
      <div className="grid gap-4 md:grid-cols-2">
        <ChartSkeleton className="h-56" />
        <ChartSkeleton className="h-56" />
      </div>
    </div>
  );
}
