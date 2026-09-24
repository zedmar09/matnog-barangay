"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Columns3,
  Download,
  FilePlus2,
  Filter,
  HandCoins,
  MapPin,
  MoreHorizontal,
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
import type { AssistanceRecord } from "../types/assistance";

const columns = [
  "reference",
  "resident",
  "household",
  "barangay",
  "type",
  "amount",
  "fund",
  "office",
  "date",
  "payment",
  "documents",
  "cooling",
  "liquidation",
  "status",
  "actions",
] as const;
type Column = (typeof columns)[number];
type SortKey = "reference" | "resident" | "barangay" | "type" | "amount" | "date" | "status";
type Filters = {
  search: string;
  status: string;
  type: string;
  barangayId: string;
  fundSource: string;
  office: string;
  paymentMode: string;
  liquidation: string;
  duplicate: string;
  amountMin: string;
  amountMax: string;
  dateFrom: string;
  dateTo: string;
  documentsMin: string;
};

const EMPTY_FILTERS: Filters = {
  search: "",
  status: "",
  type: "",
  barangayId: "",
  fundSource: "",
  office: "",
  paymentMode: "",
  liquidation: "",
  duplicate: "",
  amountMin: "",
  amountMax: "",
  dateFrom: "",
  dateTo: "",
  documentsMin: "",
};
const labels: Record<Column, string> = {
  reference: "Reference",
  resident: "Resident",
  household: "Household",
  barangay: "Barangay",
  type: "Assistance Type",
  amount: "Amount",
  fund: "Fund Source",
  office: "Releasing Office",
  date: "Assistance Date",
  payment: "Payment Mode",
  documents: "Documents",
  cooling: "Cooling Until",
  liquidation: "Liquidation",
  status: "Status",
  actions: "Actions",
};
const fixed = new Set<Column>(["reference", "resident", "actions"]);
const defaultHidden = new Set<Column>(["household", "payment", "documents", "cooling"]);
const sortable: Partial<Record<Column, SortKey>> = {
  reference: "reference",
  resident: "resident",
  barangay: "barangay",
  type: "type",
  amount: "amount",
  date: "date",
  status: "status",
};

const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
const displayDate = (value: string) =>
  value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("en-PH") : "—";
const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

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

function StatusBadge({ status }: { status: AssistanceRecord["status"] }) {
  const label = status === "Held" ? "Needs verification" : status;
  return (
    <span
      className={`${styles.badge} ${status === "Released" ? styles.active : status === "Held" ? styles.danger : styles.warning}`}
    >
      {label}
    </span>
  );
}

