import { TransferDetailView } from "@/features/resident-registry/views/transfer-detail-view";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TransferDetailView id={id} />;
}
