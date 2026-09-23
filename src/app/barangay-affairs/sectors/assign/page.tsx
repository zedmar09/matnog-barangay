import { SectorAssignmentView } from "@/features/sector-registry/views/sector-assignment-view";

export default async function SectorAssignmentPage({
  searchParams,
}: {
  searchParams: Promise<{ resident?: string; sector?: string }>;
}) {
  const params = await searchParams;
  return <SectorAssignmentView initialResidentId={params.resident} initialSector={params.sector} />;
}
