import { BlotterDetailView } from "@/features/peace-order/views/blotter-views";

export default async function BlotterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BlotterDetailView id={id} />;
}
