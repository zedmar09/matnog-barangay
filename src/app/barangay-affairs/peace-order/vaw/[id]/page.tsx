import { VawCaseDetailView } from "@/features/peace-order/views/vaw-views";

export default async function VawCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VawCaseDetailView id={id} />;
}
