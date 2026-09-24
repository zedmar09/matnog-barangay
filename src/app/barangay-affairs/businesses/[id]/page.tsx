import { BusinessProfileView } from "@/features/business-registry/views/business-profile-view";

export default async function BusinessProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BusinessProfileView id={id} />;
}
