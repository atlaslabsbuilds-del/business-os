import { redirect } from "next/navigation";
import { MarketingAdvoraPage } from "../../../components/marketing/marketing-advora-page";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");

  return <MarketingAdvoraPage />;
}
