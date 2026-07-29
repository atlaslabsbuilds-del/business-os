import type { Metadata } from "next";
import { ErrorShell, UnauthorizedIcon } from "../../components/marketing/error-shell";

export const metadata: Metadata = {
  title: "Session expired",
  robots: { index: false, follow: false },
};

export default function SessionExpiredPage() {
  return (
    <ErrorShell
      code="Session"
      title="Your session expired"
      body="For security, VanderBase signed you out after inactivity. Sign in again to continue."
      icon={<UnauthorizedIcon />}
      primaryHref="/signin?error=session_expired"
      primaryLabel="Sign in again"
      secondaryHref="/"
      secondaryLabel="Return home"
    />
  );
}
