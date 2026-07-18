import { redirect } from "next/navigation";
import { listNotes } from "@repo/database/crm";
import { Card } from "@repo/ui/card";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { ensureCrmAiToolsRegistered } from "../../../../lib/crm-ai";
import { CrmShell } from "../../../../components/crm/crm-shell";
import {
  CreateNoteForm,
  DeleteButton,
} from "../../../../components/crm/crm-forms";

export const dynamic = "force-dynamic";

export default async function CrmNotesPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  ensureCrmAiToolsRegistered();

  const notes = await listNotes({
    workspaceId: context.active.workspace.id,
  });

  return (
    <CrmShell
      title="Notes"
      description="Attach context to contacts, companies, and deals."
    >
      <CreateNoteForm />
      <div className="grid gap-3">
        {notes.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">No notes yet</p>
          </Card>
        ) : (
          notes.map((note) => (
            <Card key={note.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {note.body}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(note.createdAt).toLocaleString()}
                    {note.contactId ? ` · contact ${note.contactId.slice(0, 8)}…` : ""}
                  </p>
                </div>
                <DeleteButton id={note.id} kind="note" />
              </div>
            </Card>
          ))
        )}
      </div>
    </CrmShell>
  );
}
