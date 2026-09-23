import { PublicDocumentVerificationView } from "@/features/document-issuance/views/document-control-views";

export default async function PublicDocumentVerificationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PublicDocumentVerificationView token={token} />;
}
