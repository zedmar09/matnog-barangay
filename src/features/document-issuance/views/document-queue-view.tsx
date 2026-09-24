"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Columns3,
  Download,
  FileX2,
  Filter,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import dashboardStyles from "@/features/resident-registry/views/resident-dashboard.module.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useDocumentStore } from "../stores/document-store";
import type { IssuedDocumentStatus } from "../types/document";

export type DocumentQueueMode = "all" | "pending-review" | "for-approval" | "for-release" | "issued";

const ALL_STATUSES: IssuedDocumentStatus[] = [
  "Draft",
  "Pending Review",
  "For Approval",
  "Ready for Release",
  "Released",
  "Rejected",
  "Revoked",
];

const queueConfig: Record<DocumentQueueMode, { title: string; description: string; statuses: IssuedDocumentStatus[] }> =
  {
    all: {
      title: "Document Requests",
      description: "Search and manage resident certificates and clearances from preparation through release.",
      statuses: ALL_STATUSES,
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

const columns = [
  "control",
  "resident",
  "lrn",
  "barangay",
  "document",
  "purpose",
  "requested",
  "issueDate",
  "amount",
  "receipt",
  "payment",
  "status",
  "updated",
  "reprints",
  "actions",
] as const;
type Column = (typeof columns)[number];
type SortKey =
  | "control"
  | "resident"
  | "lrn"
  | "barangay"
  | "document"
  | "requested"
  | "issueDate"
  | "amount"
  | "status"
  | "updated"
  | "reprints";
type Filters = {
  search: string;
  status: string;
  templateCode: string;
  barangayId: string;
  payment: string;
  requestedFrom: string;
  requestedTo: string;
  issueFrom: string;
  issueTo: string;
  updatedFrom: string;
  updatedTo: string;
  amountMin: string;
  amountMax: string;
  reprints: string;
};

const EMPTY_FILTERS: Filters = {
  search: "",
  status: "",
  templateCode: "",
  barangayId: "",
  payment: "",
  requestedFrom: "",
  requestedTo: "",
  issueFrom: "",
  issueTo: "",
  updatedFrom: "",
  updatedTo: "",
  amountMin: "",
  amountMax: "",
  reprints: "",
};

const labels: Record<Column, string> = {
  control: "Control Number",
  resident: "Resident",
  lrn: "LRN",
  barangay: "Barangay",
  document: "Document Type",
  purpose: "Purpose",
  requested: "Requested Date",
  issueDate: "Issue Date",
  amount: "Amount",
  receipt: "Official Receipt",
  payment: "Payment",
  status: "Status",
  updated: "Latest Update",
  reprints: "Reprints",
  actions: "Actions",
};
const fixed = new Set<Column>(["control", "actions"]);
const defaultHidden = new Set<Column>(["lrn", "issueDate", "amount", "receipt", "updated", "reprints"]);
const sortable: Partial<Record<Column, SortKey>> = {
  control: "control",
  resident: "resident",
  lrn: "lrn",
  barangay: "barangay",
  document: "document",
  requested: "requested",
  issueDate: "issueDate",
  amount: "amount",
  status: "status",
  updated: "updated",
  reprints: "reprints",
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

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function DocumentQueueView({ mode }: { mode: DocumentQueueMode }) {
  const documents = useDocumentStore((state) => state.documents);
  const templates = useDocumentStore((state) => state.templates);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangayName, isAllSelected, selectedBarangays } = useBarangayScope();
  const config = queueConfig[mode];
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [more, setMore] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visible, setVisible] = useState<Set<Column>>(() => {
    const initial = new Set(columns as readonly Column[]);
    for (const column of defaultHidden) initial.delete(column);
    return initial;
  });
  const [sortKey, setSortKey] = useState<SortKey>("requested");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const scopedRows = useMemo(() => {
    const scope = new Set(selectedBarangays);
    return documents
      .filter(
        (document) => (isAllSelected || scope.has(document.barangayId)) && config.statuses.includes(document.status),
      )
      .map((document) => {
        const resident = residents.find((item) => item.id === document.residentId);
        const template = templates.find((item) => item.code === document.templateCode);
        return {
          document,
          resident,
          template,
          residentName: resident ? formatResidentName(resident) : "Unknown resident",
          barangayName: MATNOG_BARANGAYS.find((item) => item.code === document.barangayId)?.name ?? "—",
          documentName: template?.name ?? document.templateCode,
          paymentState: !template?.requiresOr ? "No fee" : document.paymentVerified ? "Verified" : "Pending",
        };
      });
  }, [config.statuses, documents, isAllSelected, residents, selectedBarangays, templates]);

  const filtered = useMemo(() => {
    const rows = scopedRows.filter((row) => {
      const { document, resident, template, residentName, barangayName, documentName, paymentState } = row;
      const query = filters.search.trim().toLowerCase();
      const haystack =
        `${document.controlNumber} ${residentName} ${resident?.lrn ?? ""} ${barangayName} ${documentName} ${document.purpose} ${document.officialReceipt}`.toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (filters.status && document.status !== filters.status) return false;
      if (filters.templateCode && document.templateCode !== filters.templateCode) return false;
      if (filters.barangayId && document.barangayId !== filters.barangayId) return false;
      if (filters.payment && paymentState.toLowerCase().replace(" ", "-") !== filters.payment) return false;
      if (filters.requestedFrom && document.requestedAt.slice(0, 10) < filters.requestedFrom) return false;
      if (filters.requestedTo && document.requestedAt.slice(0, 10) > filters.requestedTo) return false;
      if (filters.issueFrom && document.issueDate < filters.issueFrom) return false;
      if (filters.issueTo && document.issueDate > filters.issueTo) return false;
      if (filters.updatedFrom && document.updatedAt.slice(0, 10) < filters.updatedFrom) return false;
      if (filters.updatedTo && document.updatedAt.slice(0, 10) > filters.updatedTo) return false;
      if (filters.amountMin && document.amountPaid < Number(filters.amountMin)) return false;
      if (filters.amountMax && document.amountPaid > Number(filters.amountMax)) return false;
      if (filters.reprints === "with" && document.reprintCount === 0) return false;
      if (filters.reprints === "without" && document.reprintCount > 0) return false;
      if (filters.payment === "no-fee" && template?.requiresOr) return false;
      return true;
    });

    const value = (row: (typeof rows)[number]) => {
      const { document } = row;
      if (sortKey === "control") return document.controlNumber;
      if (sortKey === "resident") return row.residentName;
      if (sortKey === "lrn") return row.resident?.lrn ?? "";
      if (sortKey === "barangay") return row.barangayName;
      if (sortKey === "document") return row.documentName;
      if (sortKey === "requested") return document.requestedAt;
      if (sortKey === "issueDate") return document.issueDate;
      if (sortKey === "amount") return document.amountPaid;
      if (sortKey === "status") return document.status;
      if (sortKey === "reprints") return document.reprintCount;
      return document.updatedAt;
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
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const activeCount = Object.entries(filters).filter(([key, value]) => key !== "search" && Boolean(value)).length;
  const scopeBadge = isAllSelected
    ? "All Barangays"
    : selectedBarangays.length === 1
      ? selectedBarangayName
      : `${selectedBarangays.length} Barangays`;
  const show = (column: Column) => visible.has(column) && (column !== "barangay" || selectedBarangays.length !== 1);
  const statusOptions = mode === "all" ? ALL_STATUSES : config.statuses;

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
    const headers = columns.filter((column) => column !== "actions").map((column) => labels[column]);
    const values = filtered.map((row) => {
      const { document, resident } = row;
      const record: Record<Exclude<Column, "actions">, string | number> = {
        control: document.controlNumber,
        resident: row.residentName,
        lrn: resident?.lrn ?? "",
        barangay: row.barangayName,
        document: row.documentName,
        purpose: document.purpose,
        requested: document.requestedAt.slice(0, 10),
        issueDate: document.issueDate,
        amount: document.amountPaid,
        receipt: document.officialReceipt,
        payment: row.paymentState,
        status: document.status,
        updated: document.updatedAt.slice(0, 10),
        reprints: document.reprintCount,
      };
      return columns.filter((column) => column !== "actions").map((column) => record[column]);
    });
    const csv = [headers, ...values].map((line) => line.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `document-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${dashboardStyles.documentHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>{config.title}</h1>
            <p>{config.description}</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href="/barangay-affairs/documents/new">
              <Plus size={16} /> New Document
            </Link>
            <button type="button" className={styles.btnSecondary} onClick={exportReport}>
              <Download size={16} /> Export Report
            </button>
          </div>
        </div>
      </section>

      <main className={styles.body}>
        <section className={styles.card}>
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                aria-label="Search document requests"
                value={filters.search}
                onChange={(event) => setFilter("search", event.target.value)}
                placeholder="Search control number, resident, LRN, purpose, or receipt"
              />
            </label>
            <Select
              value={filters.status || "__all__"}
              onValueChange={(value) => setFilter("status", value === "__all__" ? "" : value)}
            >
              <SelectTrigger className={styles.compactSelect} aria-label="Document status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.templateCode || "__all__"}
              onValueChange={(value) => setFilter("templateCode", value === "__all__" ? "" : value)}
            >
              <SelectTrigger className={styles.compactSelect} aria-label="Document type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All document types</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.code} value={template.code}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              className={`${styles.secondaryButton} ${styles.filterButton}`}
              onClick={() => setMore((current) => !current)}
            >
              <Filter size={14} /> More filters
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
                  label="Payment status"
                  value={filters.payment}
                  placeholder="All payment states"
                  options={[
                    ["verified", "Verified"],
                    ["pending", "Pending payment"],
                    ["no-fee", "No fee required"],
                  ]}
                  onChange={(value) => setFilter("payment", value)}
                />
                <Field
                  label="Requested from"
                  type="date"
                  value={filters.requestedFrom}
                  onChange={(value) => setFilter("requestedFrom", value)}
                  placeholder="Select start date"
                />
                <Field
                  label="Requested to"
                  type="date"
                  value={filters.requestedTo}
                  onChange={(value) => setFilter("requestedTo", value)}
                  placeholder="Select end date"
                />
                <Field
                  label="Issue date from"
                  type="date"
                  value={filters.issueFrom}
                  onChange={(value) => setFilter("issueFrom", value)}
                  placeholder="Select start date"
                />
                <Field
                  label="Issue date to"
                  type="date"
                  value={filters.issueTo}
                  onChange={(value) => setFilter("issueTo", value)}
                  placeholder="Select end date"
                />
                <Field
                  label="Updated from"
                  type="date"
                  value={filters.updatedFrom}
                  onChange={(value) => setFilter("updatedFrom", value)}
                  placeholder="Select start date"
                />
                <Field
                  label="Updated to"
                  type="date"
                  value={filters.updatedTo}
                  onChange={(value) => setFilter("updatedTo", value)}
                  placeholder="Select end date"
                />
                <Field
                  label="Minimum amount"
                  type="number"
                  value={filters.amountMin}
                  onChange={(value) => setFilter("amountMin", value)}
                  placeholder="e.g. 0"
                />
                <Field
                  label="Maximum amount"
                  type="number"
                  value={filters.amountMax}
                  onChange={(value) => setFilter("amountMax", value)}
                  placeholder="e.g. 500"
                />
                <FilterSelect
                  label="Reprint record"
                  value={filters.reprints}
                  placeholder="All requests"
                  options={[
                    ["with", "Has reprint record"],
                    ["without", "No reprint record"],
                  ]}
                  onChange={(value) => setFilter("reprints", value)}
                />
              </div>
            </div>
          )}

          <div className={styles.resultsMeta}>
            <strong>
              {filtered.length === scopedRows.length
                ? `${filtered.length.toLocaleString()} document requests`
                : `${filtered.length.toLocaleString()} of ${scopedRows.length.toLocaleString()} document requests`}
            </strong>
            <span className={styles.scopeBadge}>
              <MapPin size={13} /> {scopeBadge}
            </span>
          </div>

          {rows.length ? (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>{columns.filter(show).map(th)}</tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const { document, resident, template } = row;
                      return (
                        <tr key={document.id}>
                          {show("control") && <td className={styles.mono}>{document.controlNumber}</td>}
                          {show("resident") && (
                            <td>
                              <div className={styles.nameCell}>
                                <Link href={`/barangay-affairs/documents/requests/${document.id}`}>
                                  {row.residentName}
                                </Link>
                                <small>{resident?.contact.primaryMobile || "No mobile recorded"}</small>
                              </div>
                            </td>
                          )}
                          {show("lrn") && <td className={styles.mono}>{resident?.lrn ?? "—"}</td>}
                          {show("barangay") && <td>{row.barangayName}</td>}
                          {show("document") && <td>{row.documentName}</td>}
                          {show("purpose") && <td>{document.purpose}</td>}
                          {show("requested") && <td>{new Date(document.requestedAt).toLocaleDateString("en-PH")}</td>}
                          {show("issueDate") && (
                            <td>{new Date(`${document.issueDate}T12:00:00`).toLocaleDateString("en-PH")}</td>
                          )}
                          {show("amount") && (
                            <td>{template?.requiresOr ? `₱${document.amountPaid.toLocaleString()}` : "Free"}</td>
                          )}
                          {show("receipt") && <td className={styles.mono}>{document.officialReceipt || "—"}</td>}
                          {show("payment") && (
                            <td>
                              <span
                                className={`${styles.badge} ${row.paymentState === "Pending" ? styles.warning : styles.active}`}
                              >
                                {row.paymentState}
                              </span>
                            </td>
                          )}
                          {show("status") && (
                            <td>
                              <span className={`${styles.badge} ${badge(document.status)}`}>{document.status}</span>
                            </td>
                          )}
                          {show("updated") && <td>{new Date(document.updatedAt).toLocaleDateString("en-PH")}</td>}
                          {show("reprints") && <td>{document.reprintCount}</td>}
                          {show("actions") && (
                            <td>
                              <details className={styles.rowActions}>
                                <summary
                                  className={styles.actionSummary}
                                  aria-label={`Actions for ${document.controlNumber}`}
                                >
                                  <MoreHorizontal size={16} />
                                </summary>
                                <div className={styles.actionMenu}>
                                  <Link href={`/barangay-affairs/documents/requests/${document.id}`}>Open request</Link>
                                  {resident && (
                                    <Link href={`/barangay-affairs/residents/${resident.id}`}>View resident</Link>
                                  )}
                                </div>
                              </details>
                            </td>
                          )}
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
                <FileX2 size={28} />
                <h3>No document requests found</h3>
                <p>Adjust the search or clear the active filters.</p>
                <button type="button" className={styles.secondaryButton} onClick={reset}>
                  Reset filters
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
