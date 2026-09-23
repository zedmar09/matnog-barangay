import { CertificationRequestDetailView } from "@/features/sector-registry/views/sector-workflow-views";

export default async function CertificationRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CertificationRequestDetailView id={id} />;
}
