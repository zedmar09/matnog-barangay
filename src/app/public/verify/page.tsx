import { PublicPortalShell } from "@/features/public-portal/components/public-portal-shell";
import { PublicDocumentVerificationView } from "@/features/public-portal/views/public-service-views";

export default function PublicVerifyPage() {
  return (
    <PublicPortalShell>
      <PublicDocumentVerificationView />
    </PublicPortalShell>
  );
}
