import { CredentialDetailView } from "@/features/sector-registry/views/sector-workflow-views";

export default async function CredentialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CredentialDetailView id={id} />;
}
