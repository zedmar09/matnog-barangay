import { PublicPortalShell } from "@/features/public-portal/components/public-portal-shell";
import { PublicSectionPreview } from "@/features/public-portal/views/public-section-preview";

const sections = {
  barangays: {
    title: "Barangay Directory",
    description: "Browse public profiles for all 40 barangays of Matnog.",
    icon: "barangays",
    phase: "A12 Phase 2",
  },
  officials: {
    title: "Officials Directory",
    description: "Find municipal and barangay officials by community and office.",
    icon: "officials",
    phase: "A12 Phase 2",
  },
  transparency: {
    title: "Transparency Center",
    description: "Access budgets, financial statements, procurement notices, and fund utilization.",
    icon: "transparency",
    phase: "A12 Phase 3",
  },
  projects: {
    title: "Public Projects",
    description: "Track project budgets, contractors, status, progress, and approved public photos.",
    icon: "projects",
    phase: "A12 Phase 4",
  },
  verify: {
    title: "Document Verification",
    description: "Verify an official document using its QR token or reference number.",
    icon: "verify",
    phase: "A12 Phase 5",
  },
  feedback: {
    title: "Public Feedback",
    description: "Submit a concern or suggestion and receive a tracking reference.",
    icon: "feedback",
    phase: "A12 Phase 5",
  },
} as const;

export default async function PublicSectionPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  const key = slug[0] as keyof typeof sections;
  const section = sections[key] ?? {
    title: "Public Information",
    description: "This public information page is being prepared.",
    icon: "public",
    phase: "A12",
  };

  return (
    <PublicPortalShell>
      <PublicSectionPreview {...section} />
    </PublicPortalShell>
  );
}
