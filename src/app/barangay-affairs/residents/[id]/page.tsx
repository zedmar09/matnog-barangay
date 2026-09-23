import { ResidentProfileView } from "@/features/resident-registry/views/resident-profile-view";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResidentProfileView id={id} />;
}
