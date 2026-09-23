import { HouseholdProfileView } from "@/features/household-registry/views/household-profile-view";

export default async function HouseholdProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HouseholdProfileView id={id} />;
}
