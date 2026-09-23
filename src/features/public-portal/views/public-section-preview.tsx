"use client";

import Link from "next/link";

import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileSearch,
  FolderKanban,
  Landmark,
  MapPinned,
  MessageSquareText,
  UsersRound,
} from "lucide-react";

import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "../components/public-portal.module.css";

export function PublicSectionPreview({
  title,
  description,
  phase,
  icon,
}: {
  title: string;
  description: string;
  phase: string;
  icon: "barangays" | "officials" | "transparency" | "projects" | "verify" | "feedback" | "public";
}) {
  const { selectedBarangayName } = useBarangayScope();
  const icons = {
    barangays: MapPinned,
    officials: UsersRound,
    transparency: Landmark,
    projects: FolderKanban,
    verify: FileSearch,
    feedback: MessageSquareText,
    public: Building2,
  };
  const Icon = icons[icon];
  return (
    <section className={styles.previewPage}>
      <span className={styles.previewIcon}>
        <Icon size={28} />
      </span>
      <span className={styles.eyebrow}>{phase}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className={styles.previewScope}>
        <CheckCircle2 size={16} /> Current public scope: <strong>{selectedBarangayName}</strong>
      </div>
      <p className={styles.previewNote}>
        The navigation and barangay context are ready. This workspace will be completed in its scheduled A12 phase.
      </p>
      <Link className={styles.secondaryButton} href="/">
        <ArrowLeft size={16} /> Return to public home
      </Link>
    </section>
  );
}
