import { redirect } from "next/navigation";
import { contactDisplayName, listContacts } from "@repo/database/crm";
import { Badge } from "@repo/ui/badge";
import { Card } from "@repo/ui/card";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { ensureCrmAiToolsRegistered } from "../../../../lib/crm-ai";
import { CrmShell } from "../../../../components/crm/crm-shell";
import { CrmSearch } from "../../../../components/crm/crm-search";
import { EmptyState } from "../../../../components/dashboard/section-shell";
import {
  CreateContactForm,
  DeleteButton,
} from "../../../../components/crm/crm-forms";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; stage?: string }> };

export default async function CrmContactsPage({ searchParams }: Props) {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  ensureCrmAiToolsRegistered();

  const params = await searchParams;
  const stage =
    params.stage === "lead" ||
    params.stage === "qualified" ||
    params.stage === "customer" ||
    params.stage === "churned" ||
    params.stage === "other"
      ? params.stage
      : undefined;

  const contacts = await listContacts({
    workspaceId: context.active.workspace.id,
    query: params.q,
    stage,
  });

  return (
    <CrmShell
      title="Contacts"
      description="People across your pipeline. Filter by stage or search by name/email."
      actions={<CrmSearch placeholder="Search contacts" />}
    >
      <CreateContactForm />

      <div className="flex flex-wrap gap-2">
        {["", "lead", "qualified", "customer", "churned"].map((value) => {
          const href = value
            ? `/crm/contacts?stage=${value}${params.q ? `&q=${params.q}` : ""}`
            : `/crm/contacts${params.q ? `?q=${params.q}` : ""}`;
          const active = (stage ?? "") === value;
          return (
            <a
              key={value || "all"}
              href={href}
              className={`rounded-xl px-3 py-1.5 text-xs transition ${
                active
                  ? "bg-accent-muted text-foreground"
                  : "bg-elevated text-secondary hover:text-foreground"
              }`}
            >
              {value || "All"}
            </a>
          );
        })}
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-elevated/50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4">
                  <EmptyState
                    preset="customers"
                    title="No customers yet"
                    body="Use the form above to add your first contact and start building pipeline."
                  />
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id} className="border-b border-border/70">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {contactDisplayName(contact)}
                  </td>
                  <td className="px-4 py-3 text-secondary">{contact.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="default">{contact.lifecycleStage}</Badge>
                  </td>
                  <td className="px-4 py-3 text-secondary">{contact.source ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton id={contact.id} kind="contact" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </CrmShell>
  );
}
