import { PublicIdVerificationView } from "@/features/resident-registry/views/public-id-verification-view";

export default async function VerifyResidentIdPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PublicIdVerificationView token={token} />;
}
