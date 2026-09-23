"use client";

import { BadgeCheck, Building2, CircleX, ShieldCheck } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";

import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";

export function PublicIdVerificationView({ token }: { token: string }) {
  const card = useResidentRegistryStore((state) => state.residentIds.find((item) => item.verificationToken === token));
  const publicStatus = !card
    ? "Not found"
    : card.status === "Released"
      ? "Valid"
      : card.status === "Expired"
        ? "Expired"
        : card.status === "Replaced"
          ? "Replaced"
          : card.status === "Revoked" || card.status === "Lost"
            ? "Revoked"
            : "Not found";
  const valid = publicStatus === "Valid";
  const Icon = valid ? BadgeCheck : CircleX;
  const barangay = card ? (MATNOG_BARANGAYS.find((item) => item.code === card.barangayId)?.name ?? "—") : "—";

  return (
    <main className={styles.publicVerify}>
      <section className={styles.verifyCard}>
        <header className={styles.verifyHeader}>
          <Building2 size={20} />
          <div>
            <strong>MATNOG BRGYS</strong>
            <small>Municipality of Matnog · Official ID verification</small>
          </div>
        </header>
        <div className={styles.verifyBody}>
          <span className={`${styles.verifyStatus} ${valid ? "" : styles.verifyInvalid}`}>
            <Icon size={16} /> {publicStatus}
          </span>
          <h1>Resident ID verification</h1>
          <p>This page confirms the status of a municipal resident ID without exposing the resident record.</p>
          <div className={styles.verifyFacts}>
            <div className={styles.verifyFact}>
              <span>Document type</span>
              <strong>Matnog Resident ID</strong>
            </div>
            <div className={styles.verifyFact}>
              <span>Validity status</span>
              <strong>{publicStatus}</strong>
            </div>
            <div className={styles.verifyFact}>
              <span>Issuing barangay</span>
              <strong>{card ? `Brgy. ${barangay}` : "—"}</strong>
            </div>
            <div className={styles.verifyFact}>
              <span>Issue date</span>
              <strong>{card ? card.issueDate : "—"}</strong>
            </div>
          </div>
          <div className={styles.verificationNotice}>
            <ShieldCheck size={16} />
            <span>No name, LRN, address, contact information, photo, or signature is returned by this endpoint.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
