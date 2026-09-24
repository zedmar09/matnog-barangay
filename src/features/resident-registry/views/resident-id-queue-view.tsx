"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  PackageCheck,
  Plus,
  Printer,
  Search,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
import type { ResidentIdStatus } from "../types/resident";
import { formatResidentName } from "../utils/resident-utils";

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
  if (status === "Generated") return styles.info;
  if (status === "Printed" || status === "Pending Generation") return styles.warning;
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
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<string[]>([]);
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
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const visibleIds = visibleRows.map((card) => card.id);
  const selectedVisibleCount = visibleIds.filter((id) => selected.includes(id)).length;
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    setSelected([]);
  };

  const updateStatus = (value: string) => {
    setStatus(value === "__all__" ? "" : (value as ResidentIdStatus));
    setPage(1);
    setSelected([]);
  };

  const toggleVisible = (checked: boolean) => {
    setSelected((current) =>
      checked ? Array.from(new Set([...current, ...visibleIds])) : current.filter((id) => !visibleIds.includes(id)),
    );
  };

  const processBatch = (nextStatus: "Printed" | "Released") => {
    const eligibleIds = selected.filter((id) => {
      const card = cards.find((item) => item.id === id);
      return nextStatus === "Printed" ? card?.status === "Generated" : card?.status === "Printed";
    });
    if (!eligibleIds.length) {
      setMessage(`Select at least one ${nextStatus === "Printed" ? "generated" : "printed"} card.`);
      return;
    }
    const count = batchUpdate(eligibleIds, nextStatus, "Batch card processing");
    setSelected([]);
    setMessage(`${count} card${count === 1 ? "" : "s"} marked as ${nextStatus.toLowerCase()}.`);
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <h1>Resident IDs</h1>
            <p>Generate, print, release, replace, and verify municipal resident ID cards.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href="/barangay-affairs/residents/ids/generate">
              <Plus size={16} /> Generate ID
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.body}>
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
                onChange={(event) => updateSearch(event.target.value)}
              />
            </label>
            <Select value={status || "__all__"} onValueChange={updateStatus}>
              <SelectTrigger className={styles.compactSelect} aria-label="Resident ID status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="__all__">All statuses</SelectItem>
                {statuses.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selected.length ? (
            <div className={styles.batchBar}>
              <strong>{selected.length} selected</strong>
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
            <span>Select cards to record a batch print or release action.</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table} style={{ minWidth: 1120 }}>
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: "center" }}>
                    <Checkbox
                      aria-label="Select all cards on this page"
                      checked={allVisibleSelected}
                      indeterminate={someVisibleSelected}
                      onCheckedChange={toggleVisible}
                    />
                  </th>
                  <th>Card No.</th>
                  <th>Resident</th>
                  <th>Barangay</th>
                  <th>Issued</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Printed / Released</th>
                  <th style={{ width: 48, textAlign: "center" }} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((card) => {
                  const resident = residents.find((item) => item.id === card.residentId);
                  if (!resident) return null;
                  return (
                    <tr key={card.id}>
                      <td style={{ textAlign: "center" }}>
                        <Checkbox
                          aria-label={`Select ${card.cardNumber}`}
                          checked={selected.includes(card.id)}
                          onCheckedChange={(checked) =>
                            setSelected((current) =>
                              checked ? [...current, card.id] : current.filter((id) => id !== card.id),
                            )
                          }
                        />
                      </td>
                      <td className={styles.mono}>{card.cardNumber}</td>
                      <td>
                        <div className={styles.nameCell}>
                          <Link href={`/barangay-affairs/residents/${resident.id}`}>
                            {formatResidentName(resident)}
                          </Link>
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
                      <td style={{ textAlign: "center" }}>
                        <Link
                          className={styles.iconAction}
                          href={`/barangay-affairs/residents/ids/${card.id}`}
                          title="View resident ID"
                          aria-label={`View ${card.cardNumber}`}
                        >
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={styles.pagination}>
            <span>Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
                setSelected([]);
              }}
            >
              <SelectTrigger className={styles.compactSelect} aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {[25, 50, 100].map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              {rows.length ? (safePage - 1) * pageSize + 1 : 0}–{Math.min(safePage * pageSize, rows.length)} of{" "}
              {rows.length}
            </span>
            <button
              type="button"
              aria-label="Previous page"
              disabled={safePage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              aria-label="Next page"
              disabled={safePage === totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
