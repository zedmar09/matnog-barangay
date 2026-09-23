"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, ImageOff, ShieldCheck, XCircle } from "lucide-react";

import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
import type { MediaReviewStatus } from "../types/resident";
import { formatResidentName } from "../utils/resident-utils";

function statusClass(status: string) {
  return status === "Approved"
    ? styles.active
    : status === "Rejected"
      ? styles.danger
      : status === "Recapture Required"
        ? styles.warning
        : "";
}
function Preview({ src, label }: { src: string; label: string }) {
  return (
    <div>
      <p className={styles.eyebrow}>{label}</p>
      <div className={styles.mediaPreview}>
        {src ? (
          <Image src={src} alt={label} width={300} height={240} unoptimized />
        ) : (
          <div style={{ textAlign: "center", color: "#82938f" }}>
            <ImageOff size={26} />
            <p>Not on file</p>
          </div>
        )}
      </div>
    </div>
  );
}
export function IdentityMediaDetailView({ id }: { id: string }) {
  const review = useResidentRegistryStore((s) => s.mediaReviews.find((item) => item.id === id));
  const residents = useResidentRegistryStore((s) => s.residents);
  const media = useResidentRegistryStore((s) => s.identityMedia);
  const decide = useResidentRegistryStore((s) => s.reviewIdentityMedia);
  const params = useSearchParams();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const resident = review ? residents.find((r) => r.id === review.residentId) : undefined;
  const current = review ? media.find((item) => item.residentId === review.residentId) : undefined;
  if (!review || !resident)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <ImageOff size={34} />
          <h1>Media review not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/residents/media">
            Return to media queue
          </Link>
        </div>
      </div>
    );
  const active = review.status === "Pending Review";
  const act = (status: MediaReviewStatus) => {
    if (!reason.trim()) {
      setMessage("Enter a required review reason before continuing.");
      return;
    }
    const result = decide(review.id, status, reason);
    if (result) {
      setMessage(
        status === "Approved"
          ? "Photo and signature approved and applied to the resident profile."
          : `Media review updated to ${status}.`,
      );
      setReason("");
    }
  };
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A1 Identity Media Review</p>
          <h1>{review.referenceNumber}</h1>
          <p>
            {formatResidentName(resident)} · {resident.lrn}
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/residents/media">
          <ArrowLeft size={15} /> Media queue
        </Link>
      </header>
      {(params.get("created") || message) && (
        <div className={`${styles.mergeBanner} ${message.startsWith("Enter") ? styles.error : ""}`}>
          <CheckCircle2 size={18} />
          <div>
            <strong>{message || "Identity media submitted for review."}</strong>
            <span>Current verified media remains active until approval.</span>
          </div>
        </div>
      )}
      <div className={styles.reviewLayout}>
        <main style={{ display: "grid", gap: 14 }}>
          <section className={styles.card}>
            <header className={styles.profileHeader}>
              <span className={styles.avatarLg}>
                {resident.photoUrl ? (
                  <Image src={resident.photoUrl} alt="" width={76} height={76} unoptimized />
                ) : (
                  `${resident.firstName[0]}${resident.lastName[0]}`
                )}
              </span>
              <div className={styles.profileIdentity}>
                <h1>{formatResidentName(resident)}</h1>
                <p>
                  {resident.lrn} · {review.replacementReason}
                </p>
                <div className={styles.badgeRow}>
                  <span className={`${styles.badge} ${statusClass(review.status)}`}>{review.status}</span>
                  {review.qualityNotes.map((note) => (
                    <span className={styles.badge} key={note}>
                      {note}
                    </span>
                  ))}
                </div>
              </div>
              <Link className={styles.secondaryButton} href={`/barangay-affairs/residents/${resident.id}`}>
                View resident
              </Link>
            </header>
          </section>
          <section className={styles.card}>
            <div className={styles.profileBody}>
              <h2 className={styles.sectionTitle}>Photo comparison</h2>
              <div className={styles.mediaGrid}>
                <Preview src={current?.photoUrl ?? ""} label="Current verified photo" />
                <Preview src={review.proposedPhotoUrl} label="Proposed photo" />
              </div>
              <h2 className={styles.sectionTitle} style={{ marginTop: 22 }}>
                Signature comparison
              </h2>
              <div className={styles.mediaGrid}>
                <Preview src={current?.signatureUrl ?? ""} label="Current verified signature" />
                <Preview src={review.proposedSignatureUrl} label="Proposed signature" />
              </div>
            </div>
          </section>
        </main>
        <aside className={`${styles.card} ${styles.decisionPanel}`}>
          <h2>Media decision</h2>
          <p>
            Confirm the image belongs to this resident and meets the municipality’s framing and legibility requirements.
          </p>
          <div className={styles.auditTimeline}>
            <div className={styles.auditItem}>
              <span className={styles.auditDot} />
              <div>
                <strong>Media submitted</strong>
                <p>
                  {new Date(review.requestedAt).toLocaleString("en-PH")} · {review.requestedBy}
                </p>
              </div>
            </div>
            {review.reviewedAt && (
              <div className={styles.auditItem}>
                <span className={styles.auditDot} />
                <div>
                  <strong>{review.status}</strong>
                  <p>
                    {new Date(review.reviewedAt).toLocaleString("en-PH")} · {review.reviewedBy}
                  </p>
                </div>
              </div>
            )}
          </div>
          {active ? (
            <>
              <textarea
                className={styles.noteArea}
                aria-label="Media review reason"
                placeholder="Required approval, rejection, or recapture reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className={styles.buttonStack}>
                <button type="button" className={styles.primaryButton} onClick={() => act("Approved")}>
                  <ShieldCheck size={14} /> Approve media
                </button>
                <button type="button" className={styles.secondaryButton} onClick={() => act("Recapture Required")}>
                  <AlertTriangle size={14} /> Require recapture
                </button>
                <button type="button" className={styles.dangerButton} onClick={() => act("Rejected")}>
                  <XCircle size={14} /> Reject media
                </button>
              </div>
            </>
          ) : (
            <div className={styles.mergeBanner} style={{ marginTop: 14 }}>
              <Clock3 size={17} />
              <div>
                <strong>Decision: {review.status}</strong>
                <span>
                  {review.decisionReason} · {review.reviewedBy}
                </span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
