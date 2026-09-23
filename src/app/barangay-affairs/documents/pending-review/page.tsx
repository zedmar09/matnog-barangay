import { DocumentQueueView } from "@/features/document-issuance/views/document-workflow-views";

export default function PendingReviewPage() {
  return <DocumentQueueView mode="pending-review" />;
}
