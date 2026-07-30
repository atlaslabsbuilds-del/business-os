import Link from "next/link";
import { VanderBaseLogo } from "../../components/branding/vanderbase-logo";

export const metadata = {
  title: "Offline · VanderBase",
  description: "You are offline. Cached VanderBase pages remain available.",
};

export default function OfflinePage() {
  return (
    <div className="bos-atmosphere flex min-h-screen items-center justify-center px-4">
      <div className="bos-glass-strong bos-gradient-border w-full max-w-md rounded-[24px] p-8 text-center">
        <div className="mx-auto mb-6 flex justify-center">
          <VanderBaseLogo size="md" />
        </div>
        <p className="text-xs uppercase tracking-[0.16em] text-primary">Offline</p>
        <h1 className="mt-2 text-2xl font-semibold">You&apos;re offline</h1>
        <p className="mt-3 text-sm text-secondary">
          VanderBase cached your shell for quick restart. Reconnect to sync
          notifications, CRM, and Kairos.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Try dashboard
        </Link>
      </div>
    </div>
  );
}
