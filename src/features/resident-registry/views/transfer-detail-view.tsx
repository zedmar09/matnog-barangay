"use client";

import { useState } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  Send,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";

import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
import type { TransferStatus } from "../types/resident";
import { formatResidentAddress, formatResidentName } from "../utils/resident-utils";

function statusClass(status: string) {
  return status === "Accepted"
    ? styles.active
    : status === "Rejected" || status === "Cancelled"
      ? styles.danger
      : status === "Clarification Requested"
        ? styles.warning
        : status === "Awaiting Acceptance"
          ? styles.info
          : "";
}
export function TransferDetailView({ id }: { id: string }) {
  const transfer = useResidentRegistryStore((s) => s.transfers.find((t) => t.id === id));
  const resident = useResidentRegistryStore((s) =>
    transfer ? s.residents.find((r) => r.id === transfer.residentId) : undefined,
  );
  const residencyHistory = useResidentRegistryStore((s) => s.residencyHistory);
  const history = transfer ? residencyHistory.filter((entry) => entry.residentId === transfer.residentId) : [];
  const update = useResidentRegistryStore((s) => s.updateTransferStatus);
  const params = useSearchParams();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const barangay = (value: string) => MATNOG_BARANGAYS.find((b) => b.code === value)?.name ?? "—";
  if (!transfer || !resident)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <MapPin size={34} />
          <h1>Transfer not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/residents/transfers">
            Return to transfer queue
          </Link>
        </div>
      </div>
    );
  const act = (status: TransferStatus) => {
    if (!reason.trim()) {
      setMessage("Enter a required action reason before continuing.");
      return;
    }
    const result = update(transfer.id, status, reason);
    if (result) {
      setMessage(
        status === "Awaiting Acceptance"
          ? "Origin released the record to the destination barangay."
          : status === "Accepted"
            ? "Destination accepted the transfer. The resident’s active residency was updated."
            : `Transfer updated to ${status}.`,
      );
      setReason("");
    }
  };
  const active = ["Requested", "Awaiting Acceptance", "Clarification Requested"].includes(transfer.status);
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A1 Transfer Transaction</p>
          <h1>{transfer.referenceNumber}</h1>
          <p>
            {barangay(transfer.originBarangayId)} → {barangay(transfer.destinationBarangayId)} · requested{" "}
            {new Date(transfer.requestedAt).toLocaleDateString("en-PH")}
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/residents/transfers">
          <ArrowLeft size={15} /> Transfer queue
        </Link>
      </header>
      {(params.get("created") || message) && (
        <div className={`${styles.mergeBanner} ${message.startsWith("Enter") ? styles.error : ""}`}>
          <CheckCircle2 size={18} />
          <div>
            <strong>{message || "Transfer request created successfully."}</strong>
            <span>
              {transfer.status === "Requested"
                ? "The origin barangay must release the record before destination review."
                : "The transaction timeline has been updated."}
            </span>
          </div>
        </div>
      )}
      <div className={styles.reviewLayout}>
        <main style={{ display: "grid", gap: 14 }}>
          <section className={styles.card}>
            <header className={styles.profileHeader}>
              <span className={styles.avatarLg}>
                {resident.firstName[0]}
                {resident.lastName[0]}
              </span>
              <div className={styles.profileIdentity}>
                <h1>{formatResidentName(resident)}</h1>
                <p>
                  {resident.lrn} · Current registry: Brgy. {barangay(resident.address.barangayId)}
                </p>
                <div className={styles.badgeRow}>
                  <span className={`${styles.badge} ${statusClass(transfer.status)}`}>{transfer.status}</span>
                  <span className={styles.badge}>{transfer.supportingDocumentCount} supporting documents</span>
                </div>
              </div>
              <Link className={styles.secondaryButton} href={`/barangay-affairs/residents/${resident.id}`}>
                View resident
              </Link>
            </header>
          </section>
          <section className={styles.card}>
            <div className={styles.profileBody}>
              <div className={styles.profileGrid}>
                <section className={styles.detailCard}>
                  <h3>
                    <MapPin size={15} /> Transfer route
                  </h3>
                  <dl className={styles.dataList}>
                    <div className={styles.dataRow}>
                      <dt>Origin</dt>
                      <dd>Brgy. {barangay(transfer.originBarangayId)}</dd>
                    </div>
                    <div className={styles.dataRow}>
                      <dt>Destination</dt>
                      <dd>Brgy. {barangay(transfer.destinationBarangayId)}</dd>
                    </div>
                    <div className={styles.dataRow}>
                      <dt>Effective date</dt>
                      <dd>{transfer.requestedEffectiveDate}</dd>
                    </div>
                    <div className={styles.dataRow}>
                      <dt>Current address</dt>
                      <dd>{formatResidentAddress(resident.address)}</dd>
                    </div>
                  </dl>
                </section>
                <section className={styles.detailCard}>
                  <h3>
                    <UserRound size={15} /> Request details
                  </h3>
                  <dl className={styles.dataList}>
                    <div className={styles.dataRow}>
                      <dt>Reason</dt>
                      <dd>{transfer.reason}</dd>
                    </div>
                    <div className={styles.dataRow}>
                      <dt>Requested by</dt>
                      <dd>{transfer.requestedBy}</dd>
                    </div>
                    <div className={styles.dataRow}>
                      <dt>Decision note</dt>
                      <dd>{transfer.decisionReason || "—"}</dd>
                    </div>
                    <div className={styles.dataRow}>
                      <dt>Last updated</dt>
                      <dd>{new Date(transfer.updatedAt).toLocaleString("en-PH")}</dd>
                    </div>
                  </dl>
                </section>
              </div>
            </div>
          </section>
          <section className={styles.card}>
            <div className={styles.resultsMeta}>
              <strong>Residency history</strong>
              <span>{history.length} periods recorded</span>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table} style={{ minWidth: 850 }}>
                <thead>
                  <tr>
                    <th>Barangay</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Transfer No.</th>
                    <th>Status</th>
                    <th>Processed By</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {history
                    .sort((a, b) => b.startDate.localeCompare(a.startDate))
                    .map((entry) => (
                      <tr key={entry.id}>
                        <td>{barangay(entry.barangayId)}</td>
                        <td>{entry.startDate}</td>
                        <td>{entry.endDate || "Present"}</td>
                        <td className={styles.mono}>{entry.transferId || "Initial registration"}</td>
                        <td>
                          <span className={`${styles.badge} ${entry.status === "Current" ? styles.active : ""}`}>
                            {entry.status}
                          </span>
                        </td>
                        <td>{entry.processedBy}</td>
                        <td>{entry.remarks}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
        <aside className={`${styles.card} ${styles.decisionPanel}`}>
          <h2>Transaction workflow</h2>
          <p>
            The origin releases the record. The destination then accepts or rejects it. Only acceptance changes active
            residency.
          </p>
          <div className={styles.auditTimeline}>
            <div className={styles.auditItem}>
              <span className={styles.auditDot} />
              <div>
                <strong>Transfer requested</strong>
                <p>
                  {new Date(transfer.requestedAt).toLocaleString("en-PH")} · {transfer.requestedBy}
                </p>
              </div>
            </div>
            {transfer.releasedAt && (
              <div className={styles.auditItem}>
                <span className={styles.auditDot} />
                <div>
                  <strong>Origin released</strong>
                  <p>
                    {new Date(transfer.releasedAt).toLocaleString("en-PH")} · {transfer.releasedBy}
                  </p>
                </div>
              </div>
            )}
            {transfer.reviewedAt && (
              <div className={styles.auditItem}>
                <span className={styles.auditDot} />
                <div>
                  <strong>Destination decision: {transfer.status}</strong>
                  <p>
                    {new Date(transfer.reviewedAt).toLocaleString("en-PH")} · {transfer.reviewedBy}
                  </p>
                </div>
              </div>
            )}
            {transfer.completedAt && (
              <div className={styles.auditItem}>
                <span className={styles.auditDot} />
                <div>
                  <strong>Residency activated</strong>
                  <p>Previous residency closed and destination residency started.</p>
                </div>
              </div>
            )}
          </div>
          {active && (
            <>
              <textarea
                className={styles.noteArea}
                aria-label="Action reason"
                placeholder="Required action reason or remarks"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className={styles.buttonStack}>
                {transfer.status === "Requested" && (
                  <button type="button" className={styles.primaryButton} onClick={() => act("Awaiting Acceptance")}>
                    <Send size={14} /> Release to destination
                  </button>
                )}
                {transfer.status === "Awaiting Acceptance" && (
                  <>
                    <button type="button" className={styles.primaryButton} onClick={() => act("Accepted")}>
                      <ShieldCheck size={14} /> Accept transfer
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => act("Clarification Requested")}
                    >
                      <AlertTriangle size={14} /> Request clarification
                    </button>
                    <button type="button" className={styles.dangerButton} onClick={() => act("Rejected")}>
                      <XCircle size={14} /> Reject transfer
                    </button>
                  </>
                )}
                {transfer.status === "Clarification Requested" && (
                  <button type="button" className={styles.primaryButton} onClick={() => act("Awaiting Acceptance")}>
                    <Send size={14} /> Resubmit to destination
                  </button>
                )}
                <button type="button" className={styles.secondaryButton} onClick={() => act("Cancelled")}>
                  <Clock3 size={14} /> Cancel request
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
