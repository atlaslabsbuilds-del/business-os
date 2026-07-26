import { SkeletonBlock } from "../../../components/dashboard/section-shell";

export default function ContentLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="space-y-3">
        <SkeletonBlock className="h-6 w-28" />
        <SkeletonBlock className="h-10 w-72" />
        <SkeletonBlock className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonBlock className="h-[520px]" />
        <SkeletonBlock className="h-[520px]" />
      </div>
    </div>
  );
}
