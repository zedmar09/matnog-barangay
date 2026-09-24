"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BellRing,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock3,
  Columns3,
  CreditCard,
  Download,
  FileText,
  Filter,
  MapPin,
  MoreHorizontal,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserRoundX,
  X,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import dashboardStyles from "@/features/resident-registry/views/resident-dashboard.module.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useSectorRegistryStore } from "../stores/sector-registry-store";
import type { CertificationStatus, CredentialStatus } from "../types/sector";

const statusStyle = (status: string) =>
  status === "Approved" || status === "Released" || status === "Resolved"
    ? styles.active
    : status === "Rejected" || status === "Expired" || status === "Revoked"
      ? styles.danger
      : status === "Municipal Review" || status === "Ready for Release"
        ? styles.info
        : styles.warning;

function SummaryCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className={styles.summaryCard}>
      <span className={styles.summaryIcon}>{icon}</span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

const reviewColumns = [
  "request",
  "resident",
  "lrn",
  "barangay",
  "sector",
  "submitted",
  "barangayReview",
  "municipalReview",
  "status",
  "updated",
  "actions",
] as const;
type ReviewColumn = (typeof reviewColumns)[number];
type ReviewSortKey = "request" | "resident" | "lrn" | "barangay" | "sector" | "submitted" | "status" | "updated";
type ReviewFilters = {
  search: string;
  sector: string;
  status: string;
  barangayId: string;
  requestedFrom: string;
  requestedTo: string;
  updatedFrom: string;
  updatedTo: string;
  barangayReview: string;
  municipalReview: string;
};

const EMPTY_REVIEW_FILTERS: ReviewFilters = {
  search: "",
  sector: "",
  status: "",
  barangayId: "",
  requestedFrom: "",
  requestedTo: "",
  updatedFrom: "",
  updatedTo: "",
  barangayReview: "",
  municipalReview: "",
};

const reviewLabels: Record<ReviewColumn, string> = {
  request: "Request Number",
  resident: "Resident",
  lrn: "LRN",
  barangay: "Barangay",
  sector: "Sector",
  submitted: "Submitted",
  barangayReview: "Barangay Review",
  municipalReview: "Municipal Review",
  status: "Status",
  updated: "Latest Update",
  actions: "Actions",
};
const fixedReviewColumns = new Set<ReviewColumn>(["request", "actions"]);
const hiddenReviewColumns = new Set<ReviewColumn>(["lrn", "municipalReview", "updated"]);
const reviewSortable: Partial<Record<ReviewColumn, ReviewSortKey>> = {
  request: "request",
  resident: "resident",
  lrn: "lrn",
  barangay: "barangay",
  sector: "sector",
  submitted: "submitted",
  status: "status",
  updated: "updated",
};

