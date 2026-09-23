import { BcpcCaseDetailView } from "@/features/peace-order/views/bcpc-views";

export default async function BcpcCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BcpcCaseDetailView id={id} />;
}
