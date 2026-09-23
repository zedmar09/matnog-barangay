"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowRight, CheckCircle2, Clock3, FileBadge2, Files, Printer, Search } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useDocumentStore } from "../stores/document-store";
import documentStyles from "./document-issuance.module.css";

export function DocumentDashboardView() {
  const templates = useDocumentStore((state) => state.templates);
  const documents = useDocumentStore((state) => state.documents);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const scoped = documents.filter(
    (document) =>
      (selectedBarangay === "all" || document.barangayId === selectedBarangay) &&
      (!status || document.status === status) &&
      (() => {
        const resident = residents.find((item) => item.id === document.residentId);
        return (
          !search.trim() ||
          `${document.controlNumber} ${resident ? formatResidentName(resident) : ""} ${resident?.lrn ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
        );
      })(),
  );
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A4 Certifications & Clearances</p>
          <h1>Document Issuance</h1>
          <p>Select a template, choose a resident, review the populated fields, then print or save the document.</p>
        </div>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Files size={18} />
          </span>
          <div>
            <strong>{templates.length}</strong>
            <span>Document templates</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <FileBadge2 size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>{selectedBarangayName} records</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Clock3 size={18} />
          </span>
          <div>
            <strong>
              {
                scoped.filter(
                  (item) =>
                    item.status === "For Approval" || item.status === "Pending Review" || item.status === "Draft",
                ).length
              }
            </strong>
            <span>Need review</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CheckCircle2 size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.status === "Released").length}</strong>
            <span>Released documents</span>
          </div>
        </div>
      </div>
      <div className={documentStyles.templateGrid}>
        {templates.map((template) => (
          <Link
            className={documentStyles.templateCard}
            href={`/barangay-affairs/documents/new/${template.code}`}
            key={template.code}
          >
            <div className={documentStyles.templateTop}>
              <span className={documentStyles.templateIcon}>
                <FileBadge2 size={21} />
              </span>
              <span className={documentStyles.templateCode}>{template.shortCode}</span>
            </div>
            <h2>{template.name}</h2>
            <p>{template.description}</p>
            <span className={documentStyles.openTemplate}>
              Use template <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>
      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Document register</p>
            <h2>Recent documents</h2>
          </div>
          <span className={`${styles.badge} ${styles.info}`}>{scoped.length} records</span>
        </div>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search documents"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search control number, resident, or LRN"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="Document status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {["Draft", "Pending Review", "For Approval", "Ready for Release", "Released", "Rejected", "Revoked"].map(
              (item) => (
                <option key={item}>{item}</option>
              ),
            )}
          </select>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1050 }}>
            <thead>
              <tr>
                <th>Control No.</th>
                <th>Document</th>
                <th>Resident</th>
                <th>Barangay</th>
                <th>Purpose</th>
                <th>Issue date</th>
                <th>Status</th>
                <th>Reprints</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {scoped.slice(0, 25).map((document) => {
                const template = templates.find((item) => item.code === document.templateCode);
                const resident = residents.find((item) => item.id === document.residentId);
                return (
                  <tr key={document.id}>
                    <td className={styles.mono}>{document.controlNumber}</td>
                    <td>
                      <strong>{template?.name}</strong>
                    </td>
                    <td>
                      {resident ? formatResidentName(resident) : "Unknown"}
                      <br />
                      <small>{resident?.lrn}</small>
                    </td>
                    <td>{MATNOG_BARANGAYS.find((item) => item.code === document.barangayId)?.name}</td>
                    <td>{document.purpose}</td>
                    <td>{document.issueDate}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${document.status === "Released" ? styles.active : document.status === "Revoked" ? styles.danger : styles.warning}`}
                      >
                        {document.status}
                      </span>
                    </td>
                    <td>
                      {document.reprintCount ? (
                        <>
                          <Printer size={13} /> {document.reprintCount}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <Link
                        className={styles.secondaryButton}
                        href={`/barangay-affairs/documents/requests/${document.id}`}
                      >
                        Open
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
