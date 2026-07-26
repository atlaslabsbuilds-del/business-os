import { SkeletonBlock } from "../../../components/dashboard/section-shell";

export default function CalendarLoading() {
  return <div className="space-y-6"><SkeletonBlock className="h-28" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <SkeletonBlock key={index} className="h-28" />)}</div><SkeletonBlock className="h-[420px]" /></div>;
}
