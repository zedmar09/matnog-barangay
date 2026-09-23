"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileBadge2,
  PackageCheck,
  Printer,
  QrCode,
  Search,
  Send,
  UserCheck,
  XCircle,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useDocumentStore } from "../stores/document-store";
import type { IssuedDocumentStatus } from "../types/document";
import documentStyles from "./document-issuance.module.css";

export type DocumentQueueMode = "all" | "pending-review" | "for-approval" | "for-release" | "issued";

const queueConfig: Record<DocumentQueueMode, { title: string; description: string; statuses: IssuedDocumentStatus[] }> =
  {
    all: {
      title: "Document Requests",
      description: "All resident document requests from preparation through release.",
      statuses: ["Draft", "Pending Review", "For Approval", "Ready for Release", "Released", "Rejected", "Revoked"],
    },
    "pending-review": {
      title: "Pending Review",
      description: "Requests awaiting identity, address, purpose, and requirement verification.",
      statuses: ["Pending Review"],
    },
    "for-approval": {
      title: "For Approval",
      description: "Reviewed certificates waiting for the Punong Barangay decision.",
      statuses: ["For Approval"],
    },
    "for-release": {
      title: "For Release",
      description: "Approved documents waiting for payment validation and claimant release.",
      statuses: ["Ready for Release"],
    },
    issued: {
      title: "Issued Documents",
      description: "Completed documents released to residents or their authorized representatives.",
      statuses: ["Released"],
    },
  };

function badge(status: string) {
  return status === "Released"
    ? styles.active
    : status === "Rejected" || status === "Revoked"
      ? styles.danger
      : status === "For Approval" || status === "Ready for Release"
        ? styles.info
        : styles.warning;
}

