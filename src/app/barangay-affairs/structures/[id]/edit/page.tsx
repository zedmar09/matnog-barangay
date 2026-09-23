import { StructureFormView } from "@/features/household-registry/views/structure-form-view";

export default async function EditStructurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StructureFormView id={id} />;
}
