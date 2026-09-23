import { JusticeCaseDetailView } from "@/features/peace-order/views/justice-views";

export default async function JusticeCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JusticeCaseDetailView id={id} />;
}
