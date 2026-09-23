import { HouseholdSurveyDetailView } from "@/features/household-registry/views/household-survey-detail-view";

export default async function HouseholdSurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HouseholdSurveyDetailView id={id} />;
}
