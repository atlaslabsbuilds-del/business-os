import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { getDocumentsModuleData } from "../../actions/documents";
import { DocumentsShell } from "../../../../components/documents/documents-shell";
import { DocumentsListPanel } from "../../../../components/documents/documents-extra";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Templates" };

export default async function Page() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const data = await getDocumentsModuleData({ view: "templates" });
  return (
    <DocumentsShell title="Templates" description="Reusable document templates.">
      <DocumentsListPanel documents={data.documents} title="Templates" />
    </DocumentsShell>
  );
}
