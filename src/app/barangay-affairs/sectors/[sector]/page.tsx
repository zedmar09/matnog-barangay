import { SectorRegistryView } from "@/features/sector-registry/views/sector-registry-view";

export default async function SectorRegistryPage({ params }: { params: Promise<{ sector: string }> }) {
  const { sector } = await params;
  return <SectorRegistryView slug={sector} />;
}
