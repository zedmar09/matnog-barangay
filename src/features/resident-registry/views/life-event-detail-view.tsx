"use client";

import { useState } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AlertTriangle, ArrowLeft, Baby, CheckCircle2, Clock3, FileCheck2, UserRound, XCircle } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";

import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
import type { LifeEventStatus } from "../types/resident";
import { formatResidentName } from "../utils/resident-utils";

function statusClass(status: string) {
  return status === "Approved"
    ? styles.active
    : status === "Rejected" || status === "Cancelled"
      ? styles.danger
      : status === "Clarification Requested"
        ? styles.warning
        : "";
}
export function LifeEventDetailView({ id }: { id: string }) {
  const lifeEvent = useResidentRegistryStore((s) => s.lifeEvents.find((e) => e.id === id));
  const residents = useResidentRegistryStore((s) => s.residents);
  const review = useResidentRegistryStore((s) => s.reviewLifeEvent);
  const params = useSearchParams();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const resident = lifeEvent ? residents.find((r) => r.id === lifeEvent.residentId) : undefined;
  const generated = lifeEvent?.generatedResidentId
    ? residents.find((r) => r.id === lifeEvent.generatedResidentId)
    : undefined;
  if (!lifeEvent)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <FileCheck2 size={34} />
          <h1>Life event not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/residents/life-events">
            Return to Life Events
          </Link>
        </div>
      </div>
    );
  const subject = resident
    ? formatResidentName(resident)
    : [lifeEvent.details.proposedLastName, lifeEvent.details.proposedFirstName, lifeEvent.details.proposedMiddleName]
        .filter(Boolean)
        .join(", ");
  const barangay = MATNOG_BARANGAYS.find((b) => b.code === lifeEvent.barangayId)?.name ?? "—";
  const active = lifeEvent.status === "Pending Review" || lifeEvent.status === "Clarification Requested";
  const act = (status: LifeEventStatus) => {
    if (!reason.trim()) {
      setMessage("Enter a required review reason before continuing.");
      return;
    }
    const result = review(lifeEvent.id, status, reason);
    if (result) {
      setMessage(
        status === "Approved"
          ? `${lifeEvent.eventType} event approved and the resident registry was updated.`
          : `Life event updated to ${status}.`,
      );
      setReason("");
    }
  };
  const proposed =
    lifeEvent.eventType === "Birth"
      ? [
          ["Name", subject],
          ["Gender", lifeEvent.details.proposedGender],
          ["Mother’s maiden name", lifeEvent.details.motherName],
          ["Birth barangay", barangay],
        ]
      : lifeEvent.eventType === "Marriage"
        ? [
            ["Civil status", "Married"],
            ["Married last name", lifeEvent.details.proposedMarriedName || resident?.lastName],
          ]
        : lifeEvent.eventType === "Civil Status Change"
          ? [["Civil status", lifeEvent.details.proposedCivilStatus]]
          : lifeEvent.eventType === "Death"
            ? [["Resident status", "Deceased"]]
            : lifeEvent.eventType === "Migration Out"
              ? [
                  ["Resident status", "Transferred Out"],
                  ["Destination", lifeEvent.details.destination],
                ]
              : [
                  ["Resident status", "Active"],
                  ["Barangay", barangay],
                  ["Previous location", lifeEvent.details.destination],
                ];
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A1 Life Event Review</p>
          <h1>{lifeEvent.referenceNumber}</h1>
          <p>
            {lifeEvent.eventType} · effective {lifeEvent.effectiveDate} · Brgy. {barangay}
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/residents/life-events">
          <ArrowLeft size={15} /> Life Events
        </Link>
      </header>
      {(params.get("created") || message) && (
        <div className={`${styles.mergeBanner} ${message.startsWith("Enter") ? styles.error : ""}`}>
          <CheckCircle2 size={18} />
          <div>
            <strong>{message || "Life event submitted for review."}</strong>
            <span>No identity value changes until the event is approved.</span>
          </div>
        </div>
      )}
      <div className={styles.reviewLayout}>
        <main style={{ display: "grid", gap: 14 }}>
          <section className={styles.card}>
            <header className={styles.profileHeader}>
              <span className={styles.avatarLg}>
                {lifeEvent.eventType === "Birth" ? <Baby size={28} /> : <UserRound size={28} />}
              </span>
              <div className={styles.profileIdentity}>
                <h1>{subject}</h1>
                <p>{resident?.lrn ?? "LRN generated after birth approval"}</p>
                <div className={styles.badgeRow}>
                  <span className={`${styles.badge} ${statusClass(lifeEvent.status)}`}>{lifeEvent.status}</span>
                  <span className={styles.badge}>{lifeEvent.eventType}</span>
                  <span className={styles.badge}>{lifeEvent.supportingDocumentCount} documents</span>
                </div>
              </div>
              {resident && (
                <Link className={styles.secondaryButton} href={`/barangay-affairs/residents/${resident.id}`}>
                  View resident
                </Link>
              )}
              {generated && (
                <Link className={styles.primaryButton} href={`/barangay-affairs/residents/${generated.id}`}>
                  View new resident
                </Link>
              )}
            </header>
          </section>
          <section className={styles.card}>
            <div className={styles.profileBody}>
              <div className={styles.profileGrid}>
                <section className={styles.detailCard}>
                  <h3>Existing registry value</h3>
                  <dl className={styles.dataList}>
                    {resident ? (
                      <>
                        <div className={styles.dataRow}>
                          <dt>Full name</dt>
                          <dd>{formatResidentName(resident)}</dd>
                        </div>
                        <div className={styles.dataRow}>
                          <dt>Civil status</dt>
                          <dd>{resident.civilStatus}</dd>
                        </div>
                        <div className={styles.dataRow}>
                          <dt>Resident status</dt>
                          <dd>{resident.residentStatus}</dd>
                        </div>
                        <div className={styles.dataRow}>
                          <dt>Barangay</dt>
                          <dd>{MATNOG_BARANGAYS.find((b) => b.code === resident.address.barangayId)?.name}</dd>
                        </div>
                      </>
                    ) : (
                      <div className={styles.dataRow}>
                        <dt>Record</dt>
                        <dd>No resident identity yet</dd>
                      </div>
                    )}
                  </dl>
                </section>
                <section className={styles.detailCard}>
                  <h3>Proposed registry result</h3>
                  <dl className={styles.dataList}>
                    {proposed.map(([label, value]) => (
                      <div className={styles.dataRow} key={label}>
                        <dt>{label}</dt>
                        <dd>{value || "—"}</dd>
                      </div>
                    ))}
                    <div className={styles.dataRow}>
                      <dt>Legal basis / remarks</dt>
                      <dd>{lifeEvent.details.causeOrBasis || "—"}</dd>
                    </div>
                  </dl>
                </section>
              </div>
            </div>
          </section>
        </main>
        <aside className={`${styles.card} ${styles.decisionPanel}`}>
          <h2>Review decision</h2>
          <p>
            Approval updates the resident identity, civil status, vital status, or residency according to the event
            type.
          </p>
          <div className={styles.auditTimeline}>
            <div className={styles.auditItem}>
              <span className={styles.auditDot} />
              <div>
                <strong>Event recorded</strong>
                <p>
                  {new Date(lifeEvent.requestedAt).toLocaleString("en-PH")} · {lifeEvent.requestedBy}
                </p>
              </div>
            </div>
            {lifeEvent.reviewedAt && (
              <div className={styles.auditItem}>
                <span className={styles.auditDot} />
                <div>
                  <strong>{lifeEvent.status}</strong>
                  <p>
                    {new Date(lifeEvent.reviewedAt).toLocaleString("en-PH")} · {lifeEvent.reviewedBy}
                  </p>
                </div>
              </div>
            )}
          </div>
          {active ? (
            <>
              <textarea
                className={styles.noteArea}
                aria-label="Review reason"
                placeholder="Required approval or decision reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className={styles.buttonStack}>
                <button type="button" className={styles.primaryButton} onClick={() => act("Approved")}>
                  <FileCheck2 size={14} /> Approve event
                </button>
                <button type="button" className={styles.secondaryButton} onClick={() => act("Clarification Requested")}>
                  <AlertTriangle size={14} /> Request clarification
                </button>
                <button type="button" className={styles.dangerButton} onClick={() => act("Rejected")}>
                  <XCircle size={14} /> Reject event
                </button>
                <button type="button" className={styles.secondaryButton} onClick={() => act("Cancelled")}>
                  <Clock3 size={14} /> Cancel event
                </button>
              </div>
            </>
          ) : (
            <div className={styles.mergeBanner} style={{ marginTop: 14 }}>
              <CheckCircle2 size={17} />
              <div>
                <strong>Decision: {lifeEvent.status}</strong>
                <span>
                  {lifeEvent.decisionReason} · {lifeEvent.reviewedBy}
                </span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
