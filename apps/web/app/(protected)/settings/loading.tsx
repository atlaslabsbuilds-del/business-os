import { FormSkeleton, SkeletonBlock } from "../../../components/dashboard/section-shell";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-1" aria-busy aria-label="Loading settings">
      <SkeletonBlock className="h-8 w-48" />
      <FormSkeleton />
      <FormSkeleton />
    </div>
  );
}
