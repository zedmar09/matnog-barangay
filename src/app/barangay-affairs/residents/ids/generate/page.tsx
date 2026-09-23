import { ResidentIdGenerateView } from "@/features/resident-registry/views/resident-id-generate-view";

export default async function GenerateResidentIdPage({
  searchParams,
}: {
  searchParams: Promise<{ resident?: string; replace?: string }>;
}) {
  const params = await searchParams;
  return <ResidentIdGenerateView initialResidentId={params.resident} initialReplacementId={params.replace} />;
}
