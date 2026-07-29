import { CardGridSkeleton, ChartSkeleton, TableSkeleton } from "../../../components/dashboard/section-shell";

export default function CrmLoading() {
  return (
    <div className="space-y-6 p-1" aria-busy aria-label="Loading CRM">
      <CardGridSkeleton count={4} />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <TableSkeleton rows={6} />
        <ChartSkeleton />
      </div>
    </div>
  );
}
