import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Natural-language alias: “Open Customers” → CRM contacts. */
export default function CustomersPage() {
  redirect("/crm/contacts");
}
