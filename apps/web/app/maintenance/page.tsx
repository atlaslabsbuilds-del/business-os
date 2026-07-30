import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { ErrorShell } from "../../components/marketing/error-shell";

export const metadata: Metadata = {
  title: "Maintenance",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <ErrorShell
      code="503"
      title="VanderBase is under maintenance"
      body="We are applying improvements for public beta users. Please check back shortly."
      icon={<Wrench className="h-6 w-6" aria-hidden />}
      primaryHref="/"
      primaryLabel="Return home"
      secondaryHref="/support"
      secondaryLabel="Contact support"
    />
  );
}
