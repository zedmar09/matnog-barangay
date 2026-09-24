"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Columns3,
  Download,
  Filter,
  MapPin,
  MoreHorizontal,
  Paperclip,
  Search,
  WalletCards,
  X,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { ASSISTANCE_TYPES } from "../data/assistance-data";
import { useAssistanceStore } from "../stores/assistance-store";
import type { AssistanceRecord, LiquidationStatus } from "../types/assistance";
import assistanceStyles from "./assistance.module.css";

const columns = [
  "assistance",
  "disbursement",
  "resident",
  "household",
  "barangay",
  "type",
  "fund",
  "office",
  "mode",
  "receipt",
  "disbursed",
  "liquidated",
  "balance",
  "documents",
  "status",
  "performedBy",
  "date",
  "remarks",
  "attachment",
  "actions",
] as const;
type Column = (typeof columns)[number];
type SortKey =
  | "assistance"
  | "disbursement"
  | "resident"
  | "barangay"
  | "type"
  | "disbursed"
  | "balance"
  | "status"
  | "date";
type Filters = {
  search: string;
  status: string;
  fund: string;
  barangayId: string;
  type: string;
  office: string;
  paymentMode: string;
  balance: string;
  performedBy: string;
  hasAttachment: string;
  amountMin: string;
  amountMax: string;
  dateFrom: string;
  dateTo: string;
};

const EMPTY_FILTERS: Filters = {
  search: "",
  status: "",
  fund: "",
  barangayId: "",
  type: "",
  office: "",
  paymentMode: "",
  balance: "",
  performedBy: "",
  hasAttachment: "",
  amountMin: "",
  amountMax: "",
  dateFrom: "",
  dateTo: "",
};
const labels: Record<Column, string> = {
  assistance: "Assistance",
  disbursement: "Disbursement",
  resident: "Resident",
  household: "Household",
  barangay: "Barangay",
  type: "Type",
  fund: "Fund Source",
  office: "Releasing Office",
  mode: "Payment Mode",
  receipt: "Receipt",
  disbursed: "Disbursed",
  liquidated: "Liquidated",
  balance: "Balance",
  documents: "Documents",
  status: "Liquidation Status",
  performedBy: "Performed By",
  date: "Liquidation Date",
  remarks: "Remarks",
  attachment: "Attachment",
  actions: "Actions",
};
const fixed = new Set<Column>(["disbursement", "resident", "actions"]);
const defaultHidden = new Set<Column>([
  "household",
  "barangay",
  "mode",
  "receipt",
  "documents",
  "performedBy",
  "remarks",
  "attachment",
]);
const sortable: Partial<Record<Column, SortKey>> = {
  assistance: "assistance",
  disbursement: "disbursement",
  resident: "resident",
  barangay: "barangay",
  type: "type",
  disbursed: "disbursed",
  balance: "balance",
  status: "status",
  date: "date",
};
const FINANCE_STAFF = [
  "Roberto G. Dela Cruz — Barangay Treasurer",
  "Ana P. Reyes — Barangay Secretary",
  "Liza M. Cruz — Assistance Desk Officer",
  "Elena D. Flores — Records Custodian",
  "Marites P. Ramos — Municipal Accounting Staff",
];

const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
const displayDate = (value: string) =>
  value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("en-PH") : "—";
const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

