"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { CheckCircle2, FileWarning, Printer, QrCode, Search, ShieldCheck, XCircle } from "lucide-react";
import QRCode from "qrcode";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useDocumentStore } from "../stores/document-store";
import documentStyles from "./document-issuance.module.css";

function statusClass(status: string) {
  return status === "Released" || status === "Printed" || status === "Approved"
    ? styles.active
    : status === "Revoked" || status === "Rejected"
      ? styles.danger
      : styles.warning;
}

export function ReprintRequestsView() {
  const requests = useDocumentStore((state) => state.reprintRequests);
  const documents = useDocumentStore((state) => state.documents);
  const templates = useDocumentStore((state) => state.templates);
  const update = useDocumentStore((state) => state.updateReprintStatus);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay } = useBarangayScope();
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const rows = requests.filter((request) => {
    const document = documents.find((item) => item.id === request.documentId);
    return (
      document &&
      (selectedBarangay === "all" || document.barangayId === selectedBarangay) &&
      (!status || request.status === status)
    );
  });
  return (
    <div className={styles.page}>
      {message && <div className={styles.toast}>{message}</div>}
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A4 Document Controls</p>
          <h1>Reprint Requests</h1>
          <p>Controlled replacement and additional-copy requests with approval and print accountability.</p>
        </div>
      </header>
      <div className={styles.summaryGrid}>
        {["Pending", "Approved", "Printed", "Rejected"].map((value) => (
          <div className={styles.summaryCard} key={value}>
            <span className={styles.summaryIcon}>
              <Printer size={18} />
            </span>
            <div>
              <strong>{requests.filter((item) => item.status === value).length}</strong>
              <span>{value}</span>
            </div>
          </div>
        ))}
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <select
            className={styles.compactSelect}
            aria-label="Reprint status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {["Pending", "Approved", "Printed", "Rejected"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} reprint requests</strong>
          <span>Original control numbers are retained</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th>Document</th>
                <th>Resident</th>
                <th>Barangay</th>
                <th>Type</th>
                <th>Requested by</th>
                <th>Reason</th>
                <th>Requested</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((request) => {
                const document = documents.find((item) => item.id === request.documentId);
                const resident = residents.find((item) => item.id === document?.residentId);
                const template = templates.find((item) => item.code === document?.templateCode);
                return (
                  <tr key={request.id}>
                    <td className={styles.mono}>{document?.controlNumber}</td>
                    <td>{resident ? formatResidentName(resident) : "Unknown"}</td>
                    <td>{MATNOG_BARANGAYS.find((item) => item.code === document?.barangayId)?.name}</td>
                    <td>{template?.name}</td>
                    <td>{request.requestedBy}</td>
                    <td>{request.reason}</td>
                    <td>{new Date(request.requestedAt).toLocaleDateString("en-PH")}</td>
                    <td>
                      <span className={`${styles.badge} ${statusClass(request.status)}`}>{request.status}</span>
                    </td>
                    <td>
                      {request.status === "Pending" ? (
                        <div className={styles.headerButtonGroup}>
                          <button
                            className={styles.primaryButton}
                            type="button"
                            onClick={() => {
                              update(request.id, "Approved", "Barangay Secretary");
                              setMessage("Reprint request approved.");
                            }}
                          >
                            Approve
                          </button>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => {
                              update(request.id, "Rejected", "Barangay Secretary");
                              setMessage("Reprint request rejected.");
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : request.status === "Approved" ? (
                        <button
                          className={styles.primaryButton}
                          type="button"
                          onClick={() => {
                            update(request.id, "Printed", "Document Releasing Officer");
                            setMessage("Reprint marked as produced.");
                          }}
                        >
                          <Printer size={14} /> Mark printed
                        </button>
                      ) : (
                        <Link
                          className={styles.secondaryButton}
                          href={`/barangay-affairs/documents/requests/${document?.id}`}
                        >
                          Open
                        </Link>
                      )}
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

export function RevocationsView() {
  const revocations = useDocumentStore((state) => state.revocations);
  const documents = useDocumentStore((state) => state.documents);
  const templates = useDocumentStore((state) => state.templates);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay } = useBarangayScope();
  const rows = revocations.filter((record) => {
    const document = documents.find((item) => item.id === record.documentId);
    return document && (selectedBarangay === "all" || document.barangayId === selectedBarangay);
  });
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A4 Document Controls</p>
          <h1>Revoked Documents</h1>
          <p>Invalidated documents remain traceable and return a revoked result during verification.</p>
        </div>
      </header>
      <section className={styles.card}>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} revocations</strong>
          <span>Records cannot be deleted</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 950 }}>
            <thead>
              <tr>
                <th>Control No.</th>
                <th>Resident</th>
                <th>Document</th>
                <th>Barangay</th>
                <th>Reason</th>
                <th>Revoked</th>
                <th>Authority</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((record) => {
                const document = documents.find((item) => item.id === record.documentId);
                const resident = residents.find((item) => item.id === document?.residentId);
                const template = templates.find((item) => item.code === document?.templateCode);
                return (
                  <tr key={record.id}>
                    <td className={styles.mono}>{document?.controlNumber}</td>
                    <td>{resident ? formatResidentName(resident) : "Unknown"}</td>
                    <td>{template?.name}</td>
                    <td>{MATNOG_BARANGAYS.find((item) => item.code === document?.barangayId)?.name}</td>
                    <td>{record.reason}</td>
                    <td>{new Date(record.revokedAt).toLocaleString("en-PH")}</td>
                    <td>{record.revokedBy}</td>
                    <td>
                      <Link className={styles.secondaryButton} href={`/verify/document/${document?.verificationToken}`}>
                        Status page
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

export function DocumentVerificationView() {
  const documents = useDocumentStore((state) => state.documents);
  const templates = useDocumentStore((state) => state.templates);
  const [search, setSearch] = useState("");
  const document = search.trim()
    ? documents.find((item) => item.controlNumber.toLowerCase() === search.trim().toLowerCase())
    : undefined;
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A4 Verification Console</p>
          <h1>Document Verification</h1>
          <p>Check a control number and open its public status-only verification result.</p>
        </div>
      </header>
      <section className={styles.card}>
        <div className={documentStyles.verificationSearch}>
          <label className={styles.searchBox}>
            <Search size={16} />
            <input
              aria-label="Document control number"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Enter exact control number, e.g. BCL-2026-000001"
            />
          </label>
        </div>
        {search.trim() && !document ? (
          <div className={documentStyles.verifyEmpty}>
            <QrCode size={25} />
            <strong>No matching document</strong>
            <span>Check the complete control number and try again.</span>
          </div>
        ) : null}
        {document ? (
          <div className={documentStyles.verifyResult}>
            <span className={`${styles.badge} ${statusClass(document.status)}`}>{document.status}</span>
            <h2>{document.controlNumber}</h2>
            <p>{templates.find((item) => item.code === document.templateCode)?.name}</p>
            <dl className={styles.dataList}>
              <div className={styles.dataRow}>
                <dt>Issued</dt>
                <dd>{document.issueDate}</dd>
              </div>
              <div className={styles.dataRow}>
                <dt>Issuing barangay</dt>
                <dd>{MATNOG_BARANGAYS.find((item) => item.code === document.barangayId)?.name}, Matnog</dd>
              </div>
              <div className={styles.dataRow}>
                <dt>Verification token</dt>
                <dd className={styles.mono}>{document.verificationToken}</dd>
              </div>
            </dl>
            <Link className={styles.primaryButton} href={`/verify/document/${document.verificationToken}`}>
              <ShieldCheck size={15} /> Open public result
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function PublicDocumentVerificationView({ token }: { token: string }) {
  const documents = useDocumentStore((state) => state.documents);
  const templates = useDocumentStore((state) => state.templates);
  const document = documents.find((item) => item.verificationToken === token);
  const [qrUrl, setQrUrl] = useState("");
  useEffect(() => {
    void QRCode.toDataURL(`http://localhost:3010/verify/document/${token}`, { width: 180, margin: 1 }).then(setQrUrl);
  }, [token]);
  const valid = document?.status === "Released";
  return (
    <main className={documentStyles.publicVerifyPage}>
      <section className={documentStyles.publicVerifyCard}>
        <div className={documentStyles.publicVerifyBrand}>
          <span>MATNOG BRGYS</span>
          <small>Official Document Verification</small>
        </div>
        {qrUrl ? (
          <Image src={qrUrl} alt="Document verification QR code" width={150} height={150} unoptimized />
        ) : (
          <QrCode size={120} />
        )}
        {!document ? (
          <>
            <XCircle className={documentStyles.invalidIcon} size={42} />
            <h1>Document not found</h1>
            <p>The verification token does not match an issued Matnog barangay document.</p>
          </>
        ) : (
          <>
            <div className={valid ? documentStyles.validSeal : documentStyles.invalidSeal}>
              {valid ? <CheckCircle2 size={28} /> : <FileWarning size={28} />}
              <span>{valid ? "VALID" : "NOT VALID"}</span>
            </div>
            <h1>{document.controlNumber}</h1>
            <p>
              {document.status === "Revoked"
                ? "This document has been revoked by the issuing barangay."
                : valid
                  ? "This document is recorded as released and valid."
                  : `This document is currently marked ${document.status}.`}
            </p>
            <dl>
              <div>
                <dt>Document type</dt>
                <dd>{templates.find((item) => item.code === document.templateCode)?.name}</dd>
              </div>
              <div>
                <dt>Issuing office</dt>
                <dd>
                  Barangay {MATNOG_BARANGAYS.find((item) => item.code === document.barangayId)?.name}, Matnog, Sorsogon
                </dd>
              </div>
              <div>
                <dt>Issue date</dt>
                <dd>{document.issueDate}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{document.status}</dd>
              </div>
            </dl>
          </>
        )}
        <small className={documentStyles.privacyNote}>
          For privacy, this page confirms document status only and does not display resident information.
        </small>
      </section>
    </main>
  );
}
