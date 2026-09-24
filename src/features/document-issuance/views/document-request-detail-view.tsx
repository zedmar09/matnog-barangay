"use client";

import { useState } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileBadge2,
  FileText,
  PackageCheck,
  Printer,
  QrCode,
  ReceiptText,
  RotateCcw,
  Send,
  ShieldCheck,
  UserCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import dashboardStyles from "@/features/resident-registry/views/resident-dashboard.module.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

import { useDocumentStore } from "../stores/document-store";
import type { IssuedDocumentStatus } from "../types/document";
import documentStyles from "./document-issuance.module.css";

const tabs = ["Overview", "Document & Payment", "Audit Trail", "Next Action"] as const;
const staff = [
  "Liza M. Cruz — Barangay Document Officer",
  "Ana P. Reyes — Barangay Secretary",
  "Hon. Maria L. Santos — Punong Barangay",
  "Roberto G. Dela Cruz — Barangay Treasurer",
  "John P. Ramos — Barangay Releasing Officer",
  "Elena D. Flores — Barangay Records Custodian",
] as const;

function statusStyle(status: string) {
  return status === "Released"
    ? styles.active
    : status === "Rejected" || status === "Revoked"
      ? styles.danger
      : status === "For Approval" || status === "Ready for Release"
        ? styles.info
        : styles.warning;
}

