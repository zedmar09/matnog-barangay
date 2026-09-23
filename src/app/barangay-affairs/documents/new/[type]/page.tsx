import { DocumentTemplateView } from "@/features/document-issuance/views/document-template-view";

export default async function DocumentTemplatePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  return <DocumentTemplateView type={type} />;
}
