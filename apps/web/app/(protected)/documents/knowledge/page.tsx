import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { getDocumentsModuleData } from "../../actions/documents";
import { DocumentsShell } from "../../../../components/documents/documents-shell";
import { KnowledgeBasePanel } from "../../../../components/documents/documents-extra";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Knowledge Base" };

export default async function Page() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const data = await getDocumentsModuleData({ view: "knowledge" });
  return (
    <DocumentsShell
      title="Knowledge Base"
      description="Internal wiki, policies, guides, and playbooks."
    >
      <KnowledgeBasePanel articles={data.knowledge} />
    </DocumentsShell>
  );
}