function liquidationClass(status: LiquidationStatus) {
  return status === "Liquidated" ? styles.active : status === "Partially Liquidated" ? styles.warning : styles.danger;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the reusable control is supplied directly or through children.
    <label className={styles.field}>
      <span>{label}</span>
      {children ?? (
        <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function FilterSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: Array<readonly [string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} value={value} onChange={onChange}>
      <Select value={value || "__all__"} onValueChange={(next) => onChange(next === "__all__" ? "" : next)}>
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{placeholder}</SelectItem>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function DisbursementView() {
  const records = useAssistanceStore((state) => state.records);
  const markLiquidated = useAssistanceStore((state) => state.markLiquidated);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangayName, isAllSelected, selectedBarangays } = useBarangayScope();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [more, setMore] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visible, setVisible] = useState<Set<Column>>(() => {
    const initial = new Set(columns as readonly Column[]);
    for (const column of defaultHidden) initial.delete(column);
    return initial;
  });
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [message, setMessage] = useState("");
  const [selectedItem, setSelectedItem] = useState<AssistanceRecord | null>(null);
  const [remarks, setRemarks] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  const scopedRows = useMemo(() => {
    const scope = new Set(selectedBarangays);
    return records
      .filter((record) => record.status === "Released" && (isAllSelected || scope.has(record.barangayId)))
      .map((record) => {
        const resident = residents.find((item) => item.id === record.residentId);
        return {
          record,
          resident,
          residentName: resident ? formatResidentName(resident) : "Resident record unavailable",
          barangayName: barangayName(record.barangayId),
          balance: record.amount - record.liquidatedAmount,
        };
      });
  }, [isAllSelected, records, residents, selectedBarangays]);

  const funds = useMemo(() => [...new Set(scopedRows.map(({ record }) => record.fundSource))].sort(), [scopedRows]);
  const offices = useMemo(
    () => [...new Set(scopedRows.map(({ record }) => record.releasingOffice))].sort(),
    [scopedRows],
  );
  const performers = useMemo(
    () => [...new Set(scopedRows.map(({ record }) => record.liquidatedBy).filter(Boolean))].sort(),
    [scopedRows],
  );

  const filtered = useMemo(() => {
    const rows = scopedRows.filter(({ record, resident, residentName, balance }) => {
      const query = filters.search.trim().toLowerCase();
      const haystack =
        `${record.referenceNumber} ${record.disbursementReference} ${residentName} ${resident?.lrn ?? ""} ${record.householdId} ${record.officialReceiptNumber}`.toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (filters.status && record.liquidationStatus !== filters.status) return false;
      if (filters.fund && record.fundSource !== filters.fund) return false;
      if (filters.barangayId && record.barangayId !== filters.barangayId) return false;
      if (filters.type && record.assistanceType !== filters.type) return false;
      if (filters.office && record.releasingOffice !== filters.office) return false;
      if (filters.paymentMode && record.paymentMode !== filters.paymentMode) return false;
      if (filters.balance === "outstanding" && balance <= 0) return false;
      if (filters.balance === "settled" && balance > 0) return false;
      if (filters.performedBy && record.liquidatedBy !== filters.performedBy) return false;
      if (filters.hasAttachment === "yes" && !record.liquidationAttachment) return false;
      if (filters.hasAttachment === "no" && record.liquidationAttachment) return false;
      if (filters.amountMin && record.amount < Number(filters.amountMin)) return false;
      if (filters.amountMax && record.amount > Number(filters.amountMax)) return false;
      if (filters.dateFrom && (!record.liquidationDate || record.liquidationDate < filters.dateFrom)) return false;
      if (filters.dateTo && (!record.liquidationDate || record.liquidationDate > filters.dateTo)) return false;
      return true;
    });
    const value = (row: (typeof rows)[number]) => {
      if (sortKey === "assistance") return row.record.referenceNumber;
      if (sortKey === "disbursement") return row.record.disbursementReference;
      if (sortKey === "resident") return row.residentName;
      if (sortKey === "barangay") return row.barangayName;
      if (sortKey === "type") return row.record.assistanceType;
      if (sortKey === "disbursed") return row.record.amount;
      if (sortKey === "balance") return row.balance;
      if (sortKey === "status") return row.record.liquidationStatus;
      return row.record.liquidationDate || row.record.assistanceDate;
    };
    return rows.sort((a, b) => {
      const left = value(a);
      const right = value(b);
      const result =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right));
      return direction === "asc" ? result : -result;
    });
  }, [direction, filters, scopedRows, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const activeCount = Object.entries(filters).filter(([key, value]) => key !== "search" && Boolean(value)).length;
  const scopeBadge = isAllSelected
    ? "All Barangays"
    : selectedBarangays.length === 1
      ? selectedBarangayName
      : `${selectedBarangays.length} Barangays`;
  const show = (column: Column) => visible.has(column) && (column !== "barangay" || selectedBarangays.length !== 1);
  const setFilter = (key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const reset = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };
  const doSort = (key: SortKey) => {
    if (sortKey === key) setDirection((current) => (current === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setDirection("asc");
    }
  };
  const th = (column: Column) => {
    const key = sortable[column];
    return (
      <th key={column}>
        {key ? (
          <button type="button" className={styles.sortButton} onClick={() => doSort(key)}>
            {labels[column]} <ChevronsUpDown size={12} />
          </button>
        ) : (
          labels[column]
        )}
      </th>
    );
  };

  const openLiquidation = (item: AssistanceRecord) => {
    setSelectedItem(item);
    setRemarks("");
    setPerformedBy("");
    setAttachmentName("");
  };
  const closeLiquidation = () => {
    setSelectedItem(null);
    setRemarks("");
    setPerformedBy("");
    setAttachmentName("");
  };
  const liquidate = () => {
    if (!selectedItem || !remarks.trim() || !performedBy || !attachmentName) return;
    markLiquidated(selectedItem.id, { remarks, performedBy, attachmentName });
    setMessage(`${selectedItem.disbursementReference} marked liquidated by ${performedBy}.`);
    closeLiquidation();
  };

  function exportReport() {
    const headers = columns.filter((column) => column !== "actions").map((column) => labels[column]);
    const rows = filtered.map(({ record, residentName, barangayName: name, balance }) => [
      record.referenceNumber,
      record.disbursementReference,
      residentName,
      record.householdId,
      name,
      record.assistanceType,
      record.fundSource,
      record.releasingOffice,
      record.paymentMode,
      record.officialReceiptNumber,
      record.amount,
      record.liquidatedAmount,
      balance,
      record.liquidationDocuments.length,
      record.liquidationStatus,
      record.liquidatedBy,
      record.liquidationDate,
      record.liquidationRemarks,
      record.liquidationAttachment,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `disbursement-liquidation-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${styles.assistanceHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>Disbursement &amp; Liquidation</h1>
            <p>Review released assistance, reconcile balances, and record complete liquidation accountability.</p>
          </div>
          <div className={styles.heroActions}>
            <button className={styles.btnSecondary} type="button" onClick={exportReport}>
              <Download size={16} /> Export Report
            </button>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        {message && (
          <div className={assistanceStyles.successNotice}>
            <BadgeCheck size={18} /> {message}
          </div>
        )}
        <section className={styles.card}>
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                aria-label="Search disbursement and liquidation"
                value={filters.search}
                onChange={(event) => setFilter("search", event.target.value)}
                placeholder="Search assistance, disbursement, resident, LRN, household, or receipt"
              />
            </label>
            <Select
              value={filters.status || "__all__"}
              onValueChange={(value) => setFilter("status", value === "__all__" ? "" : value)}
            >
              <SelectTrigger className={styles.compactSelect} aria-label="Liquidation status filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                <SelectItem value="Unliquidated">Unliquidated</SelectItem>
                <SelectItem value="Partially Liquidated">Partially Liquidated</SelectItem>
                <SelectItem value="Liquidated">Liquidated</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.fund || "__all__"}
              onValueChange={(value) => setFilter("fund", value === "__all__" ? "" : value)}
            >
              <SelectTrigger className={styles.compactSelect} aria-label="Fund source filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All fund sources</SelectItem>
                {funds.map((fund) => (
                  <SelectItem key={fund} value={fund}>
                    {fund}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              className={`${styles.secondaryButton} ${styles.filterButton}`}
              onClick={() => setMore((current) => !current)}
            >
              <Filter size={14} /> More filters{" "}
              {activeCount > 0 && <span className={styles.filterCount}>{activeCount}</span>}
            </button>
            <div className={styles.columnsMenu}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setColumnsOpen((current) => !current)}
              >
                <Columns3 size={14} /> Columns
              </button>
              {columnsOpen && (
                <div className={styles.columnsPopover}>
                  {columns
                    .filter((column) => column !== "barangay" || selectedBarangays.length !== 1)
                    .map((column) => (
                      <label key={column}>
                        <input
                          type="checkbox"
                          checked={visible.has(column)}
                          disabled={fixed.has(column)}
                          onChange={() =>
                            setVisible((current) => {
                              const next = new Set(current);
                              next.has(column) ? next.delete(column) : next.add(column);
                              return next;
                            })
                          }
                        />
                        {labels[column]}
                      </label>
                    ))}
                </div>
              )}
            </div>
            {(activeCount > 0 || filters.search) && (
              <button type="button" className={styles.secondaryButton} onClick={reset}>
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {more && (
            <div className={styles.advancedPanel}>
              <h3>Advanced filters</h3>
              <div className={styles.filterGrid}>
                {isAllSelected && (
                  <FilterSelect
                    label="Barangay"
                    value={filters.barangayId}
                    placeholder="All barangays"
                    options={MATNOG_BARANGAYS.map((barangay) => [barangay.code, barangay.name])}
                    onChange={(value) => setFilter("barangayId", value)}
                  />
                )}
                <FilterSelect
                  label="Assistance type"
                  value={filters.type}
                  placeholder="All assistance types"
                  options={ASSISTANCE_TYPES.map((value) => [value, value])}
                  onChange={(value) => setFilter("type", value)}
                />
                <FilterSelect
                  label="Releasing office"
                  value={filters.office}
                  placeholder="All releasing offices"
                  options={offices.map((value) => [value, value])}
                  onChange={(value) => setFilter("office", value)}
                />
                <FilterSelect
                  label="Payment mode"
                  value={filters.paymentMode}
                  placeholder="All payment modes"
                  options={["Cash", "Check", "Bank Transfer"].map((value) => [value, value])}
                  onChange={(value) => setFilter("paymentMode", value)}
                />
                <FilterSelect
                  label="Balance"
                  value={filters.balance}
                  placeholder="All balances"
                  options={[
                    ["outstanding", "With outstanding balance"],
                    ["settled", "Fully settled"],
                  ]}
                  onChange={(value) => setFilter("balance", value)}
                />
                <FilterSelect
                  label="Performed by"
                  value={filters.performedBy}
                  placeholder="All staff members"
                  options={performers.map((value) => [value, value])}
                  onChange={(value) => setFilter("performedBy", value)}
                />
                <FilterSelect
                  label="Attachment"
                  value={filters.hasAttachment}
                  placeholder="All attachment records"
                  options={[
                    ["yes", "With attachment"],
                    ["no", "Without attachment"],
                  ]}
                  onChange={(value) => setFilter("hasAttachment", value)}
                />
                <Field
                  label="Minimum disbursed amount"
                  type="number"
                  value={filters.amountMin}
                  onChange={(value) => setFilter("amountMin", value)}
                  placeholder="e.g. 1,500"
                />
                <Field
                  label="Maximum disbursed amount"
                  type="number"
                  value={filters.amountMax}
                  onChange={(value) => setFilter("amountMax", value)}
                  placeholder="e.g. 10,000"
                />
                <Field
                  label="Liquidation date from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(value) => setFilter("dateFrom", value)}
                />
                <Field
                  label="Liquidation date to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(value) => setFilter("dateTo", value)}
                />
              </div>
            </div>
          )}

          <div className={styles.resultsMeta}>
            <strong>
              {filtered.length === scopedRows.length
                ? `${filtered.length.toLocaleString()} released transactions`
                : `${filtered.length.toLocaleString()} of ${scopedRows.length.toLocaleString()} released transactions`}
            </strong>
            <span className={styles.scopeBadge}>
              <MapPin size={13} /> {scopeBadge}
            </span>
          </div>

          {pageRows.length ? (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>{columns.filter(show).map(th)}</tr>
                  </thead>
                  <tbody>
                    {pageRows.map(({ record, resident, residentName, barangayName: name, balance }) => (
                      <tr key={record.id}>
                        {show("assistance") && <td className={styles.mono}>{record.referenceNumber}</td>}
                        {show("disbursement") && <td className={styles.mono}>{record.disbursementReference}</td>}
                        {show("resident") && (
                          <td>
                            <div className={styles.nameCell}>
                              <Link href={`/barangay-affairs/residents/${record.residentId}`}>{residentName}</Link>
                              <small>{resident?.lrn ?? "No LRN"}</small>
                            </div>
                          </td>
                        )}
                        {show("household") && (
                          <td>
                            {record.householdId ? (
                              <Link className={styles.mono} href={`/barangay-affairs/households/${record.householdId}`}>
                                {record.householdId}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>
                        )}
                        {show("barangay") && <td>{name}</td>}
                        {show("type") && <td>{record.assistanceType}</td>}
                        {show("fund") && <td>{record.fundSource}</td>}
                        {show("office") && <td>{record.releasingOffice}</td>}
                        {show("mode") && <td>{record.paymentMode || "—"}</td>}
                        {show("receipt") && <td className={styles.mono}>{record.officialReceiptNumber || "—"}</td>}
                        {show("disbursed") && (
                          <td>
                            <strong>{money(record.amount)}</strong>
                          </td>
                        )}
                        {show("liquidated") && <td>{money(record.liquidatedAmount)}</td>}
                        {show("balance") && <td>{money(balance)}</td>}
                        {show("documents") && <td>{record.liquidationDocuments.length}</td>}
                        {show("status") && (
                          <td>
                            <span
                              className={`${styles.badge} ${liquidationClass(record.liquidationStatus as LiquidationStatus)}`}
                            >
                              {record.liquidationStatus}
                            </span>
                          </td>
                        )}
                        {show("performedBy") && <td>{record.liquidatedBy || "—"}</td>}
                        {show("date") && <td>{displayDate(record.liquidationDate)}</td>}
                        {show("remarks") && (
                          <td title={record.liquidationRemarks}>
                            {record.liquidationRemarks
                              ? `${record.liquidationRemarks.slice(0, 42)}${record.liquidationRemarks.length > 42 ? "…" : ""}`
                              : "—"}
                          </td>
                        )}
                        {show("attachment") && <td>{record.liquidationAttachment || "—"}</td>}
                        {show("actions") && (
                          <td>
                            <details className={styles.rowActions}>
                              <summary
                                className={styles.actionSummary}
                                aria-label={`Actions for ${record.disbursementReference}`}
                              >
                                <MoreHorizontal size={16} />
                              </summary>
                              <div className={styles.actionMenu}>
                                <Link href={`/barangay-affairs/residents/${record.residentId}`}>View resident</Link>
                                {record.householdId && (
                                  <Link href={`/barangay-affairs/households/${record.householdId}`}>
                                    View household
                                  </Link>
                                )}
                                {record.liquidationStatus !== "Liquidated" && (
                                  <button type="button" onClick={() => openLiquidation(record)}>
                                    Mark as liquidated
                                  </button>
                                )}
                              </div>
                            </details>
                          </td>
                        )}
                      </tr>
                    ))}
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
                  }}
                >
                  <SelectTrigger className={styles.compactSelect} aria-label="Rows per page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[25, 50, 100].map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>
                  {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
                </span>
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  disabled={safePage === totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </>
          ) : (
            <div className={styles.empty}>
              <div>
                <WalletCards size={28} />
                <h3>No disbursement records found</h3>
                <p>Adjust the search or clear the active filters.</p>
                <button type="button" className={styles.secondaryButton} onClick={reset}>
                  Reset filters
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {selectedItem && (
        <div className={assistanceStyles.modalBackdrop}>
          <button
            className={assistanceStyles.modalDismiss}
            type="button"
            onClick={closeLiquidation}
            aria-label="Close liquidation form"
          />
          <section
            className={assistanceStyles.liquidationModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="liquidation-dialog-title"
          >
            <header>
              <div>
                <span className={assistanceStyles.modalIcon}>
                  <BadgeCheck size={18} />
                </span>
                <div>
                  <h2 id="liquidation-dialog-title">Mark as Liquidated</h2>
                  <p>
                    {selectedItem.disbursementReference} · {money(selectedItem.amount)}
                  </p>
                </div>
              </div>
              <button type="button" onClick={closeLiquidation} aria-label="Close liquidation form">
                <X size={18} />
              </button>
            </header>
            <div className={assistanceStyles.liquidationSummary}>
              <span>
                <small>Assistance reference</small>
                <strong>{selectedItem.referenceNumber}</strong>
              </span>
              <span>
                <small>Current balance</small>
                <strong>{money(selectedItem.amount - selectedItem.liquidatedAmount)}</strong>
              </span>
              <span>
                <small>Fund source</small>
                <strong>{selectedItem.fundSource}</strong>
              </span>
            </div>
            <div className={assistanceStyles.liquidationForm}>
              <div className={styles.field}>
                <label htmlFor="liquidation-performed-by">Performed by *</label>
                <Select value={performedBy} onValueChange={setPerformedBy}>
                  <SelectTrigger id="liquidation-performed-by" aria-label="Performed by">
                    <SelectValue placeholder="Select the staff member performing this action" />
                  </SelectTrigger>
                  <SelectContent>
                    {FINANCE_STAFF.map((staff) => (
                      <SelectItem key={staff} value={staff}>
                        {staff}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <small>The selected identity will be recorded with the liquidation.</small>
              </div>
              <label className={styles.field}>
                <span>Remarks *</span>
                <textarea
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder="Describe the documents reviewed and the result of reconciliation"
                />
              </label>
              <label className={assistanceStyles.attachmentField}>
                <span className={assistanceStyles.attachmentLabel}>Supporting attachment *</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(event) => setAttachmentName(event.target.files?.[0]?.name ?? "")}
                />
                <span className={assistanceStyles.attachmentPicker}>
                  <Paperclip size={16} /> {attachmentName || "Choose liquidation report, receipt, or acknowledgement"}
                </span>
                <small>Accepted formats: PDF, JPG, PNG, DOC, or DOCX.</small>
              </label>
            </div>
            <footer>
              <button type="button" className={styles.secondaryButton} onClick={closeLiquidation}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={!performedBy || !remarks.trim() || !attachmentName}
                onClick={liquidate}
              >
                <BadgeCheck size={15} /> Confirm Liquidation
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
