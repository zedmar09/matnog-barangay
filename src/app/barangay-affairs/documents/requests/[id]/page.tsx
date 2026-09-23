import { DocumentRequestDetailView } from "@/features/document-issuance/views/document-workflow-views";

export default async function DocumentRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentRequestDetailView id={id} />;
}