export function DocumentQueueView({ mode }: { mode: DocumentQueueMode }) {
  const documents = useDocumentStore((state) => state.documents);
  const templates = useDocumentStore((state) => state.templates);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [templateCode, setTemplateCode] = useState("");
  const config = queueConfig[mode];
  const scopedAll = documents.filter(
    (document) => selectedBarangay === "all" || document.barangayId === selectedBarangay,
  );
  const rows = useMemo(
    () =>
      documents.filter((document) => {
        const resident = residents.find((item) => item.id === document.residentId);
        return (
          (selectedBarangay === "all" || document.barangayId === selectedBarangay) &&
          config.statuses.includes(document.status) &&
          (!templateCode || document.templateCode === templateCode) &&
          (!search.trim() ||
            `${document.controlNumber} ${resident ? formatResidentName(resident) : ""} ${resident?.lrn ?? ""}`
              .toLowerCase()
              .includes(search.toLowerCase()))
        );
      }),
    [config.statuses, documents, residents, search, selectedBarangay, templateCode],
  );

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A4 Document Workflow</p>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/documents/new">
          <FileBadge2 size={15} /> New document
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Clock3 size={18} />
          </span>
          <div>
            <strong>{scopedAll.filter((item) => item.status === "Pending Review").length}</strong>
            <span>Pending review</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <UserCheck size={18} />
          </span>
          <div>
            <strong>{scopedAll.filter((item) => item.status === "For Approval").length}</strong>
            <span>For approval</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <PackageCheck size={18} />
          </span>
          <div>
            <strong>{scopedAll.filter((item) => item.status === "Ready for Release").length}</strong>
            <span>For release</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CheckCircle2 size={18} />
          </span>
          <div>
            <strong>{scopedAll.filter((item) => item.status === "Released").length}</strong>
            <span>Released</span>
          </div>
        </div>
      </div>
      <section className={styles.card}>
        <div className={styles.queueTabs}>
          {(
            [
              ["all", "All requests", "/barangay-affairs/documents/requests"],
              ["pending-review", "Pending review", "/barangay-affairs/documents/pending-review"],
              ["for-approval", "For approval", "/barangay-affairs/documents/for-approval"],
              ["for-release", "For release", "/barangay-affairs/documents/for-release"],
              ["issued", "Issued", "/barangay-affairs/documents/issued"],
            ] as const
          ).map(([value, label, href]) => (
            <Link
              key={value}
              href={href}
              className={`${styles.queueTab} ${mode === value ? styles.queueTabActive : ""}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search document requests"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search control number, resident, or LRN"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="Document type"
            value={templateCode}
            onChange={(event) => setTemplateCode(event.target.value)}
          >
            <option value="">All document types</option>
            {templates.map((template) => (
              <option value={template.code} key={template.code}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} requests</strong>
          <span>Showing the latest 30</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1080 }}>
            <thead>
              <tr>
                <th>Control No.</th>
                <th>Resident</th>
                <th>Barangay</th>
                <th>Document</th>
                <th>Purpose</th>
                <th>Requested</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 30).map((document) => {
                const resident = residents.find((item) => item.id === document.residentId);
                const template = templates.find((item) => item.code === document.templateCode);
                return (
                  <tr key={document.id}>
                    <td className={styles.mono}>{document.controlNumber}</td>
                    <td>
                      <strong>{resident ? formatResidentName(resident) : "Unknown"}</strong>
                      <br />
                      <small>{resident?.lrn}</small>
                    </td>
                    <td>{MATNOG_BARANGAYS.find((item) => item.code === document.barangayId)?.name}</td>
                    <td>{template?.name}</td>
                    <td>{document.purpose}</td>
                    <td>{new Date(document.requestedAt).toLocaleDateString("en-PH")}</td>
                    <td>
                      <span className={`${styles.badge} ${document.paymentVerified ? styles.active : styles.warning}`}>
                        {template?.requiresOr ? (document.paymentVerified ? "Verified" : "Pending") : "No fee"}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${badge(document.status)}`}>{document.status}</span>
                    </td>
                    <td>
                      <Link
                        className={styles.secondaryButton}
                        href={`/barangay-affairs/documents/requests/${document.id}`}
                      >
                        Open request
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
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
          <h1>Document request not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/documents/requests">
            Return to requests
          </Link>
        </div>
      </div>
    );
  const resident = residents.find((item) => item.id === document.residentId);
  const template = templates.find((item) => item.code === document.templateCode);
  const barangay = MATNOG_BARANGAYS.find((item) => item.code === document.barangayId);
  const move = (status: IssuedDocumentStatus, actor?: string) => {
    const value = updateStatus(document.id, status, note, actor);
    setMessage(value ? `Request moved to ${status}.` : "Enter a review note before continuing.");
  };
  return (
    <div className={styles.page}>
      {message && <div className={styles.toast}>{message}</div>}
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A4 Document Request</p>
          <h1>{document.controlNumber}</h1>
          <p>
            {template?.name} · {resident ? formatResidentName(resident) : "Unknown resident"}
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/documents/requests">
          <ArrowLeft size={15} /> Requests
        </Link>
      </header>
      <div className={styles.detailGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Request information</p>
              <h2>Resident and document details</h2>
            </div>
            <span className={`${styles.badge} ${badge(document.status)}`}>{document.status}</span>
          </div>
          <dl className={styles.dataList}>
            <div className={styles.dataRow}>
              <dt>Resident</dt>
              <dd>
                {resident ? formatResidentName(resident) : "Unknown"} · {resident?.lrn}
              </dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Barangay</dt>
              <dd>{barangay?.name}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Document</dt>
              <dd>{template?.name}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Purpose</dt>
              <dd>{document.purpose}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Issue date</dt>
              <dd>{document.issueDate}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Signatories</dt>
              <dd>
                {document.barangaySecretary} / {document.punongBarangay}
              </dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Payment</dt>
              <dd>
                {template?.requiresOr
                  ? `${document.paymentVerified ? "Verified" : "Pending"} · ${document.officialReceipt || "No O.R."} · ₱${document.amountPaid.toFixed(2)}`
                  : "No fee required"}
              </dd>
            </div>
            {document.releasedAt && (
              <div className={styles.dataRow}>
                <dt>Released</dt>
                <dd>
                  {new Date(document.releasedAt).toLocaleString("en-PH")} to {document.releasedTo}
                </dd>
              </div>
            )}
          </dl>
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Workflow controls</p>
              <h2>Next action</h2>
            </div>
          </div>
          {!["Released", "Revoked"].includes(document.status) && (
            <label className={styles.field}>
              <span>Review or decision note</span>
              <textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
          )}
          <div className={documentStyles.workflowActions}>
            {document.status === "Draft" && (
              <button className={styles.primaryButton} type="button" onClick={() => move("Pending Review")}>
                <Send size={15} /> Submit for review
              </button>
            )}
            {document.status === "Pending Review" && (
              <>
                <button
                  className={styles.primaryButton}
                  type="button"
                  onClick={() => move("For Approval", "Barangay Secretary")}
                >
                  <ClipboardCheck size={15} /> Complete review
                </button>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => move("Rejected", "Barangay Secretary")}
                >
                  <XCircle size={15} /> Reject
                </button>
              </>
            )}
            {document.status === "For Approval" && (
              <>
                <button
                  className={styles.primaryButton}
                  type="button"
                  onClick={() => move("Ready for Release", "Punong Barangay")}
                >
                  <BadgeCheck size={15} /> Approve document
                </button>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => move("Rejected", "Punong Barangay")}
                >
                  <XCircle size={15} /> Reject
                </button>
              </>
            )}
            {document.status === "Rejected" && (
              <button className={styles.primaryButton} type="button" onClick={() => move("Draft")}>
                <FileBadge2 size={15} /> Return to draft
              </button>
            )}
          </div>
          {document.status === "Ready for Release" && (
            <>
              {template?.requiresOr && !document.paymentVerified ? (
                <div className={documentStyles.paymentBox}>
                  <h3>
                    <Banknote size={16} /> Verify payment
                  </h3>
                  <label className={styles.field}>
                    <span>Official receipt</span>
                    <input value={receipt} onChange={(event) => setReceipt(event.target.value)} />
                  </label>
                  <label className={styles.field}>
                    <span>Amount paid</span>
                    <input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} />
                  </label>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={() => {
                      const value = verifyPayment(document.id, receipt, Number(amount) || 0);
                      setMessage(value ? "Payment verified." : "Enter an official receipt number.");
                    }}
                  >
                    Verify payment
                  </button>
                </div>
              ) : null}
              {(!template?.requiresOr || document.paymentVerified) && (
                <div className={documentStyles.paymentBox}>
                  <h3>
                    <PackageCheck size={16} /> Release document
                  </h3>
                  <label className={styles.field}>
                    <span>Released to</span>
                    <input
                      value={releasedTo}
                      onChange={(event) => setReleasedTo(event.target.value)}
                      placeholder="Resident or authorized representative"
                    />
                  </label>
                  <button
                    className={styles.primaryButton}
                    type="button"
                    onClick={() => {
                      const value = releaseDocument(document.id, releasedTo, note);
                      setMessage(value ? "Document released successfully." : "Complete the claimant and release note.");
                    }}
                  >
                    <CheckCircle2 size={15} /> Confirm release
                  </button>
                </div>
              )}
            </>
          )}
          {document.status === "Released" && (
            <>
              <div className={documentStyles.completedPanel}>
                <CheckCircle2 size={26} />
                <strong>Document released</strong>
                <span>{document.releasedTo}</span>
                <Link className={styles.secondaryButton} href={`/verify/document/${document.verificationToken}`}>
                  <QrCode size={14} /> Public verification
                </Link>
              </div>
              <div className={documentStyles.paymentBox}>
                <h3>
                  <Printer size={16} /> Request a controlled reprint
                </h3>
                <label className={styles.field}>
                  <span>Requested by</span>
                  <input value={requestedBy} onChange={(event) => setRequestedBy(event.target.value)} />
                </label>
                <label className={styles.field}>
                  <span>Reason</span>
                  <textarea rows={3} value={reprintReason} onChange={(event) => setReprintReason(event.target.value)} />
                </label>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => {
                    const value = requestReprint(document.id, reprintReason, requestedBy);
                    setMessage(value ? "Reprint request submitted." : "Complete the requester and reason.");
                  }}
                >
                  <Printer size={14} /> Submit reprint request
                </button>
              </div>
              <div className={documentStyles.paymentBox}>
                <h3>
                  <XCircle size={16} /> Revoke document
                </h3>
                <label className={styles.field}>
                  <span>Revocation reason</span>
                  <textarea
                    rows={3}
                    value={revocationReason}
                    onChange={(event) => setRevocationReason(event.target.value)}
                  />
                </label>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => {
                    const value = revokeDocument(document.id, revocationReason);
                    setMessage(
                      value
                        ? "Document revoked. Public verification now reports it as invalid."
                        : "Enter a revocation reason.",
                    );
                  }}
                >
                  <XCircle size={14} /> Confirm revocation
                </button>
              </div>
            </>
          )}
          {document.status === "Revoked" && (
            <div className={documentStyles.completedPanel}>
              <XCircle size={26} />
              <strong>Document revoked</strong>
              <span>{document.reviewNote}</span>
              <Link className={styles.secondaryButton} href={`/verify/document/${document.verificationToken}`}>
                <QrCode size={14} /> View public status
              </Link>
            </div>
          )}
        </aside>
      </div>
      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Accountability record</p>
            <h2>Audit timeline</h2>
          </div>
          <span className={`${styles.badge} ${styles.info}`}>{document.auditTrail.length} events</span>
        </div>
        <div className={documentStyles.auditTimeline}>
          {[...document.auditTrail].reverse().map((event) => (
            <article key={event.id}>
              <span />
              <div>
                <strong>{event.action}</strong>
                <p>{event.note}</p>
                <small>
                  {event.actor} · {new Date(event.occurredAt).toLocaleString("en-PH")}
                </small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
