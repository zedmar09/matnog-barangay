"use client";

import { type ReactNode, useMemo, useState } from "react";

import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Columns3,
  Download,
  Filter,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Store,
  X,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useHouseholdRegistryStore } from "@/features/household-registry/stores/household-registry-store";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { BUSINESS_TYPES, GROSS_SALES_BRACKETS } from "../data/business-data";
import { useBusinessRegistryStore } from "../stores/business-store";
import type { BusinessRecord } from "../types/business";
import businessStyles from "./business.module.css";

const columns = [
  "registry",
  "business",
  "owner",
  "barangay",
  "location",
  "activity",
  "ownership",
  "employees",
  "sales",
  "status",
  "clearance",
  "fee",
  "renewal",
  "bpls",
  "updated",
  "actions",
] as const;
type Column = (typeof columns)[number];
type SortKey =
  | "registry"
  | "business"
  | "owner"
  | "barangay"
  | "activity"
  | "employees"
  | "status"
  | "renewal"
  | "updated";
type Filters = {
  search: string;
  status: string;
  type: string;
  barangayId: string;
  ownership: string;
  clearance: string;
  bpls: string;
  sales: string;
  payment: string;
  employeesMin: string;
  employeesMax: string;
  feeMin: string;
  feeMax: string;
  registeredFrom: string;
  registeredTo: string;
  renewalFrom: string;
  renewalTo: string;
};

const EMPTY_FILTERS: Filters = {
  search: "",
  status: "",
  type: "",
  barangayId: "",
  ownership: "",
  clearance: "",
  bpls: "",
  sales: "",
  payment: "",
  employeesMin: "",
  employeesMax: "",
  feeMin: "",
  feeMax: "",
  registeredFrom: "",
  registeredTo: "",
  renewalFrom: "",
  renewalTo: "",
};
const labels: Record<Column, string> = {
  registry: "Registry Number",
  business: "Business",
  owner: "Owner",
  barangay: "Barangay",
  location: "Location",
  activity: "Business Activity",
  ownership: "Ownership",
  employees: "Employees",
  sales: "Sales Bracket",
  status: "Status",
  clearance: "Clearance",
  fee: "Assessment",
  renewal: "Renewal Due",
  bpls: "BPLS",
  updated: "Last Updated",
  actions: "Actions",
};
const fixed = new Set<Column>(["registry", "business", "actions"]);
const defaultHidden = new Set<Column>(["location", "ownership", "employees", "fee", "renewal", "updated"]);
const sortable: Partial<Record<Column, SortKey>> = {
  registry: "registry",
  business: "business",
  owner: "owner",
  barangay: "barangay",
  activity: "activity",
  employees: "employees",
  status: "status",
  renewal: "renewal",
  updated: "updated",
};

const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
const displayDate = (value: string) =>
  value
    ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
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
  children?: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the supplied input is always associated by nesting.
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

function StatusBadge({ status }: { status: BusinessRecord["status"] }) {
  const className =
    status === "Active"
      ? styles.active
      : status === "For renewal"
        ? styles.warning
        : status === "Lapsed"
          ? styles.danger
          : styles.info;
  return <span className={`${styles.badge} ${className}`}>{status}</span>;
}

function ClearanceBadge({ status }: { status: BusinessRecord["clearanceStatus"] }) {
  const className =
    status === "Valid"
      ? styles.active
      : status === "Pending"
        ? styles.warning
        : status === "Expired"
          ? styles.danger
          : styles.info;
  return <span className={`${styles.badge} ${className}`}>{status}</span>;
}

