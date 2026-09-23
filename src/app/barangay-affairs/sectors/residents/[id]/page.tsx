import { ResidentSectorProfileView } from "@/features/sector-registry/views/resident-sector-profile-view";

export default async function ResidentSectorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResidentSectorProfileView id={id} />;
}
