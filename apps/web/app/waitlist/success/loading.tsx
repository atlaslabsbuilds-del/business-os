import { FormSkeleton, SkeletonBlock } from "../../../components/dashboard/section-shell";

export default function WaitlistSuccessLoading() {
  return (
    <div className="landing-root min-h-screen px-5 py-10 sm:px-8" aria-busy aria-label="Loading waitlist">
      <div className="mx-auto max-w-3xl space-y-4">
        <SkeletonBlock className="h-6 w-32" />
        <SkeletonBlock className="h-[420px] w-full rounded-[32px]" />
        <FormSkeleton />
      </div>
    </div>
  );
}
