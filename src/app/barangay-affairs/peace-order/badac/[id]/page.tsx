import { BadacRecordDetailView } from "@/features/peace-order/views/badac-views";

export default async function BadacRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BadacRecordDetailView id={id} />;
}
