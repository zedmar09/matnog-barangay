"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Baby, CheckCircle2, Clock3, FileClock, HeartHandshake, Plus, Search } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
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
export function LifeEventQueueView() {
  const events = useResidentRegistryStore((s) => s.lifeEvents);
  const residents = useResidentRegistryStore((s) => s.residents);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const residentName = (id: string) => {
    const r = residents.find((x) => x.id === id);
    return r ? formatResidentName(r) : "New resident registration";
  };
  const barangay = (id: string) => MATNOG_BARANGAYS.find((b) => b.code === id)?.name ?? "—";
  const rows = useMemo(
    () =>
      events.filter((e) => {
        if (selectedBarangay !== "all" && e.barangayId !== selectedBarangay) return false;
        if (status && e.status !== status) return false;
        if (type && e.eventType !== type) return false;
        const r = residents.find((x) => x.id === e.residentId);
        const hay =
          `${e.referenceNumber} ${r ? formatResidentName(r) : ""} ${r?.lrn ?? ""} ${e.details.proposedFirstName} ${e.details.proposedLastName}`.toLowerCase();
        return !search || hay.includes(search.toLowerCase());
      }),
    [events, residents, selectedBarangay, status, type, search],
  );
  const pending = events.filter((e) => e.status === "Pending Review").length;
  const approved = events.filter((e) => e.status === "Approved").length;
  const births = events.filter((e) => e.eventType === "Birth").length;
  const clarifications = events.filter((e) => e.status === "Clarification Requested").length;
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A1 Resident Registry</p>
          <h1>Life Events</h1>
          <p>Record and review civil events without losing the resident’s historical identity information.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/residents/life-events/new">
          <Plus size={15} /> Record life event
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Clock3 size={18} />
          </span>
          <div>
            <strong>{pending}</strong>
            <span>Pending review</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CheckCircle2 size={18} />
          </span>
          <div>
            <strong>{approved}</strong>
            <span>Approved events</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Baby size={18} />
          </span>
          <div>
            <strong>{births}</strong>
            <span>Birth registrations</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <FileClock size={18} />
          </span>
          <div>
            <strong>{clarifications}</strong>
            <span>Need clarification</span>
          </div>
        </div>
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search life events"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search event number, resident, or LRN"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="Life event type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All event types</option>
            {["Birth", "Death", "Marriage", "Civil Status Change", "Migration In", "Migration Out"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            className={styles.compactSelect}
            aria-label="Life event status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {["Pending Review", "Approved", "Rejected", "Clarification Requested", "Cancelled"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} life-event records</strong>
          <span>Birth, civil status, vital status, and migration events</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1200 }}>
            <thead>
              <tr>
                <th>Event No.</th>
                <th>Resident / Subject</th>
                <th>Event Type</th>
                <th>Effective Date</th>
                <th>Barangay</th>
                <th>Documents</th>
                <th>Status</th>
                <th>Recorded By</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const r = residents.find((x) => x.id === e.residentId);
                const subject =
                  e.eventType === "Birth" && !r
                    ? [e.details.proposedLastName, e.details.proposedFirstName, e.details.proposedMiddleName]
                        .filter(Boolean)
                        .join(", ")
                    : residentName(e.residentId);
                return (
                  <tr key={e.id}>
                    <td className={styles.mono}>{e.referenceNumber}</td>
                    <td>
                      <div className={styles.nameCell}>
                        {r ? (
                          <Link href={`/barangay-affairs/residents/${r.id}`}>{subject}</Link>
                        ) : (
                          <strong>{subject}</strong>
                        )}
                        <small>{r?.lrn ?? "LRN generated after approval"}</small>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${e.eventType === "Death" ? styles.danger : e.eventType === "Birth" ? styles.info : ""}`}
                      >
                        {e.eventType}
                      </span>
                    </td>
                    <td>{e.effectiveDate}</td>
                    <td>{barangay(e.barangayId)}</td>
                    <td>{e.supportingDocumentCount}</td>
                    <td>
                      <span className={`${styles.badge} ${statusClass(e.status)}`}>{e.status}</span>
                    </td>
                    <td>{e.requestedBy}</td>
                    <td>{new Date(e.updatedAt).toLocaleDateString("en-PH")}</td>
                    <td>
                      <Link className={styles.secondaryButton} href={`/barangay-affairs/residents/life-events/${e.id}`}>
                        {e.status === "Pending Review" || e.status === "Clarification Requested" ? "Review" : "View"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className={styles.empty}>
            <div>
              <HeartHandshake size={28} />
              <h3>No life events found</h3>
              <p>Adjust the search, event type, or status filter.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
