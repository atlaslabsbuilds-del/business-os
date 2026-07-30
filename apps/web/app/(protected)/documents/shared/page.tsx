import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { getDocumentsModuleData } from "../../actions/documents";
import { DocumentsShell } from "../../../../components/documents/documents-shell";
import { DocumentsListPanel } from "../../../../components/documents/documents-extra";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shared" };

export default async function Page() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const data = await getDocumentsModuleData({ view: "shared" });
  return (
    <DocumentsShell title="Shared" description="Documents shared across the workspace.">
      <DocumentsListPanel documents={data.documents} title="Shared" />
    </DocumentsShell>
  );
}
