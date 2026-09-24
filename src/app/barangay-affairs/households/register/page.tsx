import { HouseholdRegisterView } from "@/features/household-registry/views/household-register-view";

export default async function HouseholdRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ structureId?: string }>;
}) {
  const query = await searchParams;
  return <HouseholdRegisterView initialStructureId={query.structureId} />;
}
