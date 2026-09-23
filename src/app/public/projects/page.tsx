import { PublicPortalShell } from "@/features/public-portal/components/public-portal-shell";
import { PublicProjectsDirectoryView } from "@/features/public-portal/views/public-project-views";

export default function PublicProjectsPage() {
  return (
    <PublicPortalShell>
      <PublicProjectsDirectoryView />
    </PublicPortalShell>
  );
}
