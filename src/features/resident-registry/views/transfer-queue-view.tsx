"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock3, MoveRight, Plus, Search } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
import { formatResidentName } from "../utils/resident-utils";

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
export function TransferQueueView() {
  const transfers = useResidentRegistryStore((s) => s.transfers);
  const residents = useResidentRegistryStore((s) => s.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [direction, setDirection] = useState<"all" | "incoming" | "outgoing">("all");
  const name = (id: string) => {
    const r = residents.find((x) => x.id === id);
    return r ? formatResidentName(r) : "Unknown resident";
  };
  const barangay = (id: string) => MATNOG_BARANGAYS.find((b) => b.code === id)?.name ?? "—";
  const rows = useMemo(
    () =>
      transfers.filter((t) => {
        if (
          selectedBarangay !== "all" &&
          t.originBarangayId !== selectedBarangay &&
          t.destinationBarangayId !== selectedBarangay
        )
          return false;
        if (status && t.status !== status) return false;
        if (direction === "incoming" && selectedBarangay !== "all" && t.destinationBarangayId !== selectedBarangay)
          return false;
        if (direction === "outgoing" && selectedBarangay !== "all" && t.originBarangayId !== selectedBarangay)
          return false;
        const resident = residents.find((r) => r.id === t.residentId);
        const hay =
          `${t.referenceNumber} ${resident ? formatResidentName(resident) : ""} ${resident?.lrn ?? ""}`.toLowerCase();
        return !search || hay.includes(search.toLowerCase());
      }),
    [transfers, residents, selectedBarangay, status, direction, search],
  );
  const requested = transfers.filter((t) => t.status === "Requested").length;
  const awaiting = transfers.filter((t) => t.status === "Awaiting Acceptance").length;
  const accepted = transfers.filter((t) => t.status === "Accepted").length;
  const actionNeeded = requested + awaiting + transfers.filter((t) => t.status === "Clarification Requested").length;
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A1 Residency Management</p>
          <h1>Inter-Barangay Transfers</h1>
          <p>Release residents from their origin barangay and activate residency only after destination acceptance.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/residents/transfers/new">
          <Plus size={15} /> Initiate transfer
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Clock3 size={18} />
          </span>
          <div>
            <strong>{actionNeeded}</strong>
            <span>Require action</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ArrowUpRight size={18} />
          </span>
          <div>
            <strong>{requested}</strong>
            <span>Awaiting origin release</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ArrowDownLeft size={18} />
          </span>
          <div>
            <strong>{awaiting}</strong>
            <span>Awaiting destination</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CheckCircle2 size={18} />
          </span>
          <div>
            <strong>{accepted}</strong>
            <span>Accepted transfers</span>
          </div>
        </div>
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search transfers"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transfer number, resident, or LRN"
            />
          </label>
          {selectedBarangay !== "all" && (
            <select
              className={styles.compactSelect}
              aria-label="Transfer direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value as typeof direction)}
            >
              <option value="all">Incoming & outgoing</option>
              <option value="incoming">Incoming to {selectedBarangayName}</option>
              <option value="outgoing">Outgoing from {selectedBarangayName}</option>
            </select>
          )}
          <select
            className={styles.compactSelect}
            aria-label="Transfer status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {["Requested", "Awaiting Acceptance", "Accepted", "Rejected", "Clarification Requested", "Cancelled"].map(
              (v) => (
                <option key={v}>{v}</option>
              ),
            )}
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} transfer transactions</strong>
          <span>
            {selectedBarangay === "all"
              ? "Municipality-wide view"
              : `${selectedBarangayName} incoming and outgoing records`}
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1250 }}>
            <thead>
              <tr>
                <th>Transfer No.</th>
                <th>Resident</th>
                <th>Origin</th>
                <th />
                <th>Destination</th>
                <th>Effective Date</th>
                <th>Reason</th>
                <th>Documents</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const resident = residents.find((r) => r.id === t.residentId);
                return (
                  <tr key={t.id}>
                    <td className={styles.mono}>{t.referenceNumber}</td>
                    <td>
                      <div className={styles.nameCell}>
                        <Link href={`/barangay-affairs/residents/${t.residentId}`}>{name(t.residentId)}</Link>
                        <small>{resident?.lrn}</small>
                      </div>
                    </td>
                    <td>{barangay(t.originBarangayId)}</td>
                    <td>
                      <MoveRight size={14} />
                    </td>
                    <td>{barangay(t.destinationBarangayId)}</td>
                    <td>{t.requestedEffectiveDate}</td>
                    <td>{t.reason}</td>
                    <td>{t.supportingDocumentCount}</td>
                    <td>
                      <span className={`${styles.badge} ${statusClass(t.status)}`}>{t.status}</span>
                    </td>
                    <td>{new Date(t.updatedAt).toLocaleDateString("en-PH")}</td>
                    <td>
                      <Link className={styles.secondaryButton} href={`/barangay-affairs/residents/transfers/${t.id}`}>
                        {["Requested", "Awaiting Acceptance", "Clarification Requested"].includes(t.status)
                          ? "Review"
                          : "View"}
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
              <MoveRight size={28} />
              <h3>No transfers found</h3>
              <p>Adjust the scope, search, or status filter.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
