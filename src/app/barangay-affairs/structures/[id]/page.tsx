import { StructureDetailView } from "@/features/household-registry/views/structure-detail-view";

export default async function StructureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StructureDetailView id={id} />;
}