function Rows({ items }: { items: Array<[string, string | number | undefined]> }) {
  return (
    <dl className={styles.dataList}>
      {items.map(([label, value]) => (
        <div className={styles.dataRow} key={label}>
          <dt>{label}</dt>
          <dd>{value === undefined || value === "" ? "—" : value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DetailCard({
  icon,
  title,
  children,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${styles.detailCardStyled} ${className}`}>
      <div className={styles.detailCardHeader}>
        <span className={styles.detailCardIcon}>{icon}</span>
        <h3>{title}</h3>
      </div>
      <div className={styles.detailCardBody}>{children}</div>
    </section>
  );
}

export function DocumentRequestDetailView({ id }: { id: string }) {
  const documents = useDocumentStore((state) => state.documents);
  const templates = useDocumentStore((state) => state.templates);
  const updateStatus = useDocumentStore((state) => state.updateDocumentStatus);
  const verifyPayment = useDocumentStore((state) => state.verifyPayment);
  const releaseDocument = useDocumentStore((state) => state.releaseDocument);
  const requestReprint = useDocumentStore((state) => state.requestReprint);
  const revokeDocument = useDocumentStore((state) => state.revokeDocument);
  const residents = useResidentRegistryStore((state) => state.residents);
  const document = documents.find((item) => item.id === id);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [performedBy, setPerformedBy] = useState("");
  const [note, setNote] = useState(
    document?.reviewNote || "Resident information and supporting requirements verified.",
  );
  const [receipt, setReceipt] = useState(document?.officialReceipt || "");
  const [amount, setAmount] = useState(String(document?.amountPaid || 0));
  const [releasedTo, setReleasedTo] = useState("");
  const [reprintReason, setReprintReason] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [revocationReason, setRevocationReason] = useState("");
  const [message, setMessage] = useState("");

  if (!document)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <FileText size={34} />
          <h1>Document request not found</h1>
          <p className={styles.muted}>The requested document record is unavailable.</p>
          <Link className={styles.primaryButton} href="/barangay-affairs/documents/requests">
            Return to requests
          </Link>
        </div>
      </div>
    );

  const resident = residents.find((item) => item.id === document.residentId);
  const template = templates.find((item) => item.code === document.templateCode);
  const barangay = MATNOG_BARANGAYS.find((item) => item.code === document.barangayId)?.name ?? "—";
  const residentName = resident ? formatResidentName(resident) : "Unknown resident";
  const paymentState = !template?.requiresOr ? "No fee required" : document.paymentVerified ? "Verified" : "Pending";
  const latestEvent = document.auditTrail.at(-1);

  const requirePerformer = () => {
    if (performedBy) return true;
    setMessage("Select the staff member who performed this action.");
    return false;
  };

  const move = (status: IssuedDocumentStatus) => {
    if (!requirePerformer()) return;
    const value = updateStatus(document.id, status, note, performedBy);
    if (value) {
      setMessage(`${status} recorded by ${performedBy}.`);
      setPerformedBy("");
    } else setMessage("Enter a review or decision note before continuing.");
  };

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${dashboardStyles.documentHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>{document.controlNumber}</h1>
            <p>
              {residentName} · {resident?.lrn ?? "No LRN"} · Brgy. {barangay}
            </p>
          </div>
          <div className={styles.heroActions}>
            {resident ? (
              <Link className={styles.btnPrimary} href={`/barangay-affairs/residents/${resident.id}`}>
                <UserRound size={16} /> Resident Profile
              </Link>
            ) : null}
            <Link className={styles.btnSecondary} href="/barangay-affairs/documents/requests">
              <ArrowLeft size={16} /> Requests
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        {message ? <div className={styles.toast}>{message}</div> : null}
        <section className={styles.card}>
          <header className={styles.profileHeader}>
            <div className={styles.avatarLg}>
              <FileBadge2 size={30} />
            </div>
            <div className={styles.profileIdentity}>
              <h1>{document.controlNumber}</h1>
              <p>
                {template?.name ?? document.templateCode} · {residentName}
              </p>
              <div className={styles.badgeRow}>
                <span className={`${styles.badge} ${statusStyle(document.status)}`}>{document.status}</span>
                <span className={styles.badge}>{template?.shortCode}</span>
                <span className={`${styles.badge} ${paymentState === "Pending" ? styles.warning : styles.active}`}>
                  {paymentState}
                </span>
                <span className={styles.badge}>Brgy. {barangay}</span>
              </div>
            </div>
          </header>

          <nav className={styles.tabs} aria-label="Document request details">
            {tabs.map((value) => (
              <button
                type="button"
                key={value}
                className={`${styles.tab} ${tab === value ? styles.tabActive : ""}`}
                onClick={() => setTab(value)}
              >
                {value}
              </button>
            ))}
          </nav>

          <div className={styles.profileBody}>
            {tab === "Overview" ? (
              <div className={styles.profileGrid}>
                <DetailCard icon={<UserRound size={17} />} title="Resident Information">
                  <Rows
                    items={[
                      ["Resident", residentName],
                      ["Local Resident Number", resident?.lrn],
                      ["Barangay", barangay],
                      ["Mobile number", resident?.contact.primaryMobile || "No mobile recorded"],
                      ["Resident status", resident?.residentStatus],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<FileText size={17} />} title="Document Details">
                  <Rows
                    items={[
                      ["Control number", document.controlNumber],
                      ["Document type", template?.name],
                      ["Purpose", document.purpose],
                      ["Issue date", new Date(`${document.issueDate}T12:00:00`).toLocaleDateString("en-PH")],
                      ["Current status", document.status],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<CalendarDays size={17} />} title="Processing Summary">
                  <Rows
                    items={[
                      ["Requested", new Date(document.requestedAt).toLocaleString("en-PH")],
                      ["Latest update", new Date(document.updatedAt).toLocaleString("en-PH")],
                      ["Last action", latestEvent?.action],
                      ["Last performed by", latestEvent?.actor],
                      ["Reprint count", document.reprintCount],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<ShieldCheck size={17} />} title="Signatories and Release">
                  <Rows
                    items={[
                      ["Barangay Secretary", document.barangaySecretary],
                      ["Punong Barangay", document.punongBarangay],
                      ["Released to", document.releasedTo || "Not yet released"],
                      [
                        "Released at",
                        document.releasedAt
                          ? new Date(document.releasedAt).toLocaleString("en-PH")
                          : "Not yet released",
                      ],
                    ]}
                  />
                </DetailCard>
              </div>
            ) : null}

            {tab === "Document & Payment" ? (
              <div className={styles.profileGrid}>
                <DetailCard icon={<FileText size={17} />} title="Issuance Information">
                  <Rows
                    items={[
                      ["Document", template?.name],
                      ["Purpose", document.purpose],
                      ["Issue date", new Date(`${document.issueDate}T12:00:00`).toLocaleDateString("en-PH")],
                      ["Barangay", barangay],
                      ["Verification token", document.verificationToken],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<ReceiptText size={17} />} title="Payment Record">
                  <Rows
                    items={[
                      [
                        "Fee requirement",
                        template?.requiresOr ? "Payment and official receipt required" : "No fee required",
                      ],
                      ["Payment status", paymentState],
                      ["Amount paid", template?.requiresOr ? `₱${document.amountPaid.toFixed(2)}` : "Free of charge"],
                      ["Official receipt", document.officialReceipt || "—"],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<PackageCheck size={17} />} title="Release Record">
                  <Rows
                    items={[
                      ["Release status", document.status === "Released" ? "Released" : "Not yet released"],
                      ["Released to", document.releasedTo || "—"],
                      [
                        "Released at",
                        document.releasedAt ? new Date(document.releasedAt).toLocaleString("en-PH") : "—",
                      ],
                      ["Latest note", document.reviewNote],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<QrCode size={17} />} title="Public Verification">
                  <p className={styles.muted}>
                    The public endpoint returns the document status only and does not expose the resident record.
                  </p>
                  <div className={styles.mediaAction}>
                    <Link className={styles.secondaryButton} href={`/verify/document/${document.verificationToken}`}>
                      <QrCode size={14} /> Open verification status
                    </Link>
                  </div>
                </DetailCard>
              </div>
            ) : null}

            {tab === "Audit Trail" ? (
              <DetailCard
                icon={<ClipboardCheck size={17} />}
                title="Accountability Timeline"
                className={documentStyles.fullProfileCard}
              >
                <div className={documentStyles.auditTimeline}>
                  {[...document.auditTrail].reverse().map((event) => (
                    <article key={event.id}>
                      <span />
                      <div>
                        <strong>{event.action}</strong>
                        <p>{event.note}</p>
                        <small>
                          Performed by {event.actor} · {new Date(event.occurredAt).toLocaleString("en-PH")}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              </DetailCard>
            ) : null}

            {tab === "Next Action" ? (
              <div className={styles.idActionCardBody}>
                {document.status === "Revoked" ? (
                  <DetailCard icon={<XCircle size={17} />} title="Document Revoked">
                    <p className={styles.muted}>{document.reviewNote}</p>
                    <div className={styles.mediaAction}>
                      <Link className={styles.secondaryButton} href={`/verify/document/${document.verificationToken}`}>
                        <QrCode size={14} /> View public status
                      </Link>
                    </div>
                  </DetailCard>
                ) : (
                  <DetailCard
                    icon={<UserCheck size={17} />}
                    title="Action Accountability"
                    className={documentStyles.fullProfileCard}
                  >
                    <div className={documentStyles.actionAccountability}>
                      <div className={styles.field}>
                        <span>
                          Performed by<span className={styles.requiredMark}> *</span>
                        </span>
                        <Select value={performedBy || undefined} onValueChange={setPerformedBy}>
                          <SelectTrigger aria-label="Performed by">
                            <SelectValue placeholder="Select the staff member performing this action" />
                          </SelectTrigger>
                          <SelectContent>
                            {staff.map((value) => (
                              <SelectItem key={value} value={value}>
                                {value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <small>This identity will be recorded permanently in the audit trail.</small>
                      </div>
                    </div>
                  </DetailCard>
                )}

                {(["Draft", "Pending Review", "For Approval", "Rejected"] as IssuedDocumentStatus[]).includes(
                  document.status,
                ) ? (
                  <DetailCard
                    icon={<ClipboardCheck size={17} />}
                    title="Review and Decision"
                    className={documentStyles.fullProfileCard}
                  >
                    <label className={styles.field}>
                      <span>
                        Review or decision note<span className={styles.requiredMark}> *</span>
                      </span>
                      <textarea
                        rows={4}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Enter review findings, decision basis, or required follow-up"
                      />
                    </label>
                    <div className={documentStyles.workflowActions}>
                      {document.status === "Draft" ? (
                        <button className={styles.primaryButton} type="button" onClick={() => move("Pending Review")}>
                          <Send size={15} /> Submit for review
                        </button>
                      ) : null}
                      {document.status === "Pending Review" ? (
                        <>
                          <button className={styles.primaryButton} type="button" onClick={() => move("For Approval")}>
                            <ClipboardCheck size={15} /> Complete review
                          </button>
                          <button className={styles.secondaryButton} type="button" onClick={() => move("Rejected")}>
                            <XCircle size={15} /> Reject request
                          </button>
                        </>
                      ) : null}
                      {document.status === "For Approval" ? (
                        <>
                          <button
                            className={styles.primaryButton}
                            type="button"
                            onClick={() => move("Ready for Release")}
                          >
                            <BadgeCheck size={15} /> Approve document
                          </button>
                          <button className={styles.secondaryButton} type="button" onClick={() => move("Rejected")}>
                            <XCircle size={15} /> Reject request
                          </button>
                        </>
                      ) : null}
                      {document.status === "Rejected" ? (
                        <button className={styles.primaryButton} type="button" onClick={() => move("Draft")}>
                          <RotateCcw size={15} /> Return to draft
                        </button>
                      ) : null}
                    </div>
                  </DetailCard>
                ) : null}

                {document.status === "Ready for Release" && template?.requiresOr && !document.paymentVerified ? (
                  <DetailCard
                    icon={<Banknote size={17} />}
                    title="Verify Payment"
                    className={documentStyles.fullProfileCard}
                  >
                    <div className={styles.filterGrid}>
                      <label className={styles.field}>
                        <span>
                          Official receipt<span className={styles.requiredMark}> *</span>
                        </span>
                        <input
                          value={receipt}
                          onChange={(event) => setReceipt(event.target.value)}
                          placeholder="e.g. OR-000000"
                        />
                      </label>
                      <label className={styles.field}>
                        <span>Amount paid</span>
                        <input
                          type="number"
                          min="0"
                          value={amount}
                          onChange={(event) => setAmount(event.target.value)}
                          placeholder="Enter amount paid"
                        />
                      </label>
                    </div>
                    <div className={styles.mediaAction}>
                      <button
                        className={styles.primaryButton}
                        type="button"
                        onClick={() => {
                          if (!requirePerformer()) return;
                          const value = verifyPayment(document.id, receipt, Number(amount) || 0, performedBy);
                          if (value) {
                            setMessage(`Payment verified by ${performedBy}.`);
                            setPerformedBy("");
                          } else setMessage("Enter an official receipt number before verifying payment.");
                        }}
                      >
                        <Banknote size={15} /> Verify payment
                      </button>
                    </div>
                  </DetailCard>
                ) : null}

                {document.status === "Ready for Release" && (!template?.requiresOr || document.paymentVerified) ? (
                  <DetailCard
                    icon={<PackageCheck size={17} />}
                    title="Release Document"
                    className={documentStyles.fullProfileCard}
                  >
                    <div className={styles.filterGrid}>
                      <label className={styles.field}>
                        <span>
                          Released to<span className={styles.requiredMark}> *</span>
                        </span>
                        <input
                          value={releasedTo}
                          onChange={(event) => setReleasedTo(event.target.value)}
                          placeholder="Resident or authorized representative"
                        />
                      </label>
                      <label className={styles.field}>
                        <span>
                          Release note<span className={styles.requiredMark}> *</span>
                        </span>
                        <input
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          placeholder="Describe identity verification and release"
                        />
                      </label>
                    </div>
                    <div className={styles.mediaAction}>
                      <button
                        className={styles.primaryButton}
                        type="button"
                        onClick={() => {
                          if (!requirePerformer()) return;
                          const value = releaseDocument(document.id, releasedTo, note, performedBy);
                          if (value) {
                            setMessage(`Document released by ${performedBy}.`);
                            setPerformedBy("");
                          } else setMessage("Complete the claimant and release note before confirming release.");
                        }}
                      >
                        <CheckCircle2 size={15} /> Confirm release
                      </button>
                    </div>
                  </DetailCard>
                ) : null}

                {document.status === "Released" ? (
                  <>
                    <DetailCard
                      icon={<CheckCircle2 size={17} />}
                      title="Released Document"
                      className={documentStyles.fullProfileCard}
                    >
                      <Rows
                        items={[
                          ["Released to", document.releasedTo],
                          ["Released at", new Date(document.releasedAt).toLocaleString("en-PH")],
                          ["Release note", document.reviewNote],
                        ]}
                      />
                    </DetailCard>
                    <div className={styles.profileGrid}>
                      <DetailCard icon={<Printer size={17} />} title="Controlled Reprint Request">
                        <label className={styles.field}>
                          <span>
                            Requested by<span className={styles.requiredMark}> *</span>
                          </span>
                          <input
                            value={requestedBy}
                            onChange={(event) => setRequestedBy(event.target.value)}
                            placeholder="Resident or requesting party"
                          />
                        </label>
                        <label className={styles.field}>
                          <span>
                            Reprint reason<span className={styles.requiredMark}> *</span>
                          </span>
                          <textarea
                            rows={3}
                            value={reprintReason}
                            onChange={(event) => setReprintReason(event.target.value)}
                            placeholder="Enter the reason for requesting another copy"
                          />
                        </label>
                        <div className={styles.mediaAction}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => {
                              if (!requirePerformer()) return;
                              const value = requestReprint(document.id, reprintReason, requestedBy, performedBy);
                              if (value) {
                                setMessage(`Reprint request recorded by ${performedBy}.`);
                                setPerformedBy("");
                              } else setMessage("Complete the requester and reprint reason.");
                            }}
                          >
                            <Printer size={14} /> Submit reprint request
                          </button>
                        </div>
                      </DetailCard>
                      <DetailCard icon={<XCircle size={17} />} title="Revoke Document">
                        <label className={styles.field}>
                          <span>
                            Revocation reason<span className={styles.requiredMark}> *</span>
                          </span>
                          <textarea
                            rows={3}
                            value={revocationReason}
                            onChange={(event) => setRevocationReason(event.target.value)}
                            placeholder="Enter the legal or administrative basis for revocation"
                          />
                        </label>
                        <div className={styles.mediaAction}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => {
                              if (!requirePerformer()) return;
                              const value = revokeDocument(document.id, revocationReason, performedBy);
                              if (value) {
                                setMessage(`Document revoked by ${performedBy}.`);
                                setPerformedBy("");
                              } else setMessage("Enter a revocation reason before continuing.");
                            }}
                          >
                            <XCircle size={14} /> Confirm revocation
                          </button>
                        </div>
                      </DetailCard>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
