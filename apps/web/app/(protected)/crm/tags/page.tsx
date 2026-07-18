import { redirect } from "next/navigation";
import { listTags } from "@repo/database/crm";
import { Card } from "@repo/ui/card";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { ensureCrmAiToolsRegistered } from "../../../../lib/crm-ai";
import { CrmShell } from "../../../../components/crm/crm-shell";
import { CrmSearch } from "../../../../components/crm/crm-search";
import {
  CreateTagForm,
  DeleteButton,
} from "../../../../components/crm/crm-forms";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function CrmTagsPage({ searchParams }: Props) {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  ensureCrmAiToolsRegistered();

  const params = await searchParams;
  const tags = await listTags({
    workspaceId: context.active.workspace.id,
    query: params.q,
  });

  return (
    <CrmShell
      title="Tags"
      description="Label contacts, companies, and deals for filtering."
      actions={<CrmSearch placeholder="Search tags" />}
    >
      <CreateTagForm />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tags.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-muted">No tags yet</p>
          </Card>
        ) : (
          tags.map((tag) => (
            <Card key={tag.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {tag.name}
                  </span>
                </div>
                <DeleteButton id={tag.id} kind="tag" />
              </div>
            </Card>
          ))
        )}
      </div>
    </CrmShell>
  );
}
