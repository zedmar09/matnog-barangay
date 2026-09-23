import { PublicPortalShell } from "@/features/public-portal/components/public-portal-shell";
import { PublicTransparencyView } from "@/features/public-portal/views/public-transparency-view";

export default function PublicTransparencyPage() {
  return (
    <PublicPortalShell>
      <PublicTransparencyView />
    </PublicPortalShell>
  );
}