export function AssistanceLedgerMasterlistView() {
  const records = useAssistanceStore((state) => state.records);
  const release = useAssistanceStore((state) => state.releaseAssistance);
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

  const scopedRows = useMemo(() => {
    const scope = new Set(selectedBarangays);
    return records
      .filter((record) => isAllSelected || scope.has(record.barangayId))
      .map((record) => {
        const resident = residents.find((item) => item.id === record.residentId);
        return {
          record,
          resident,
          residentName: resident ? formatResidentName(resident) : "Resident record unavailable",
          barangayName: barangayName(record.barangayId),
        };
      });
  }, [isAllSelected, records, residents, selectedBarangays]);

  const filtered = useMemo(() => {
    const rows = scopedRows.filter(({ record, resident, residentName, barangayName: name }) => {
      const query = filters.search.trim().toLowerCase();
      const haystack =
        `${record.referenceNumber} ${residentName} ${resident?.lrn ?? ""} ${record.householdId} ${record.disbursementReference} ${record.officialReceiptNumber}`.toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (filters.status && record.status !== filters.status) return false;
      if (filters.type && record.assistanceType !== filters.type) return false;
      if (filters.barangayId && record.barangayId !== filters.barangayId) return false;
      if (filters.fundSource && record.fundSource !== filters.fundSource) return false;
      if (filters.office && record.releasingOffice !== filters.office) return false;
      if (filters.paymentMode && record.paymentMode !== filters.paymentMode) return false;
      if (filters.liquidation && record.liquidationStatus !== filters.liquidation) return false;
      if (filters.duplicate === "yes" && !record.duplicateFlag) return false;
      if (filters.duplicate === "no" && record.duplicateFlag) return false;
      if (filters.amountMin && record.amount < Number(filters.amountMin)) return false;
      if (filters.amountMax && record.amount > Number(filters.amountMax)) return false;
      if (filters.dateFrom && record.assistanceDate < filters.dateFrom) return false;
      if (filters.dateTo && record.assistanceDate > filters.dateTo) return false;
      if (filters.documentsMin && record.supportingDocuments.length < Number(filters.documentsMin)) return false;
      return Boolean(name);
    });
    const value = (row: (typeof rows)[number]) => {
      if (sortKey === "reference") return row.record.referenceNumber;
      if (sortKey === "resident") return row.residentName;
      if (sortKey === "barangay") return row.barangayName;
      if (sortKey === "type") return row.record.assistanceType;
      if (sortKey === "amount") return row.record.amount;
      if (sortKey === "date") return row.record.assistanceDate;
      return row.record.status;
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

  function exportReport() {
    const headers = [
      "Reference",
      "Resident",
      "LRN",
      "Household",
      "Barangay",
      "Assistance Type",
      "Amount",
      "Fund Source",
      "Releasing Office",
      "Assistance Date",
      "Payment Mode",
      "Supporting Documents",
      "Cooling Until",
      "Liquidation Status",
      "Status",
    ];
    const rows = filtered.map(({ record, resident, residentName, barangayName: name }) => [
      record.referenceNumber,
      residentName,
      resident?.lrn ?? "",
      record.householdId,
      name,
      record.assistanceType,
      record.amount,
      record.fundSource,
      record.releasingOffice,
      record.assistanceDate,
      record.paymentMode,
      record.supportingDocuments.join("; "),
      record.coolingEndsAt,
      record.liquidationStatus,
      record.status,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `assistance-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
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
            <h1>Assistance Ledger</h1>
            <p>Search, review, and manage every assistance and benefit transaction.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href="/barangay-affairs/assistance/new">
              <FilePlus2 size={16} /> New Assistance
            </Link>
            <button type="button" className={styles.btnSecondary} onClick={exportReport}>
              <Download size={16} /> Export Report
            </button>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        <section className={styles.card}>
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                aria-label="Search assistance ledger"
                value={filters.search}
                onChange={(event) => setFilter("search", event.target.value)}
                placeholder="Search reference, resident, LRN, household, DV, or receipt"
              />
            </label>
            <Select
              value={filters.status || "__all__"}
              onValueChange={(value) => setFilter("status", value === "__all__" ? "" : value)}
            >
              <SelectTrigger className={styles.compactSelect} aria-label="Assistance status filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                <SelectItem value="Pending Review">Pending Review</SelectItem>
                <SelectItem value="Released">Released</SelectItem>
                <SelectItem value="Held">Needs Verification</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.type || "__all__"}
              onValueChange={(value) => setFilter("type", value === "__all__" ? "" : value)}
            >
              <SelectTrigger className={styles.compactSelect} aria-label="Assistance type filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All assistance types</SelectItem>
                {ASSISTANCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
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
                  label="Fund source"
                  value={filters.fundSource}
                  placeholder="All fund sources"
                  options={[...new Set(records.map((item) => item.fundSource))].map((value) => [value, value])}
                  onChange={(value) => setFilter("fundSource", value)}
                />
                <FilterSelect
                  label="Releasing office"
                  value={filters.office}
                  placeholder="All releasing offices"
                  options={[...new Set(records.map((item) => item.releasingOffice))].map((value) => [value, value])}
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
                  label="Liquidation status"
                  value={filters.liquidation}
                  placeholder="All liquidation statuses"
                  options={["Liquidated", "Partially Liquidated", "Unliquidated"].map((value) => [value, value])}
                  onChange={(value) => setFilter("liquidation", value)}
                />
                <FilterSelect
                  label="Duplicate check"
                  value={filters.duplicate}
                  placeholder="All duplicate results"
                  options={[
                    ["yes", "Possible duplicate"],
                    ["no", "No duplicate flag"],
                  ]}
                  onChange={(value) => setFilter("duplicate", value)}
                />
                <Field
                  label="Minimum amount"
                  type="number"
                  value={filters.amountMin}
                  onChange={(value) => setFilter("amountMin", value)}
                  placeholder="e.g. 1,500"
                />
                <Field
                  label="Maximum amount"
                  type="number"
                  value={filters.amountMax}
                  onChange={(value) => setFilter("amountMax", value)}
                  placeholder="e.g. 10,000"
                />
                <Field
                  label="Assistance date from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(value) => setFilter("dateFrom", value)}
                />
                <Field
                  label="Assistance date to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(value) => setFilter("dateTo", value)}
                />
                <Field
                  label="Minimum documents"
                  type="number"
                  value={filters.documentsMin}
                  onChange={(value) => setFilter("documentsMin", value)}
                  placeholder="e.g. 2"
                />
              </div>
            </div>
          )}

          <div className={styles.resultsMeta}>
            <strong>
              {filtered.length === scopedRows.length
                ? `${filtered.length.toLocaleString()} assistance records`
                : `${filtered.length.toLocaleString()} of ${scopedRows.length.toLocaleString()} assistance records`}
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
                    {pageRows.map(({ record, resident, residentName, barangayName: name }) => (
                      <tr key={record.id}>
                        {show("reference") && <td className={styles.mono}>{record.referenceNumber}</td>}
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
                              <span className={styles.muted}>Unlinked</span>
                            )}
                          </td>
                        )}
                        {show("barangay") && <td>{name}</td>}
                        {show("type") && <td>{record.assistanceType}</td>}
                        {show("amount") && (
                          <td>
                            <strong>{money(record.amount)}</strong>
                          </td>
                        )}
                        {show("fund") && <td>{record.fundSource}</td>}
                        {show("office") && <td>{record.releasingOffice}</td>}
                        {show("date") && <td>{displayDate(record.assistanceDate)}</td>}
                        {show("payment") && <td>{record.paymentMode || "—"}</td>}
                        {show("documents") && <td>{record.supportingDocuments.length}</td>}
                        {show("cooling") && <td>{displayDate(record.coolingEndsAt)}</td>}
                        {show("liquidation") && (
                          <td>
                            {record.liquidationStatus ? (
                              <span
                                className={`${styles.badge} ${record.liquidationStatus === "Liquidated" ? styles.active : record.liquidationStatus === "Partially Liquidated" ? styles.warning : styles.danger}`}
                              >
                                {record.liquidationStatus}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        )}
                        {show("status") && (
                          <td>
                            <StatusBadge status={record.status} />
                          </td>
                        )}
                        {show("actions") && (
                          <td>
                            <details className={styles.rowActions}>
                              <summary className={styles.actionSummary}>
                                <MoreHorizontal size={16} />
                              </summary>
                              <div className={styles.actionMenu}>
                                <Link href={`/barangay-affairs/residents/${record.residentId}`}>View resident</Link>
                                {record.householdId && (
                                  <Link href={`/barangay-affairs/households/${record.householdId}`}>
                                    View household
                                  </Link>
                                )}
                                {record.status === "Pending Review" && (
                                  <button type="button" onClick={() => release(record.id)}>
                                    <HandCoins size={14} /> Release assistance
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
                <h3>No assistance records found</h3>
                <p>Adjust the search or clear the active filters.</p>
                <button type="button" className={styles.secondaryButton} onClick={reset}>
                  Reset filters
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
