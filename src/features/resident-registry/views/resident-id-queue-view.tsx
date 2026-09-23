"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { BadgeCheck, ChevronLeft, ChevronRight, CreditCard, PackageCheck, Plus, Printer, Search } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
import type { ResidentIdStatus } from "../types/resident";
import { formatResidentName } from "../utils/resident-utils";

const PAGE_SIZE = 25;
const statuses: ResidentIdStatus[] = [
  "Pending Generation",
  "Generated",
  "Printed",
  "Released",
  "Expired",
  "Revoked",
  "Lost",
  "Replaced",
];

function statusClass(status: ResidentIdStatus) {
  if (status === "Released") return styles.active;
  if (status === "Expired" || status === "Revoked" || status === "Lost") return styles.danger;
  if (status === "Printed" || status === "Generated" || status === "Pending Generation") return styles.warning;
  return "";
}

export function ResidentIdQueueView() {
  const cards = useResidentRegistryStore((state) => state.residentIds);
  const residents = useResidentRegistryStore((state) => state.residents);
  const batchUpdate = useResidentRegistryStore((state) => state.batchUpdateResidentIds);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ResidentIdStatus | "">("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [reason, setReason] = useState("Batch card processing");
  const [message, setMessage] = useState("");

  const rows = useMemo(
    () =>
      cards.filter((card) => {
        const resident = residents.find((item) => item.id === card.residentId);
        if (!resident) return false;
        if (selectedBarangay !== "all" && card.barangayId !== selectedBarangay) return false;
        if (status && card.status !== status) return false;
        const haystack = `${card.cardNumber} ${resident.lrn} ${formatResidentName(resident)}`.toLowerCase();
        return !search.trim() || haystack.includes(search.trim().toLowerCase());
      }),
    [cards, residents, search, selectedBarangay, status],
  );
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const visibleIds = visibleRows.map((card) => card.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  const processBatch = (nextStatus: "Printed" | "Released") => {
    const eligibleIds = selected.filter((id) => {
      const card = cards.find((item) => item.id === id);
      return nextStatus === "Printed" ? card?.status === "Generated" : card?.status === "Printed";
    });
    if (!reason.trim() || !eligibleIds.length) {
      setMessage(`Select at least one ${nextStatus === "Printed" ? "generated" : "printed"} card and enter a reason.`);
      return;
    }
    const count = batchUpdate(eligibleIds, nextStatus, reason);
    setSelected([]);
    setMessage(`${count} card${count === 1 ? "" : "s"} marked as ${nextStatus.toLowerCase()}.`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A1 Resident Registry</p>
          <h1>Resident IDs</h1>
          <p>Generate, print, release, replace, and verify municipal resident ID cards.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/residents/ids/generate">
          <Plus size={15} /> Generate ID
        </Link>
      </header>

      {message ? <div className={styles.toast}>{message}</div> : null}

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CreditCard size={18} />
          </span>
          <div>
            <strong>{cards.length}</strong>
            <span>Total card records</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <BadgeCheck size={18} />
          </span>
          <div>
            <strong>{cards.filter((card) => card.status === "Released").length}</strong>
            <span>Released and active</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Printer size={18} />
          </span>
          <div>
            <strong>{cards.filter((card) => card.status === "Printed").length}</strong>
            <span>Ready for release</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <PackageCheck size={18} />
          </span>
          <div>
            <strong>{cards.filter((card) => card.status === "Pending Generation").length}</strong>
            <span>Pending generation</span>
          </div>
        </div>
      </div>

      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search resident ID cards"
              placeholder="Search card number, resident, or LRN"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
                setSelected([]);
              }}
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="Resident ID status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ResidentIdStatus | "");
              setPage(1);
              setSelected([]);
            }}
          >
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>

        {selected.length ? (
          <div className={styles.batchBar}>
            <strong>{selected.length} selected</strong>
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              aria-label="Batch action reason"
            />
            <button className={styles.secondaryButton} type="button" onClick={() => processBatch("Printed")}>
              <Printer size={14} /> Mark printed
            </button>
            <button className={styles.primaryButton} type="button" onClick={() => processBatch("Released")}>
              <PackageCheck size={14} /> Mark released
            </button>
          </div>
        ) : null}

        <div className={styles.resultsMeta}>
          <strong>{rows.length} resident ID records</strong>
          <span>
            Showing {rows.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, rows.length)}
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1120 }}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select visible cards"
                    checked={allVisibleSelected}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? Array.from(new Set([...current, ...visibleIds]))
                          : current.filter((id) => !visibleIds.includes(id)),
                      )
                    }
                  />
                </th>
                <th>Card No.</th>
                <th>Resident</th>
                <th>Barangay</th>
                <th>Issued</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Printed / Released</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((card) => {
                const resident = residents.find((item) => item.id === card.residentId);
                if (!resident) return null;
                return (
                  <tr key={card.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${card.cardNumber}`}
                        checked={selected.includes(card.id)}
                        onChange={(event) =>
                          setSelected((current) =>
                            event.target.checked ? [...current, card.id] : current.filter((id) => id !== card.id),
                          )
                        }
                      />
                    </td>
                    <td className={styles.mono}>{card.cardNumber}</td>
                    <td>
                      <div className={styles.nameCell}>
                        <Link href={`/barangay-affairs/residents/${resident.id}`}>{formatResidentName(resident)}</Link>
                        <small>{resident.lrn}</small>
                      </div>
                    </td>
                    <td>{MATNOG_BARANGAYS.find((item) => item.code === card.barangayId)?.name ?? "—"}</td>
                    <td>{card.issueDate}</td>
                    <td>{card.expirationDate}</td>
                    <td>
                      <span className={`${styles.badge} ${statusClass(card.status)}`}>{card.status}</span>
                    </td>
                    <td>
                      {card.releasedAt
                        ? `Released ${new Date(card.releasedAt).toLocaleDateString("en-PH")}`
                        : card.printedAt
                          ? `Printed ${new Date(card.printedAt).toLocaleDateString("en-PH")}`
                          : "Awaiting print"}
                    </td>
                    <td>
                      <Link className={styles.secondaryButton} href={`/barangay-affairs/residents/ids/${card.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.pagination}>
          <span>
            Page {page} of {pages}
          </span>
          <button
            type="button"
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => setPage((value) => value - 1)}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            aria-label="Next page"
            disabled={page === pages}
            onClick={() => setPage((value) => value + 1)}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}
