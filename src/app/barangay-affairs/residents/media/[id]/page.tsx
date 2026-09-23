import { IdentityMediaDetailView } from "@/features/resident-registry/views/identity-media-detail-view";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <IdentityMediaDetailView id={id} />;
}