export function BusinessMasterlistView() {
  const businesses = useBusinessRegistryStore((state) => state.businesses);
  const residents = useResidentRegistryStore((state) => state.residents);
  const structures = useHouseholdRegistryStore((state) => state.structures);
  const { selectedBarangayName, isAllSelected, selectedBarangays } = useBarangayScope();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [more, setMore] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visible, setVisible] = useState<Set<Column>>(() => {
    const initial = new Set(columns as readonly Column[]);
    for (const column of defaultHidden) initial.delete(column);
    return initial;
  });
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const residentMap = useMemo(() => new Map(residents.map((item) => [item.id, item])), [residents]);
  const structureMap = useMemo(() => new Map(structures.map((item) => [item.id, item])), [structures]);
  const scopedRows = useMemo(() => {
    const scope = new Set(selectedBarangays);
    return businesses
      .filter((record) => isAllSelected || scope.has(record.barangayId))
      .map((record) => {
        const resident = residentMap.get(record.ownerResidentId);
        const structure = structureMap.get(record.structureId);
        const ownerName = resident ? formatResidentName(resident) : "Resident record unavailable";
        const address = structure
          ? [structure.houseNumber, structure.street, structure.purok, structure.sitio].filter(Boolean).join(", ") ||
            structure.structureCode
          : "Structure record unavailable";
        return { record, resident, structure, ownerName, address, barangay: barangayName(record.barangayId) };
      });
  }, [businesses, isAllSelected, residentMap, selectedBarangays, structureMap]);

  const filtered = useMemo(() => {
    const rows = scopedRows.filter(({ record, ownerName, address, barangay }) => {
      const query = filters.search.trim().toLowerCase();
      const haystack =
        `${record.businessNumber} ${record.businessName} ${record.tradeName} ${ownerName} ${record.contactNumber} ${record.email} ${record.clearanceNumber} ${record.bplsPermitNumber} ${address}`.toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (filters.status && record.status !== filters.status) return false;
      if (filters.type && record.businessType !== filters.type) return false;
      if (filters.barangayId && record.barangayId !== filters.barangayId) return false;
      if (filters.ownership && record.ownership !== filters.ownership) return false;
      if (filters.clearance && record.clearanceStatus !== filters.clearance) return false;
      if (filters.bpls && record.bplsSyncStatus !== filters.bpls) return false;
      if (filters.sales && record.grossSalesBracket !== filters.sales) return false;
      if (filters.payment === "paid" && (record.assessedFee <= 0 || record.amountPaid < record.assessedFee))
        return false;
      if (filters.payment === "partial" && !(record.amountPaid > 0 && record.amountPaid < record.assessedFee))
        return false;
      if (filters.payment === "unpaid" && !(record.assessedFee > 0 && record.amountPaid === 0)) return false;
      if (filters.payment === "unassessed" && record.assessedFee !== 0) return false;
      if (filters.employeesMin && record.employeeCount < Number(filters.employeesMin)) return false;
      if (filters.employeesMax && record.employeeCount > Number(filters.employeesMax)) return false;
      if (filters.feeMin && record.assessedFee < Number(filters.feeMin)) return false;
      if (filters.feeMax && record.assessedFee > Number(filters.feeMax)) return false;
      if (filters.registeredFrom && record.registrationDate < filters.registeredFrom) return false;
      if (filters.registeredTo && record.registrationDate > filters.registeredTo) return false;
      if (filters.renewalFrom && record.renewalDueDate < filters.renewalFrom) return false;
      if (filters.renewalTo && record.renewalDueDate > filters.renewalTo) return false;
      return Boolean(barangay);
    });
    const value = (row: (typeof rows)[number]) => {
      if (sortKey === "registry") return row.record.businessNumber;
      if (sortKey === "business") return row.record.businessName;
      if (sortKey === "owner") return row.ownerName;
      if (sortKey === "barangay") return row.barangay;
      if (sortKey === "activity") return row.record.businessType;
      if (sortKey === "employees") return row.record.employeeCount;
      if (sortKey === "status") return row.record.status;
      if (sortKey === "renewal") return row.record.renewalDueDate;
      return row.record.updatedAt;
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
      "Registry Number",
      "Business",
      "Trade Name",
      "Owner",
      "Barangay",
      "Location",
      "Activity",
      "Ownership",
      "Employees",
      "Sales Bracket",
      "Status",
      "Clearance",
      "Assessed Fee",
      "Amount Paid",
      "Renewal Due",
      "BPLS Permit",
      "BPLS Status",
      "Last Updated",
    ];
    const rows = filtered.map(({ record, ownerName, barangay, address }) => [
      record.businessNumber,
      record.businessName,
      record.tradeName,
      ownerName,
      barangay,
      address,
      record.businessType,
      record.ownership,
      record.employeeCount,
      record.grossSalesBracket,
      record.status,
      record.clearanceStatus,
      record.assessedFee,
      record.amountPaid,
      record.renewalDueDate,
      record.bplsPermitNumber,
      record.bplsSyncStatus,
      record.updatedAt,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `business-masterlist-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${businessStyles.businessHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>Business Masterlist</h1>
            <p>Search, review, and maintain registered establishments across {selectedBarangayName}.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href="/barangay-affairs/businesses/register">
              <Plus size={16} /> Register Business
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
                aria-label="Search business masterlist"
                value={filters.search}
                onChange={(event) => setFilter("search", event.target.value)}
                placeholder="Search business, owner, registry, clearance, or permit"
              />
            </label>
            <Select
              value={filters.status || "__all__"}
              onValueChange={(value) => setFilter("status", value === "__all__" ? "" : value)}
            >
              <SelectTrigger className={styles.compactSelect} aria-label="Business status filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                {["Active", "For renewal", "Lapsed", "Closed"].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.type || "__all__"}
              onValueChange={(value) => setFilter("type", value === "__all__" ? "" : value)}
            >
              <SelectTrigger className={styles.compactSelect} aria-label="Business activity filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All business activities</SelectItem>
                {BUSINESS_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
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
                    options={MATNOG_BARANGAYS.map((item) => [item.code, item.name])}
                    onChange={(value) => setFilter("barangayId", value)}
                  />
                )}
                <FilterSelect
                  label="Ownership"
                  value={filters.ownership}
                  placeholder="All ownership types"
                  options={["Sole proprietorship", "Partnership", "Corporation", "Cooperative"].map((value) => [
                    value,
                    value,
                  ])}
                  onChange={(value) => setFilter("ownership", value)}
                />
                <FilterSelect
                  label="Clearance status"
                  value={filters.clearance}
                  placeholder="All clearance statuses"
                  options={["Valid", "Pending", "Expired", "Not issued"].map((value) => [value, value])}
                  onChange={(value) => setFilter("clearance", value)}
                />
                <FilterSelect
                  label="BPLS status"
                  value={filters.bpls}
                  placeholder="All BPLS statuses"
                  options={["Synced", "Pending", "Needs review"].map((value) => [value, value])}
                  onChange={(value) => setFilter("bpls", value)}
                />
                <FilterSelect
                  label="Gross sales bracket"
                  value={filters.sales}
                  placeholder="All sales brackets"
                  options={GROSS_SALES_BRACKETS.map((value) => [value, value])}
                  onChange={(value) => setFilter("sales", value)}
                />
                <FilterSelect
                  label="Payment state"
                  value={filters.payment}
                  placeholder="All payment states"
                  options={[
                    ["paid", "Paid in full"],
                    ["partial", "Partially paid"],
                    ["unpaid", "Unpaid"],
                    ["unassessed", "Not assessed"],
                  ]}
                  onChange={(value) => setFilter("payment", value)}
                />
                <Field
                  label="Minimum employees"
                  type="number"
                  value={filters.employeesMin}
                  onChange={(value) => setFilter("employeesMin", value)}
                  placeholder="e.g. 1"
                />
                <Field
                  label="Maximum employees"
                  type="number"
                  value={filters.employeesMax}
                  onChange={(value) => setFilter("employeesMax", value)}
                  placeholder="e.g. 25"
                />
                <Field
                  label="Minimum assessed fee"
                  type="number"
                  value={filters.feeMin}
                  onChange={(value) => setFilter("feeMin", value)}
                  placeholder="e.g. 500"
                />
                <Field
                  label="Maximum assessed fee"
                  type="number"
                  value={filters.feeMax}
                  onChange={(value) => setFilter("feeMax", value)}
                  placeholder="e.g. 5,000"
                />
                <Field
                  label="Registered from"
                  type="date"
                  value={filters.registeredFrom}
                  onChange={(value) => setFilter("registeredFrom", value)}
                />
                <Field
                  label="Registered to"
                  type="date"
                  value={filters.registeredTo}
                  onChange={(value) => setFilter("registeredTo", value)}
                />
                <Field
                  label="Renewal due from"
                  type="date"
                  value={filters.renewalFrom}
                  onChange={(value) => setFilter("renewalFrom", value)}
                />
                <Field
                  label="Renewal due to"
                  type="date"
                  value={filters.renewalTo}
                  onChange={(value) => setFilter("renewalTo", value)}
                />
              </div>
            </div>
          )}

          <div className={styles.resultsMeta}>
            <strong>
              {filtered.length === scopedRows.length
                ? `${filtered.length.toLocaleString()} businesses`
                : `${filtered.length.toLocaleString()} of ${scopedRows.length.toLocaleString()} businesses`}
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
                    {pageRows.map(({ record, resident, structure, ownerName, address, barangay }) => (
                      <tr key={record.id}>
                        {show("registry") && (
                          <td>
                            <div className={styles.nameCell}>
                              <strong className={styles.mono}>{record.businessNumber}</strong>
                              <small>Registered {displayDate(record.registrationDate)}</small>
                            </div>
                          </td>
                        )}
                        {show("business") && (
                          <td>
                            <div className={styles.nameCell}>
                              <Link href={`/barangay-affairs/businesses/${record.id}`}>{record.businessName}</Link>
                              <small>{record.tradeName || "No trade name"}</small>
                            </div>
                          </td>
                        )}
                        {show("owner") && (
                          <td>
                            <div className={styles.nameCell}>
                              <Link href={`/barangay-affairs/residents/${record.ownerResidentId}`}>{ownerName}</Link>
                              <small>{resident?.lrn ?? record.contactNumber}</small>
                            </div>
                          </td>
                        )}
                        {show("barangay") && <td>{barangay}</td>}
                        {show("location") && (
                          <td>
                            <div className={styles.nameCell}>
                              <span>{address}</span>
                              <small>{structure?.structureCode ?? "Unlinked structure"}</small>
                            </div>
                          </td>
                        )}
                        {show("activity") && <td>{record.businessType}</td>}
                        {show("ownership") && <td>{record.ownership}</td>}
                        {show("employees") && <td>{record.employeeCount.toLocaleString()}</td>}
                        {show("sales") && <td>{record.grossSalesBracket}</td>}
                        {show("status") && (
                          <td>
                            <StatusBadge status={record.status} />
                          </td>
                        )}
                        {show("clearance") && (
                          <td>
                            <div className={styles.nameCell}>
                              <ClearanceBadge status={record.clearanceStatus} />
                              <small>{record.clearanceNumber || "No clearance number"}</small>
                            </div>
                          </td>
                        )}
                        {show("fee") && (
                          <td>
                            <div className={styles.nameCell}>
                              <strong>{money(record.assessedFee)}</strong>
                              <small>
                                {record.assessedFee === 0
                                  ? "Not assessed"
                                  : record.amountPaid >= record.assessedFee
                                    ? "Paid in full"
                                    : `${money(record.amountPaid)} paid`}
                              </small>
                            </div>
                          </td>
                        )}
                        {show("renewal") && <td>{displayDate(record.renewalDueDate)}</td>}
                        {show("bpls") && (
                          <td>
                            <div className={styles.nameCell}>
                              <span
                                className={`${styles.badge} ${record.bplsSyncStatus === "Synced" ? styles.active : record.bplsSyncStatus === "Needs review" ? styles.danger : styles.warning}`}
                              >
                                {record.bplsSyncStatus}
                              </span>
                              <small>{record.bplsPermitNumber || "No permit number"}</small>
                            </div>
                          </td>
                        )}
                        {show("updated") && <td>{displayDate(record.updatedAt)}</td>}
                        {show("actions") && (
                          <td>
                            <details className={styles.rowActions}>
                              <summary
                                className={styles.actionSummary}
                                aria-label={`Actions for ${record.businessName}`}
                              >
                                <MoreHorizontal size={16} />
                              </summary>
                              <div className={styles.actionMenu}>
                                <Link href={`/barangay-affairs/businesses/${record.id}`}>View business</Link>
                                <Link href={`/barangay-affairs/businesses/${record.id}/edit`}>Update business</Link>
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
                <Store size={28} />
                <h3>No businesses found</h3>
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
