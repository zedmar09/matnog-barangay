import { ResidentIdDetailView } from "@/features/resident-registry/views/resident-id-detail-view";

export default async function ResidentIdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResidentIdDetailView id={id} />;
}
