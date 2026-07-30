import { redirect } from "next/navigation";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import { getDocumentsModuleData } from "../actions/documents";
import { DocumentsShell } from "../../../components/documents/documents-shell";
import { DocumentsListPanel } from "../../../components/documents/documents-extra";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const data = await getDocumentsModuleData({ view: "all" });
  return (
    <DocumentsShell
      title="All Documents"
      description="AI-native docs with autosave, versions, and collaboration."
    >
      <DocumentsListPanel documents={data.documents} />
    </DocumentsShell>
  );
}
