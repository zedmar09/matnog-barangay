import { PublicPortalShell } from "@/features/public-portal/components/public-portal-shell";
import { OfficialsDirectoryView } from "@/features/public-portal/views/public-directory-views";

export default function OfficialsDirectoryPage() {
  return (
    <PublicPortalShell>
      <OfficialsDirectoryView />
    </PublicPortalShell>
  );
}
