import type { Metadata } from "next";
import { ErrorShell, OfflineIcon } from "../../components/marketing/error-shell";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <ErrorShell
      code="Offline"
      title="You’re offline"
      body="VanderBase needs a connection to load your workspace. Check your network and try again."
      icon={<OfflineIcon />}
      primaryHref="/"
      primaryLabel="Retry home"
    />
  );
}
