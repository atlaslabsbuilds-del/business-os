import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { getDocumentsModuleData } from "../../actions/documents";
import { DocumentsShell } from "../../../../components/documents/documents-shell";
import { DocumentsSettingsPanel } from "../../../../components/documents/documents-extra";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Document Settings" };

export default async function Page() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const data = await getDocumentsModuleData();
  return (
    <DocumentsShell title="Settings" description="Autosave, permissions, and template defaults.">
      <DocumentsSettingsPanel settings={data.settings} />
    </DocumentsShell>
  );
}