function ReviewField({
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

function ReviewFilterSelect({
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
    <ReviewField label={label} value={value} onChange={onChange}>
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
    </ReviewField>
  );
}

function csvValue(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function CertificationRequestsView() {
  const requests = useSectorRegistryStore((state) => state.certificationRequests);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangayName, isAllSelected, selectedBarangays } = useBarangayScope();
  const [filters, setFilters] = useState<ReviewFilters>(EMPTY_REVIEW_FILTERS);
  const [more, setMore] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visible, setVisible] = useState<Set<ReviewColumn>>(() => {
    const initial = new Set(reviewColumns as readonly ReviewColumn[]);
    for (const column of hiddenReviewColumns) initial.delete(column);
    return initial;
  });
  const [sortKey, setSortKey] = useState<ReviewSortKey>("submitted");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const scopedRows = useMemo(() => {
    const scope = new Set(selectedBarangays);
    return requests
      .filter((request) => isAllSelected || scope.has(request.barangayId))
      .map((request) => {
        const resident = residents.find((item) => item.id === request.residentId);
        const definition = definitions.find((item) => item.code === request.sectorCode);
        return resident
          ? {
              request,
              resident,
              definition,
              residentName: formatResidentName(resident),
              barangayName: MATNOG_BARANGAYS.find((item) => item.code === request.barangayId)?.name ?? "—",
            }
          : null;
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }, [definitions, isAllSelected, requests, residents, selectedBarangays]);

  const filtered = useMemo(() => {
    const rows = scopedRows.filter((row) => {
      const { request, resident, residentName, barangayName, definition } = row;
      const query = filters.search.trim().toLowerCase();
      const haystack =
        `${request.requestNumber} ${residentName} ${resident.lrn} ${barangayName} ${definition?.name ?? ""}`.toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (filters.sector && request.sectorCode !== filters.sector) return false;
      if (filters.status && request.status !== filters.status) return false;
      if (filters.barangayId && request.barangayId !== filters.barangayId) return false;
      if (filters.requestedFrom && request.requestedAt.slice(0, 10) < filters.requestedFrom) return false;
      if (filters.requestedTo && request.requestedAt.slice(0, 10) > filters.requestedTo) return false;
      if (filters.updatedFrom && request.updatedAt.slice(0, 10) < filters.updatedFrom) return false;
      if (filters.updatedTo && request.updatedAt.slice(0, 10) > filters.updatedTo) return false;
      if (filters.barangayReview === "complete" && !request.barangayCertifiedAt) return false;
      if (filters.barangayReview === "pending" && request.barangayCertifiedAt) return false;
      if (filters.municipalReview === "complete" && !request.municipalReviewedAt) return false;
      if (filters.municipalReview === "pending" && request.municipalReviewedAt) return false;
      return true;
    });
    const value = (row: (typeof rows)[number]) => {
      if (sortKey === "request") return row.request.requestNumber;
      if (sortKey === "resident") return row.residentName;
      if (sortKey === "lrn") return row.resident.lrn;
      if (sortKey === "barangay") return row.barangayName;
      if (sortKey === "sector") return row.definition?.name ?? "";
      if (sortKey === "submitted") return row.request.requestedAt;
      if (sortKey === "status") return row.request.status;
      return row.request.updatedAt;
    };
    return rows.sort((a, b) => {
      const result = String(value(a)).localeCompare(String(value(b)));
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
  const show = (column: ReviewColumn) =>
    visible.has(column) && (column !== "barangay" || selectedBarangays.length !== 1);

  const setFilter = (key: keyof ReviewFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const reset = () => {
    setFilters(EMPTY_REVIEW_FILTERS);
    setPage(1);
  };
  const doSort = (key: ReviewSortKey) => {
    if (sortKey === key) setDirection((current) => (current === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setDirection("asc");
    }
  };
  const th = (column: ReviewColumn) => {
    const key = reviewSortable[column];
    return (
      <th key={column}>
        {key ? (
          <button type="button" className={styles.sortButton} onClick={() => doSort(key)}>
            {reviewLabels[column]}
            <ChevronsUpDown size={12} />
          </button>
        ) : (
          reviewLabels[column]
        )}
      </th>
    );
  };

  function exportReport() {
    const headers = [
      "Request Number",
      "Resident",
      "LRN",
      "Barangay",
      "Sector",
      "Submitted",
      "Barangay Review",
      "Municipal Review",
      "Status",
      "Latest Update",
    ];
    const values = filtered.map((row) => [
      row.request.requestNumber,
      row.residentName,
      row.resident.lrn,
      row.barangayName,
      row.definition?.name ?? row.request.sectorCode,
      row.request.requestedAt.slice(0, 10),
      row.request.barangayCertifiedAt ? "Completed" : "Pending",
      row.request.municipalReviewedAt ? "Completed" : "Pending",
      row.request.status,
      row.request.updatedAt.slice(0, 10),
    ]);
    const csv = [headers, ...values].map((line) => line.map(csvValue).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `eligibility-reviews-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${dashboardStyles.sectorHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>Eligibility Reviews</h1>
            <p>Review barangay validation and municipal approval for sector membership applications.</p>
          </div>
          <div className={styles.heroActions}>
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
                aria-label="Search eligibility reviews"
                value={filters.search}
                onChange={(event) => setFilter("search", event.target.value)}
                placeholder="Search request number, resident, LRN, barangay, or sector"
              />
            </label>
            <Select
              value={filters.sector || "__all__"}
              onValueChange={(value) => setFilter("sector", value === "__all__" ? "" : value)}
            >
              <SelectTrigger className={styles.compactSelect} aria-label="Sector classification">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All sectors</SelectItem>
                {definitions.map((definition) => (
                  <SelectItem key={definition.code} value={definition.code}>
                    {definition.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status || "__all__"}
              onValueChange={(value) => setFilter("status", value === "__all__" ? "" : value)}
            >
              <SelectTrigger className={styles.compactSelect} aria-label="Review status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                {(
                  ["Submitted", "Barangay Certified", "Municipal Review", "Approved", "Rejected", "Cancelled"] as const
                ).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
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
                  {reviewColumns
                    .filter((column) => column !== "barangay" || selectedBarangays.length !== 1)
                    .map((column) => (
                      <label key={column}>
                        <input
                          type="checkbox"
                          checked={visible.has(column)}
                          disabled={fixedReviewColumns.has(column)}
                          onChange={() =>
                            setVisible((current) => {
                              const next = new Set(current);
                              next.has(column) ? next.delete(column) : next.add(column);
                              return next;
                            })
                          }
                        />
                        {reviewLabels[column]}
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
                  <ReviewFilterSelect
                    label="Barangay"
                    value={filters.barangayId}
                    placeholder="All barangays"
                    options={MATNOG_BARANGAYS.map((barangay) => [barangay.code, barangay.name])}
                    onChange={(value) => setFilter("barangayId", value)}
                  />
                )}
                <ReviewFilterSelect
                  label="Barangay review"
                  value={filters.barangayReview}
                  placeholder="All barangay states"
                  options={[
                    ["complete", "Review completed"],
                    ["pending", "Awaiting barangay review"],
                  ]}
                  onChange={(value) => setFilter("barangayReview", value)}
                />
                <ReviewFilterSelect
                  label="Municipal review"
                  value={filters.municipalReview}
                  placeholder="All municipal states"
                  options={[
                    ["complete", "Review completed"],
                    ["pending", "Awaiting municipal review"],
                  ]}
                  onChange={(value) => setFilter("municipalReview", value)}
                />
                <ReviewField
                  label="Submitted from"
                  type="date"
                  value={filters.requestedFrom}
                  onChange={(value) => setFilter("requestedFrom", value)}
                  placeholder="Select start date"
                />
                <ReviewField
                  label="Submitted to"
                  type="date"
                  value={filters.requestedTo}
                  onChange={(value) => setFilter("requestedTo", value)}
                  placeholder="Select end date"
                />
                <ReviewField
                  label="Updated from"
                  type="date"
                  value={filters.updatedFrom}
                  onChange={(value) => setFilter("updatedFrom", value)}
                  placeholder="Select start date"
                />
                <ReviewField
                  label="Updated to"
                  type="date"
                  value={filters.updatedTo}
                  onChange={(value) => setFilter("updatedTo", value)}
                  placeholder="Select end date"
                />
              </div>
            </div>
          )}

          <div className={styles.resultsMeta}>
            <strong>
              {filtered.length === scopedRows.length
                ? `${filtered.length.toLocaleString()} eligibility reviews`
                : `${filtered.length.toLocaleString()} of ${scopedRows.length.toLocaleString()} eligibility reviews`}
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
                    <tr>{reviewColumns.filter(show).map(th)}</tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.request.id}>
                        {show("request") && <td className={styles.mono}>{row.request.requestNumber}</td>}
                        {show("resident") && (
                          <td>
                            <div className={styles.nameCell}>
                              <Link href={`/barangay-affairs/sectors/residents/${row.resident.id}`}>
                                {row.residentName}
                              </Link>
                              <small>{row.resident.contact.primaryMobile || "No mobile recorded"}</small>
                            </div>
                          </td>
                        )}
                        {show("lrn") && <td className={styles.mono}>{row.resident.lrn}</td>}
                        {show("barangay") && <td>{row.barangayName}</td>}
                        {show("sector") && <td>{row.definition?.name ?? row.request.sectorCode}</td>}
                        {show("submitted") && <td>{new Date(row.request.requestedAt).toLocaleDateString("en-PH")}</td>}
                        {show("barangayReview") && (
                          <td>
                            <span
                              className={`${styles.badge} ${row.request.barangayCertifiedAt ? styles.active : styles.warning}`}
                            >
                              {row.request.barangayCertifiedAt ? "Completed" : "Pending"}
                            </span>
                          </td>
                        )}
                        {show("municipalReview") && (
                          <td>
                            <span
                              className={`${styles.badge} ${row.request.municipalReviewedAt ? styles.active : styles.warning}`}
                            >
                              {row.request.municipalReviewedAt ? "Completed" : "Pending"}
                            </span>
                          </td>
                        )}
                        {show("status") && (
                          <td>
                            <span className={`${styles.badge} ${statusStyle(row.request.status)}`}>
                              {row.request.status}
                            </span>
                          </td>
                        )}
                        {show("updated") && <td>{new Date(row.request.updatedAt).toLocaleDateString("en-PH")}</td>}
                        {show("actions") && (
                          <td>
                            <details className={styles.rowActions}>
                              <summary
                                className={styles.actionSummary}
                                aria-label={`Actions for ${row.request.requestNumber}`}
                              >
                                <MoreHorizontal size={16} />
                              </summary>
                              <div className={styles.actionMenu}>
                                <Link href={`/barangay-affairs/sectors/certification-requests/${row.request.id}`}>
                                  Review request
                                </Link>
                                <Link href={`/barangay-affairs/sectors/residents/${row.resident.id}`}>
                                  View sector profile
                                </Link>
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
                <UserRoundX size={28} />
                <h3>No eligibility reviews found</h3>
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

const requestTabs = ["Overview", "Documents & Eligibility", "Review History", "Review Action"] as const;
const reviewers = [
  "Barangay Front Desk",
  "Barangay Registry Officer",
  "Barangay Secretary",
  "Punong Barangay",
  "Municipal Sector Desk",
  "MSWDO Reviewer",
] as const;
const reviewDecisions: CertificationStatus[] = [
  "Submitted",
  "Barangay Certified",
  "Municipal Review",
  "Approved",
  "Rejected",
  "Cancelled",
];

function WorkflowRows({ items }: { items: Array<[string, string | number | undefined]> }) {
  return (
    <dl className={styles.dataList}>
      {items.map(([label, value]) => (
        <div className={styles.dataRow} key={label}>
          <dt>{label}</dt>
          <dd>{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function WorkflowCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className={styles.detailCardStyled}>
      <div className={styles.detailCardHeader}>
        <span className={styles.detailCardIcon}>{icon}</span>
        <h3>{title}</h3>
      </div>
      <div className={styles.detailCardBody}>{children}</div>
    </section>
  );
}

export function CertificationRequestDetailView({ id }: { id: string }) {
  const requests = useSectorRegistryStore((state) => state.certificationRequests);
  const memberships = useSectorRegistryStore((state) => state.memberships);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const update = useSectorRegistryStore((state) => state.updateCertificationStatus);
  const createCredential = useSectorRegistryStore((state) => state.createCredential);
  const residents = useResidentRegistryStore((state) => state.residents);
  const request = requests.find((item) => item.id === id);
  const [tab, setTab] = useState<(typeof requestTabs)[number]>("Overview");
  const [note, setNote] = useState(request?.decisionNote ?? "");
  const [reviewer, setReviewer] = useState(request?.lastActionBy || "Barangay Registry Officer");
  const [decision, setDecision] = useState<CertificationStatus>(request?.status ?? "Submitted");
  const [message, setMessage] = useState("");

  if (!request)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <h1>Request not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/sectors/certification-requests">
            Return to eligibility reviews
          </Link>
        </div>
      </div>
    );

  const resident = residents.find((item) => item.id === request.residentId);
  const membership = memberships.find((item) => item.id === request.membershipId);
  const definition = definitions.find((item) => item.code === request.sectorCode);
  const barangay = MATNOG_BARANGAYS.find((item) => item.code === request.barangayId)?.name ?? "—";
  const applyDecision = () => {
    if (update(request.id, decision, note, reviewer)) setMessage(`${decision} recorded by ${reviewer}.`);
  };

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${dashboardStyles.sectorHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>{request.requestNumber}</h1>
            <p>
              {resident ? formatResidentName(resident) : "Unknown resident"} · {definition?.name} · Brgy. {barangay}
            </p>
          </div>
          <div className={styles.heroActions}>
            {resident ? (
              <Link className={styles.btnPrimary} href={`/barangay-affairs/sectors/residents/${resident.id}`}>
                <UserCheck size={16} /> Sector Profile
              </Link>
            ) : null}
            <Link className={styles.btnSecondary} href="/barangay-affairs/sectors/certification-requests">
              <ArrowLeft size={16} /> Eligibility Reviews
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        {message ? <div className={styles.toast}>{message}</div> : null}
        <section className={styles.card}>
          <header className={styles.profileHeader}>
            <div className={styles.avatarLg}>
              <FileText size={30} />
            </div>
            <div className={styles.profileIdentity}>
              <h1>{request.requestNumber}</h1>
              <p>{resident ? `${formatResidentName(resident)} · ${resident.lrn}` : "Unknown resident"}</p>
              <div className={styles.badgeRow}>
                <span className={`${styles.badge} ${statusStyle(request.status)}`}>{request.status}</span>
                <span className={styles.badge}>{definition?.shortName}</span>
                <span className={`${styles.badge} ${request.barangayCertifiedAt ? styles.active : styles.warning}`}>
                  {request.barangayCertifiedAt ? "Barangay reviewed" : "Barangay review pending"}
                </span>
                <span className={`${styles.badge} ${request.municipalReviewedAt ? styles.active : styles.warning}`}>
                  {request.municipalReviewedAt ? "Municipal review recorded" : "Municipal review pending"}
                </span>
              </div>
            </div>
          </header>

          <nav className={styles.tabs} aria-label="Eligibility review details">
            {requestTabs.map((value) => (
              <button
                type="button"
                key={value}
                className={`${styles.tab} ${tab === value ? styles.tabActive : ""}`}
                onClick={() => setTab(value)}
              >
                {value}
              </button>
            ))}
          </nav>

          <div className={styles.profileBody}>
            {tab === "Overview" ? (
              <div className={styles.profileGrid}>
                <WorkflowCard icon={<UserCheck size={17} />} title="Resident and Request">
                  <WorkflowRows
                    items={[
                      ["Request number", request.requestNumber],
                      ["Resident", resident ? formatResidentName(resident) : "Unknown"],
                      ["Local Resident Number", resident?.lrn],
                      ["Barangay", barangay],
                      ["Sector classification", definition?.name],
                      ["Current status", request.status],
                    ]}
                  />
                </WorkflowCard>
                <WorkflowCard icon={<CalendarDays size={17} />} title="Request Timeline">
                  <WorkflowRows
                    items={[
                      ["Submitted", new Date(request.requestedAt).toLocaleString("en-PH")],
                      ["Last action by", request.lastActionBy],
                      ["Last action", new Date(request.lastActionAt).toLocaleString("en-PH")],
                      ["Latest update", new Date(request.updatedAt).toLocaleString("en-PH")],
                    ]}
                  />
                </WorkflowCard>
                <WorkflowCard icon={<ShieldCheck size={17} />} title="Review Progress">
                  <WorkflowRows
                    items={[
                      ["Barangay review", request.barangayCertifiedAt ? "Completed" : "Pending"],
                      ["Municipal review", request.municipalReviewedAt ? "Completed" : "Pending"],
                      ["Decision", request.status],
                    ]}
                  />
                </WorkflowCard>
                <WorkflowCard icon={<FileText size={17} />} title="Membership Reference">
                  <WorkflowRows
                    items={[
                      ["Membership number", membership?.referenceNumber],
                      ["Validity start", membership?.validityStart],
                      ["Validity end", membership?.validityEnd || "No fixed expiry"],
                      ["Issuing office", membership?.issuingOffice],
                    ]}
                  />
                </WorkflowCard>
              </div>
            ) : null}

            {tab === "Documents & Eligibility" ? (
              <div className={styles.profileGrid}>
                <WorkflowCard icon={<FileText size={17} />} title="Supporting Documents">
                  {membership?.supportingDocuments.length ? (
                    <div className={styles.badgeRow}>
                      {membership.supportingDocuments.map((document) => (
                        <span className={styles.badge} key={document}>
                          {document}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.muted}>No supporting document has been recorded.</p>
                  )}
                </WorkflowCard>
                <WorkflowCard icon={<BadgeCheck size={17} />} title="Eligibility Basis">
                  <WorkflowRows
                    items={[
                      ["Sector", definition?.name],
                      ["Eligibility description", definition?.description],
                      ["Membership status", membership?.status],
                      ["Barangay certified", membership?.certifiedByBarangay ? "Yes" : "Pending"],
                      ["Membership remarks", membership?.remarks],
                    ]}
                  />
                </WorkflowCard>
              </div>
            ) : null}

            {tab === "Review History" ? (
              <div className={styles.profileGrid}>
                <WorkflowCard icon={<CheckCircle2 size={17} />} title="Barangay Review">
                  <WorkflowRows
                    items={[
                      ["Reviewed by", request.barangayCertifiedBy || "Pending"],
                      [
                        "Reviewed at",
                        request.barangayCertifiedAt
                          ? new Date(request.barangayCertifiedAt).toLocaleString("en-PH")
                          : "Pending",
                      ],
                      ["Result", request.barangayCertifiedAt ? "Barangay validation completed" : "Awaiting action"],
                    ]}
                  />
                </WorkflowCard>
                <WorkflowCard icon={<ShieldCheck size={17} />} title="Municipal Review">
                  <WorkflowRows
                    items={[
                      ["Reviewed by", request.municipalReviewedBy || "Pending"],
                      [
                        "Reviewed at",
                        request.municipalReviewedAt
                          ? new Date(request.municipalReviewedAt).toLocaleString("en-PH")
                          : "Pending",
                      ],
                      ["Result", request.municipalReviewedAt ? request.status : "Awaiting action"],
                    ]}
                  />
                </WorkflowCard>
                <WorkflowCard icon={<CalendarDays size={17} />} title="Latest Recorded Action">
                  <WorkflowRows
                    items={[
                      ["Action by", request.lastActionBy],
                      ["Action date", new Date(request.lastActionAt).toLocaleString("en-PH")],
                      ["Decision note", request.decisionNote],
                    ]}
                  />
                </WorkflowCard>
              </div>
            ) : null}

            {tab === "Review Action" ? (
              <div className={styles.idActionCardBody}>
                <WorkflowCard icon={<UserCheck size={17} />} title="Record Review Decision">
                  <div className={styles.filterGrid}>
                    <div className={styles.field}>
                      <span>Reviewer</span>
                      <Select value={reviewer} onValueChange={setReviewer}>
                        <SelectTrigger aria-label="Reviewer">
                          <SelectValue placeholder="Select reviewer" />
                        </SelectTrigger>
                        <SelectContent>
                          {reviewers.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className={styles.field}>
                      <span>Decision</span>
                      <Select value={decision} onValueChange={(value) => setDecision(value as CertificationStatus)}>
                        <SelectTrigger aria-label="Review decision">
                          <SelectValue placeholder="Select decision" />
                        </SelectTrigger>
                        <SelectContent>
                          {reviewDecisions.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <label className={styles.field}>
                    <span>Review note</span>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={5}
                      placeholder="Enter the review findings, decision basis, or required follow-up"
                    />
                  </label>
                  <div className={styles.mediaAction}>
                    <button className={styles.primaryButton} type="button" onClick={applyDecision}>
                      <CheckCircle2 size={15} /> Apply Decision
                    </button>
                  </div>
                </WorkflowCard>
                {request.status === "Approved" ? (
                  <WorkflowCard icon={<CreditCard size={17} />} title="Approved Credential Actions">
                    <p className={styles.muted}>Create the resident’s approved sector credential for production.</p>
                    <div className={styles.headerButtonGroup}>
                      <button
                        className={styles.primaryButton}
                        type="button"
                        onClick={() => {
                          const value = createCredential(request.membershipId, "Sector ID");
                          if (value) setMessage(`Sector ID ${value.credentialNumber} added to production.`);
                        }}
                      >
                        <CreditCard size={15} /> Produce Sector ID
                      </button>
                      <button
                        className={styles.secondaryButton}
                        type="button"
                        onClick={() => {
                          const value = createCredential(request.membershipId, "Booklet");
                          if (value) setMessage(`Booklet ${value.credentialNumber} added to production.`);
                        }}
                      >
                        <BookOpenCheck size={15} /> Produce Booklet
                      </button>
                    </div>
                  </WorkflowCard>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export function CredentialsView() {
  const credentials = useSectorRegistryStore((state) => state.credentials);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const rows = credentials.filter((credential) => {
    const resident = residents.find((item) => item.id === credential.residentId);
    return (
      resident &&
      (selectedBarangay === "all" || resident.address.barangayId === selectedBarangay) &&
      (!status || credential.status === status) &&
      (!type || credential.credentialType === type) &&
      (!search ||
        `${credential.credentialNumber} ${formatResidentName(resident)} ${resident.lrn}`
          .toLowerCase()
          .includes(search.toLowerCase()))
    );
  });
  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${dashboardStyles.sectorHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>Sector IDs & Booklets</h1>
            <p>Production, release, validity, and replacement tracking linked to sector memberships.</p>
          </div>
        </div>
      </section>
      <div className={styles.body}>
        <div className={styles.summaryGrid}>
          <SummaryCard icon={<CreditCard size={18} />} value={rows.length} label="Credentials" />
          <SummaryCard
            icon={<Clock3 size={18} />}
            value={rows.filter((item) => item.status === "Pending Production").length}
            label="For production"
          />
          <SummaryCard
            icon={<PackageCheck size={18} />}
            value={rows.filter((item) => item.status === "Ready for Release").length}
            label="Ready for release"
          />
          <SummaryCard
            icon={<RefreshCw size={18} />}
            value={rows.filter((item) => item.status === "Expired").length}
            label="Expired"
          />
        </div>
        <section className={styles.card}>
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                aria-label="Search credentials"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search credential, resident, or LRN"
              />
            </label>
            <select
              className={styles.compactSelect}
              aria-label="Credential type"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="">All types</option>
              <option>Sector ID</option>
              <option>Booklet</option>
            </select>
            <select
              className={styles.compactSelect}
              aria-label="Credential status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              {["Pending Production", "Ready for Release", "Released", "Expired", "Replaced", "Revoked"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className={styles.resultsMeta}>
            <strong>{rows.length} credentials</strong>
            <span>Showing the latest 25</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table} style={{ minWidth: 1000 }}>
              <thead>
                <tr>
                  <th>Credential</th>
                  <th>Resident</th>
                  <th>Sector</th>
                  <th>Type</th>
                  <th>Issued</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 25).map((credential) => {
                  const resident = residents.find((item) => item.id === credential.residentId);
                  const definition = definitions.find((item) => item.code === credential.sectorCode);
                  return (
                    <tr key={credential.id}>
                      <td className={styles.mono}>{credential.credentialNumber}</td>
                      <td>
                        <strong>{resident ? formatResidentName(resident) : "Unknown"}</strong>
                        <br />
                        <small>{resident?.lrn}</small>
                      </td>
                      <td>{definition?.shortName}</td>
                      <td>{credential.credentialType}</td>
                      <td>{credential.issuedAt}</td>
                      <td>{credential.expiresAt}</td>
                      <td>
                        <span className={`${styles.badge} ${statusStyle(credential.status)}`}>{credential.status}</span>
                      </td>
                      <td>
                        <Link
                          className={styles.secondaryButton}
                          href={`/barangay-affairs/sectors/id-booklets/${credential.id}`}
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
    </div>
  );
}

export function CredentialDetailView({ id }: { id: string }) {
  const credentials = useSectorRegistryStore((state) => state.credentials);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const update = useSectorRegistryStore((state) => state.updateCredentialStatus);
  const create = useSectorRegistryStore((state) => state.createCredential);
  const residents = useResidentRegistryStore((state) => state.residents);
  const credential = credentials.find((item) => item.id === id);
  const [message, setMessage] = useState("");
  if (!credential)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <h1>Credential not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/sectors/id-booklets">
            Return to issuance registry
          </Link>
        </div>
      </div>
    );
  const resident = residents.find((item) => item.id === credential.residentId);
  const definition = definitions.find((item) => item.code === credential.sectorCode);
  const move = (status: CredentialStatus) => {
    if (update(credential.id, status)) setMessage(`Credential marked ${status}.`);
  };
  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${dashboardStyles.sectorHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>{credential.credentialNumber}</h1>
            <p>
              {credential.credentialType} · {definition?.name}
            </p>
          </div>
          <Link className={styles.btnSecondary} href="/barangay-affairs/sectors/id-booklets">
            <ArrowLeft size={15} /> Issuance registry
          </Link>
        </div>
      </section>
      <div className={styles.body}>
        {message && <div className={styles.toast}>{message}</div>}
        <div className={styles.detailGrid}>
          <section className={styles.credentialPreview}>
            <div>
              <span>Republic of the Philippines</span>
              <strong>Municipality of Matnog</strong>
              <small>{definition?.name}</small>
            </div>
            <CreditCard size={42} />
            <h2>{resident ? formatResidentName(resident) : "Unknown resident"}</h2>
            <p>{resident?.lrn}</p>
            <strong>{credential.credentialNumber}</strong>
            <small>Valid until {credential.expiresAt}</small>
          </section>
          <aside className={styles.card}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Issuance status</p>
                <h2>
                  <span className={`${styles.badge} ${statusStyle(credential.status)}`}>{credential.status}</span>
                </h2>
              </div>
            </div>
            <dl className={styles.dataList}>
              <div className={styles.dataRow}>
                <dt>Issued</dt>
                <dd>{credential.issuedAt}</dd>
              </div>
              <div className={styles.dataRow}>
                <dt>Expires</dt>
                <dd>{credential.expiresAt}</dd>
              </div>
              <div className={styles.dataRow}>
                <dt>Released by</dt>
                <dd>{credential.releasedBy || "Pending"}</dd>
              </div>
              <div className={styles.dataRow}>
                <dt>Reason</dt>
                <dd>{credential.reason}</dd>
              </div>
            </dl>
            <div className={styles.headerButtonGroup}>
              {credential.status === "Pending Production" && (
                <button className={styles.primaryButton} type="button" onClick={() => move("Ready for Release")}>
                  <PackageCheck size={15} /> Mark ready
                </button>
              )}
              {credential.status === "Ready for Release" && (
                <button className={styles.primaryButton} type="button" onClick={() => move("Released")}>
                  <CheckCircle2 size={15} /> Release
                </button>
              )}
              {(credential.status === "Released" || credential.status === "Expired") && (
                <button
                  className={styles.primaryButton}
                  type="button"
                  onClick={() => {
                    const value = create(credential.membershipId, credential.credentialType, credential.id);
                    if (value) setMessage(`Replacement ${value.credentialNumber} sent to production.`);
                  }}
                >
                  <RefreshCw size={15} /> Create replacement
                </button>
              )}
              {!["Revoked", "Replaced"].includes(credential.status) && (
                <button className={styles.secondaryButton} type="button" onClick={() => move("Revoked")}>
                  Revoke
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export function EligibilityAlertsView() {
  const alerts = useSectorRegistryStore((state) => state.alerts);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const update = useSectorRegistryStore((state) => state.updateAlertStatus);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay } = useBarangayScope();
  const [status, setStatus] = useState("Open");
  const [severity, setSeverity] = useState("");
  const rows = alerts.filter((alert) => {
    const resident = residents.find((item) => item.id === alert.residentId);
    return (
      resident &&
      (selectedBarangay === "all" || resident.address.barangayId === selectedBarangay) &&
      (!status || alert.status === status) &&
      (!severity || alert.severity === severity)
    );
  });
  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${dashboardStyles.sectorHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>Eligibility Alerts</h1>
            <p>Rule-based reminders for eligibility, missing documents, expiry, and renewal.</p>
          </div>
        </div>
      </section>
      <div className={styles.body}>
        <div className={styles.summaryGrid}>
          <SummaryCard
            icon={<BellRing size={18} />}
            value={alerts.filter((item) => item.status === "Open").length}
            label="Open alerts"
          />
          <SummaryCard
            icon={<AlertTriangle size={18} />}
            value={alerts.filter((item) => item.status === "Open" && item.severity === "High").length}
            label="High priority"
          />
          <SummaryCard
            icon={<Clock3 size={18} />}
            value={alerts.filter((item) => item.alertType.includes("Expiring")).length}
            label="Expiry alerts"
          />
          <SummaryCard
            icon={<CheckCircle2 size={18} />}
            value={alerts.filter((item) => item.status === "Resolved").length}
            label="Resolved"
          />
        </div>
        <section className={styles.card}>
          <div className={styles.toolbar}>
            <select
              className={styles.compactSelect}
              aria-label="Alert status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              <option>Open</option>
              <option>Resolved</option>
              <option>Dismissed</option>
            </select>
            <select
              className={styles.compactSelect}
              aria-label="Alert severity"
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
            >
              <option value="">All priorities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <div className={styles.resultsMeta}>
            <strong>{rows.length} alerts</strong>
            <span>Showing the latest 25</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table} style={{ minWidth: 1050 }}>
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Resident</th>
                  <th>Sector</th>
                  <th>Alert</th>
                  <th>Due date</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 25).map((alert) => {
                  const resident = residents.find((item) => item.id === alert.residentId);
                  const definition = definitions.find((item) => item.code === alert.sectorCode);
                  return (
                    <tr key={alert.id}>
                      <td>
                        <span
                          className={`${styles.badge} ${alert.severity === "High" ? styles.danger : alert.severity === "Medium" ? styles.warning : styles.info}`}
                        >
                          {alert.severity}
                        </span>
                      </td>
                      <td>
                        <Link href={`/barangay-affairs/sectors/residents/${alert.residentId}`}>
                          <strong>{resident ? formatResidentName(resident) : "Unknown"}</strong>
                        </Link>
                        <br />
                        <small>{resident?.lrn}</small>
                      </td>
                      <td>{definition?.shortName}</td>
                      <td>{alert.alertType}</td>
                      <td>{alert.dueDate}</td>
                      <td>{alert.detail}</td>
                      <td>
                        <span className={`${styles.badge} ${statusStyle(alert.status)}`}>{alert.status}</span>
                      </td>
                      <td>
                        {alert.status === "Open" ? (
                          <div className={styles.headerButtonGroup}>
                            <button
                              className={styles.primaryButton}
                              type="button"
                              onClick={() => update(alert.id, "Resolved")}
                            >
                              Resolve
                            </button>
                            <button
                              className={styles.secondaryButton}
                              type="button"
                              onClick={() => update(alert.id, "Dismissed")}
                            >
                              Dismiss
                            </button>
                          </div>
                        ) : (
                          "—"
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
    </div>
  );
}

export function ExpiringCredentialsView() {
  const credentials = useSectorRegistryStore((state) => state.credentials);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay } = useBarangayScope();
  const cutoff = "2027-03-31";
  const rows = credentials
    .filter((credential) => {
      const resident = residents.find((item) => item.id === credential.residentId);
      return (
        resident &&
        (selectedBarangay === "all" || resident.address.barangayId === selectedBarangay) &&
        (credential.status === "Expired" || (credential.status === "Released" && credential.expiresAt <= cutoff))
      );
    })
    .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${dashboardStyles.sectorHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>Expiring IDs & Booklets</h1>
            <p>Expired credentials and credentials due within the next six months.</p>
          </div>
        </div>
      </section>
      <div className={styles.body}>
        <div className={styles.summaryGrid}>
          <SummaryCard icon={<AlertTriangle size={18} />} value={rows.length} label="Renewal worklist" />
          <SummaryCard
            icon={<CreditCard size={18} />}
            value={rows.filter((item) => item.credentialType === "Sector ID").length}
            label="Sector IDs"
          />
          <SummaryCard
            icon={<BookOpenCheck size={18} />}
            value={rows.filter((item) => item.credentialType === "Booklet").length}
            label="Booklets"
          />
          <SummaryCard
            icon={<Clock3 size={18} />}
            value={rows.filter((item) => item.status === "Expired").length}
            label="Already expired"
          />
        </div>
        <section className={styles.card}>
          <div className={styles.resultsMeta}>
            <strong>{rows.length} credentials require attention</strong>
            <span>Sorted by expiry date</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table} style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Expires</th>
                  <th>Credential</th>
                  <th>Resident</th>
                  <th>Barangay</th>
                  <th>Sector</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 30).map((credential) => {
                  const resident = residents.find((item) => item.id === credential.residentId);
                  const definition = definitions.find((item) => item.code === credential.sectorCode);
                  return (
                    <tr key={credential.id}>
                      <td>{credential.expiresAt}</td>
                      <td className={styles.mono}>{credential.credentialNumber}</td>
                      <td>
                        <strong>{resident ? formatResidentName(resident) : "Unknown"}</strong>
                      </td>
                      <td>{MATNOG_BARANGAYS.find((item) => item.code === resident?.address.barangayId)?.name}</td>
                      <td>{definition?.shortName}</td>
                      <td>{credential.credentialType}</td>
                      <td>
                        <span className={`${styles.badge} ${statusStyle(credential.status)}`}>{credential.status}</span>
                      </td>
                      <td>
                        <Link
                          className={styles.secondaryButton}
                          href={`/barangay-affairs/sectors/id-booklets/${credential.id}`}
                        >
                          Renew / replace
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
    </div>
  );
}
