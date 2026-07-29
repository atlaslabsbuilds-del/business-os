import { SkeletonBlock } from "../../../components/dashboard/section-shell";

export default function ChatLoading() {
  return (
    <div className="grid gap-4 p-1 lg:grid-cols-[240px_1fr]" aria-busy aria-label="Loading chat">
      <SkeletonBlock className="hidden h-[70vh] lg:block" />
      <SkeletonBlock className="h-[70vh] w-full" />
    </div>
  );
}
