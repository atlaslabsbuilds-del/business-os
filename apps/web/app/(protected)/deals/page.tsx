import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Kairos alias: “Open Deals” → CRM deals. */
export default function DealsPage() {
  redirect("/crm/deals");
}
