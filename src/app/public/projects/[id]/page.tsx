import { PublicPortalShell } from "@/features/public-portal/components/public-portal-shell";
import { PublicProjectDetailView } from "@/features/public-portal/views/public-project-views";

export default async function PublicProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PublicPortalShell>
      <PublicProjectDetailView projectId={id} />
    </PublicPortalShell>
  );
}
