import { PublicPortalShell } from "@/features/public-portal/components/public-portal-shell";
import { BarangayProfileView } from "@/features/public-portal/views/public-directory-views";

export default async function BarangayProfilePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <PublicPortalShell>
      <BarangayProfileView code={code} />
    </PublicPortalShell>
  );
}
