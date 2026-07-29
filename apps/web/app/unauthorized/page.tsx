import type { Metadata } from "next";
import { ErrorShell, UnauthorizedIcon } from "../../components/marketing/error-shell";

export const metadata: Metadata = {
  title: "Unauthorized",
  robots: { index: false, follow: false },
};

export default function UnauthorizedPage() {
  return (
    <ErrorShell
      code="401"
      title="You don’t have access"
      body="This area of VanderBase requires a signed-in account with the right permissions."
      icon={<UnauthorizedIcon />}
      primaryHref="/signin"
      primaryLabel="Sign in"
      secondaryHref="/"
      secondaryLabel="Return home"
    />
  );
}
