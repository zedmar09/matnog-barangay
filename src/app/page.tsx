import { PublicPortalShell } from "@/features/public-portal/components/public-portal-shell";
import { PublicHomeView } from "@/features/public-portal/views/public-home-view";

export default function HomePage() {
  return (
    <PublicPortalShell>
      <PublicHomeView />
    </PublicPortalShell>
  );
}
