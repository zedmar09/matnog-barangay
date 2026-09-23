import { LifeEventDetailView } from "@/features/resident-registry/views/life-event-detail-view";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LifeEventDetailView id={id} />;
}
