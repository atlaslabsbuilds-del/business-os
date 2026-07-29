import { CardGridSkeleton, TableSkeleton } from "../../../components/dashboard/section-shell";

export default function InboxLoading() {
  return (
    <div className="space-y-4 p-1" aria-busy aria-label="Loading inbox">
      <CardGridSkeleton count={3} />
      <TableSkeleton rows={8} />
    </div>
  );
}
