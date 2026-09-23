import { PublicPortalShell } from "@/features/public-portal/components/public-portal-shell";
import { BarangayDirectoryView } from "@/features/public-portal/views/public-directory-views";

export default function BarangayDirectoryPage() {
  return (
    <PublicPortalShell>
      <BarangayDirectoryView />
    </PublicPortalShell>
  );
}
