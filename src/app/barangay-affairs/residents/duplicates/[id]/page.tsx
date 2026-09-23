import { DuplicateReviewDetailView } from "@/features/resident-registry/views/duplicate-review-detail-view";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DuplicateReviewDetailView id={id} />;
}
