import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { getDocumentDetailAction } from "../../actions/documents";
import { DocumentsShell } from "../../../../components/documents/documents-shell";
import { DocumentEditor } from "../../../../components/documents/documents-extra";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Document" };

type Props = { params: Promise<{ id: string }> };

export default async function DocumentDetailPage({ params }: Props) {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const { id } = await params;
  const result = await getDocumentDetailAction({ id });
  if (!result.ok) notFound();
  return (
    <DocumentsShell
      title={result.data.document.title}
      description="Rich markdown editor with autosave, versions, and collaboration."
    >
      <DocumentEditor
        document={result.data.document}
        versions={result.data.versions}
        comments={result.data.comments}
        shares={result.data.shares}
      />
    </DocumentsShell>
  );
}
