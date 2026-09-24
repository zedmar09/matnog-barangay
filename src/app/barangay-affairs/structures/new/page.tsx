import { StructureFormView } from "@/features/household-registry/views/structure-form-view";

export default async function RegisterStructurePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; barangayId?: string }>;
}) {
  const query = await searchParams;
  const returnTo = query.returnTo?.startsWith("/barangay-affairs/") ? query.returnTo : undefined;
  return <StructureFormView returnTo={returnTo} initialBarangayId={query.barangayId} />;
}
