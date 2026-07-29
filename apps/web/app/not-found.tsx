import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { ErrorShell } from "../components/marketing/error-shell";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <ErrorShell
      code="404"
      title="This page doesn’t exist"
      body="The link may be broken, or the page may have moved. Head home or sign in to your workspace."
      icon={<SearchX className="h-6 w-6" aria-hidden />}
      secondaryHref="/signin"
      secondaryLabel="Sign in"
    />
  );
}
