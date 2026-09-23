"use client";

import { useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Columns3,
  Filter,
  MoreHorizontal,
  Search,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
import type { ResidentFilters, ResidentSortKey } from "../types/resident";
import {
  calculateAge,
  EMPTY_FILTERS,
  filterResidents,
  formatResidentAddress,
  formatResidentName,
  isSenior,
  sortResidents,
} from "../utils/resident-utils";

const columns = [
  "photo",
  "lrn",
  "name",
  "barangay",
  "gender",
  "birthDate",
  "age",
  "senior",
  "pwd",
  "civilStatus",
  "citizenship",
  "location",
  "address",
  "mobile",
  "occupation",
  "status",
  "updated",
  "actions",
] as const;
type Column = (typeof columns)[number];
const labels: Record<Column, string> = {
  photo: "Photo",
  lrn: "LRN",
  name: "Full Name",
  barangay: "Barangay",
  gender: "Gender",
  birthDate: "Birth Date",
  age: "Age",
  senior: "Senior",
  pwd: "PWD",
  civilStatus: "Civil Status",
  citizenship: "Citizenship",
  location: "Purok / Sitio",
  address: "Address",
  mobile: "Mobile",
  occupation: "Occupation",
  status: "Status",
  updated: "Updated",
  actions: "Actions",
};
const fixed = new Set<Column>(["lrn", "name", "actions"]);
const sortable: Partial<Record<Column, ResidentSortKey>> = {
  lrn: "lrn",
  name: "name",
  barangay: "barangay",
  birthDate: "birthDate",
  age: "age",
  civilStatus: "civilStatus",
  location: "purok",
  occupation: "occupation",
  status: "residentStatus",
  updated: "updatedAt",
};

function statusClass(status: string) {
  return status === "Active"
    ? styles.active
    : status === "Deceased" || status === "Merged"
      ? styles.danger
      : status === "Transferred Out"
        ? styles.warning
        : "";
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  children?: React.ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the reusable control is supplied directly or through children.
    <label className={styles.field}>
      <span>{label}</span>
      {children ?? <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}

export function ResidentMasterlistView() {
  const residents = useResidentRegistryStore((s) => s.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [filters, setFilters] = useState<ResidentFilters>(EMPTY_FILTERS);
  const [more, setMore] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visible, setVisible] = useState<Set<Column>>(new Set(columns));
  const [sortKey, setSortKey] = useState<ResidentSortKey>("name");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const scopedTotal = useMemo(
    () => residents.filter((r) => selectedBarangay === "all" || r.address.barangayId === selectedBarangay).length,
    [residents, selectedBarangay],
  );
  const filtered = useMemo(
    () => sortResidents(filterResidents(residents, filters, selectedBarangay), sortKey, direction),
    [residents, filters, selectedBarangay, sortKey, direction],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const activeCount = Object.values(filters).filter(Boolean).length;
  const show = (c: Column) => visible.has(c) && (c !== "barangay" || selectedBarangay === "all");
  const setFilter = (key: keyof ResidentFilters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };
  const doSort = (key: ResidentSortKey) => {
    if (sortKey === key) setDirection((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setDirection("asc");
    }
  };
  const th = (column: Column) => {
    const sortColumn = sortable[column];
    return (
      <th key={column}>
        {sortColumn ? (
          <button type="button" className={styles.sortButton} onClick={() => doSort(sortColumn)}>
            {labels[column]}
            <ChevronsUpDown size={12} />
          </button>
        ) : (
          labels[column]
        )}
      </th>
    );
  };
  const reset = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A1 Resident Registry</p>
          <h1>Resident Masterlist</h1>
          <p>Search, review, and maintain the municipality’s resident identity records.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/residents/register">
          <UserPlus size={15} /> Register resident
        </Link>
      </header>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search residents"
              placeholder="Search LRN, name, nickname, or mobile"
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
            />
          </label>
          <button
            type="button"
            className={`${styles.secondaryButton} ${styles.filterButton}`}
            onClick={() => setMore((v) => !v)}
          >
            <Filter size={14} /> More filters{" "}
            {activeCount > 0 && <span className={styles.filterCount}>{activeCount}</span>}
          </button>
          <div className={styles.columnsMenu}>
            <button type="button" className={styles.secondaryButton} onClick={() => setColumnsOpen((v) => !v)}>
              <Columns3 size={14} /> Columns
            </button>
            {columnsOpen && (
              <div className={styles.columnsPopover}>
                {columns
                  .filter((c) => c !== "barangay" || selectedBarangay === "all")
                  .map((c) => (
                    <label key={c}>
                      <input
                        type="checkbox"
                        checked={visible.has(c)}
                        disabled={fixed.has(c)}
                        onChange={() =>
                          setVisible((current) => {
                            const next = new Set(current);
                            next.has(c) ? next.delete(c) : next.add(c);
                            return next;
                          })
                        }
                      />
                      {labels[c]}
                    </label>
                  ))}
              </div>
            )}
          </div>
          {activeCount > 0 && (
            <button type="button" className={styles.secondaryButton} onClick={reset}>
              <X size={14} /> Clear
            </button>
          )}
        </div>
        <div className={styles.filtersBar}>
          <select
            className={styles.compactSelect}
            aria-label="Purok filter"
            value={filters.purok}
            onChange={(e) => setFilter("purok", e.target.value)}
          >
            <option value="">All puroks</option>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n}>Purok {n}</option>
            ))}
          </select>
          <select
            className={styles.compactSelect}
            aria-label="Gender filter"
            value={filters.gender}
            onChange={(e) => setFilter("gender", e.target.value)}
          >
            <option value="">All genders</option>
            <option>Male</option>
            <option>Female</option>
          </select>
          <select
            className={styles.compactSelect}
            aria-label="Civil status filter"
            value={filters.civilStatus}
            onChange={(e) => setFilter("civilStatus", e.target.value)}
          >
            <option value="">All civil statuses</option>
            {["Single", "Married", "Widowed", "Separated", "Divorced", "Other"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            className={styles.compactSelect}
            aria-label="Resident status filter"
            value={filters.residentStatus}
            onChange={(e) => setFilter("residentStatus", e.target.value)}
          >
            <option value="">All statuses</option>
            {["Active", "Inactive", "Transferred Out", "Deceased", "Merged"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            className={styles.compactSelect}
            aria-label="Senior filter"
            value={filters.senior}
            onChange={(e) => setFilter("senior", e.target.value)}
          >
            <option value="">Senior: All</option>
            <option value="yes">Senior: Yes</option>
            <option value="no">Senior: No</option>
          </select>
          <select
            className={styles.compactSelect}
            aria-label="PWD filter"
            value={filters.pwd}
            onChange={(e) => setFilter("pwd", e.target.value)}
          >
            <option value="">PWD: All</option>
            <option value="yes">PWD: Yes</option>
            <option value="no">PWD: No</option>
          </select>
        </div>
        {more && (
          <div className={styles.advancedPanel}>
            <h3>Advanced filters</h3>
            <div className={styles.filterGrid}>
              {(
                [
                  ["lrn", "LRN"],
                  ["firstName", "First name"],
                  ["middleName", "Middle name"],
                  ["lastName", "Last name"],
                  ["nickname", "Nickname"],
                  ["birthLocality", "Birth locality"],
                  ["birthMunicipality", "Birth municipality / city"],
                  ["birthProvince", "Birth province"],
                  ["birthRegion", "Birth region"],
                  ["birthCountry", "Birth country"],
                  ["primaryCitizenship", "Primary citizenship"],
                  ["secondaryCitizenship", "Secondary citizenship"],
                  ["sitio", "Sitio"],
                  ["zone", "Zone"],
                  ["street", "Street"],
                  ["subdivision", "Subdivision / village"],
                  ["postalCode", "Postal code"],
                  ["occupation", "Occupation"],
                  ["employer", "Employer"],
                ] as [keyof ResidentFilters, string][]
              ).map(([k, l]) => (
                <Field key={k} label={l} value={filters[k]} onChange={(v) => setFilter(k, v)} />
              ))}
              {selectedBarangay === "all" && (
                <label className={styles.field}>
                  <span>Barangay</span>
                  <select value={filters.barangayId} onChange={(e) => setFilter("barangayId", e.target.value)}>
                    <option value="">All barangays</option>
                    {MATNOG_BARANGAYS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <Field
                label="Birth date from"
                type="date"
                value={filters.birthDateFrom}
                onChange={(v) => setFilter("birthDateFrom", v)}
              />
              <Field
                label="Birth date to"
                type="date"
                value={filters.birthDateTo}
                onChange={(v) => setFilter("birthDateTo", v)}
              />
              <Field label="Age from" type="number" value={filters.ageFrom} onChange={(v) => setFilter("ageFrom", v)} />
              <Field label="Age to" type="number" value={filters.ageTo} onChange={(v) => setFilter("ageTo", v)} />
              <label className={styles.field}>
                <span>Employment status</span>
                <select
                  value={filters.employmentStatus}
                  onChange={(e) => setFilter("employmentStatus", e.target.value)}
                >
                  <option value="">All</option>
                  {["Employed", "Self-employed", "Unemployed", "Student", "Retired", "Not Applicable", "Other"].map(
                    (v) => (
                      <option key={v}>{v}</option>
                    ),
                  )}
                </select>
              </label>
              {(
                [
                  ["hasMobile", "Has primary mobile"],
                  ["hasSecondaryMobile", "Has secondary mobile"],
                  ["hasLandline", "Has landline"],
                  ["hasEmail", "Has email"],
                  ["philsys", "Has PhilSys reference"],
                ] as [keyof ResidentFilters, string][]
              ).map(([k, l]) => (
                <label className={styles.field} key={k}>
                  <span>{l}</span>
                  <select value={filters[k]} onChange={(e) => setFilter(k, e.target.value)}>
                    <option value="">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
              ))}
              <label className={styles.field}>
                <span>Missing information</span>
                <select value={filters.completeness} onChange={(e) => setFilter("completeness", e.target.value)}>
                  <option value="">Any completeness</option>
                  <option value="photo">Missing photo</option>
                  <option value="mobile">Missing mobile</option>
                  <option value="email">Missing email</option>
                  <option value="occupation">Missing occupation</option>
                  <option value="birthPlace">Missing birth place</option>
                  <option value="address">Missing address details</option>
                  <option value="citizenship">Missing citizenship</option>
                </select>
              </label>
              <Field
                label="Registration from"
                type="date"
                value={filters.registrationDateFrom}
                onChange={(v) => setFilter("registrationDateFrom", v)}
              />
              <Field
                label="Registration to"
                type="date"
                value={filters.registrationDateTo}
                onChange={(v) => setFilter("registrationDateTo", v)}
              />
              <Field
                label="Updated from"
                type="date"
                value={filters.updatedFrom}
                onChange={(v) => setFilter("updatedFrom", v)}
              />
              <Field
                label="Updated to"
                type="date"
                value={filters.updatedTo}
                onChange={(v) => setFilter("updatedTo", v)}
              />
            </div>
          </div>
        )}
        <div className={styles.resultsMeta}>
          <strong>
            {filtered.length === scopedTotal
              ? `${filtered.length.toLocaleString()} residents`
              : `${filtered.length.toLocaleString()} of ${scopedTotal.toLocaleString()} residents`}
            {selectedBarangay === "all"
              ? ` across ${MATNOG_BARANGAYS.length} barangays`
              : ` in ${selectedBarangayName}`}
          </strong>
          <span>Session dummy data · changes reset on reload</span>
        </div>
        {rows.length ? (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>{columns.filter(show).map(th)}</tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const barangay = MATNOG_BARANGAYS.find((b) => b.code === r.address.barangayId)?.name ?? "—";
                    return (
                      <tr key={r.id}>
                        {show("photo") && (
                          <td>
                            <span className={styles.avatarSm}>
                              {r.photoUrl ? (
                                <Image src={r.photoUrl} alt="" width={30} height={30} unoptimized />
                              ) : (
                                `${r.firstName[0]}${r.lastName[0]}`
                              )}
                            </span>
                          </td>
                        )}
                        {show("lrn") && <td className={styles.mono}>{r.lrn}</td>}
                        {show("name") && (
                          <td>
                            <div className={styles.nameCell}>
                              <Link href={`/barangay-affairs/residents/${r.id}`}>{formatResidentName(r)}</Link>
                              <small>{r.nickname ? `“${r.nickname}”` : "No alias"}</small>
                            </div>
                          </td>
                        )}
                        {show("barangay") && <td>{barangay}</td>}
                        {show("gender") && <td>{r.gender}</td>}
                        {show("birthDate") && <td>{r.birthDate}</td>}
                        {show("age") && <td>{calculateAge(r.birthDate)}</td>}
                        {show("senior") && (
                          <td>
                            {isSenior(r.birthDate) ? (
                              <span className={`${styles.badge} ${styles.info}`}>Senior</span>
                            ) : (
                              "—"
                            )}
                          </td>
                        )}
                        {show("pwd") && (
                          <td>{r.isPwd ? <span className={`${styles.badge} ${styles.warning}`}>PWD</span> : "—"}</td>
                        )}
                        {show("civilStatus") && <td>{r.civilStatus}</td>}
                        {show("citizenship") && <td>{r.primaryCitizenship || "—"}</td>}
                        {show("location") && (
                          <td>{[r.address.purok, r.address.sitio].filter(Boolean).join(" / ") || "—"}</td>
                        )}
                        {show("address") && (
                          <td title={formatResidentAddress(r.address, false)}>
                            {formatResidentAddress(r.address, false).slice(0, 34) || "—"}
                          </td>
                        )}
                        {show("mobile") && <td>{r.contact.primaryMobile || "—"}</td>}
                        {show("occupation") && <td>{r.occupation || "—"}</td>}
                        {show("status") && (
                          <td>
                            <span className={`${styles.badge} ${statusClass(r.residentStatus)}`}>
                              {r.residentStatus}
                            </span>
                          </td>
                        )}
                        {show("updated") && <td>{new Date(r.updatedAt).toLocaleDateString("en-PH")}</td>}
                        {show("actions") && (
                          <td>
                            <details className={styles.rowActions}>
                              <summary className={styles.actionSummary}>
                                <MoreHorizontal size={16} />
                              </summary>
                              <div className={styles.actionMenu}>
                                <Link href={`/barangay-affairs/residents/${r.id}`}>View resident</Link>
                                <Link href={`/barangay-affairs/residents/${r.id}/edit`}>Edit resident</Link>
                                <button type="button" onClick={() => navigator.clipboard.writeText(r.lrn)}>
                                  Copy LRN
                                </button>
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
              <select
                className={styles.compactSelect}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[25, 50, 100].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
              <span>
                {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
              </span>
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </>
        ) : (
          <div className={styles.empty}>
            <div>
              <UsersRound size={28} />
              <h3>No residents found</h3>
              <p>Adjust the search or clear the active filters.</p>
              <button type="button" className={styles.secondaryButton} onClick={reset}>
                Reset filters
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
