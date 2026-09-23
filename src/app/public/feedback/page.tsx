import { PublicPortalShell } from "@/features/public-portal/components/public-portal-shell";
import { PublicFeedbackView } from "@/features/public-portal/views/public-service-views";

export default async function PublicFeedbackPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project = "" } = await searchParams;
  return (
    <PublicPortalShell>
      <PublicFeedbackView linkedProjectId={project} />
    </PublicPortalShell>
  );
}
