"use client";

import { useMemo, useState } from "react";

import Image from "next/image";
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
  Search,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

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
  "nickname",
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
  nickname: "Alias",
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
const defaultHidden = new Set<Column>(["photo", "location", "address", "updated", "occupation", "nickname", "citizenship"]);
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
  placeholder,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the reusable control is supplied directly or through children.
    <label className={styles.field}>
      <span>{label}</span>
      {children ?? <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}

export function ResidentMasterlistView() {
  const residents = useResidentRegistryStore((s) => s.residents);
  const { selectedBarangay, selectedBarangayName, isAllSelected, selectedBarangays } = useBarangayScope();
  const [filters, setFilters] = useState<ResidentFilters>(EMPTY_FILTERS);
  const [more, setMore] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visible, setVisible] = useState<Set<Column>>(() => {
    const initial = new Set(columns as readonly Column[]);
    for (const c of defaultHidden) initial.delete(c);
    return initial;
  });
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

  const barangayScopeBadge = isAllSelected
    ? "All Barangays"
    : selectedBarangays.length === 1
      ? selectedBarangayName
      : `${selectedBarangays.length} Barangays`;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <h1>Resident Masterlist</h1>
            <p>Search, review, and maintain the municipality&#39;s resident identity records.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href="/barangay-affairs/residents/register">
              <UserPlus size={16} /> Register Resident
            </Link>
            <button type="button" className={styles.btnSecondary}>
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
              aria-label="Search residents"
              placeholder="Search LRN, name, nickname, or mobile"
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
            />
          </label>
          <Select value={filters.residentStatus} onValueChange={(v) => setFilter("residentStatus", v === "__all__" ? "" : v)}>
            <SelectTrigger className={styles.compactSelect} aria-label="Resident status filter">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              {["Active", "Inactive", "Transferred Out", "Deceased", "Merged"].map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        {more && (
          <div className={styles.advancedPanel}>
            <h3>Advanced filters</h3>
            <div className={styles.filterGrid}>
              <Field label="Purok" value={filters.purok} onChange={(v) => setFilter("purok", v)}>
                <Select value={filters.purok} onValueChange={(v) => setFilter("purok", v === "__all__" ? "" : v)}>
                  <SelectTrigger aria-label="Purok filter"><SelectValue placeholder="All puroks" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All puroks</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <SelectItem key={n} value={`Purok ${n}`}>Purok {n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Gender" value={filters.gender} onChange={(v) => setFilter("gender", v)}>
                <Select value={filters.gender} onValueChange={(v) => setFilter("gender", v === "__all__" ? "" : v)}>
                  <SelectTrigger aria-label="Gender filter"><SelectValue placeholder="All genders" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All genders</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Civil Status" value={filters.civilStatus} onChange={(v) => setFilter("civilStatus", v)}>
                <Select value={filters.civilStatus} onValueChange={(v) => setFilter("civilStatus", v === "__all__" ? "" : v)}>
                  <SelectTrigger aria-label="Civil status filter"><SelectValue placeholder="All civil statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All civil statuses</SelectItem>
                    {["Single", "Married", "Widowed", "Separated", "Divorced", "Other"].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Employment Status" value={filters.employmentStatus} onChange={(v) => setFilter("employmentStatus", v)}>
                <Select value={filters.employmentStatus} onValueChange={(v) => setFilter("employmentStatus", v === "__all__" ? "" : v)}>
                  <SelectTrigger aria-label="Employment status"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All</SelectItem>
                    {["Employed", "Self-employed", "Unemployed", "Student", "Retired", "Not Applicable", "Other"].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <label className={styles.checkboxField}>
                <input
                  type="checkbox"
                  checked={filters.senior === "yes"}
                  onChange={(e) => setFilter("senior", e.target.checked ? "yes" : "")}
                />
                Senior citizen only
              </label>
              <label className={styles.checkboxField}>
                <input
                  type="checkbox"
                  checked={filters.pwd === "yes"}
                  onChange={(e) => setFilter("pwd", e.target.checked ? "yes" : "")}
                />
                PWD only
              </label>
              {(
                [
                  ["lrn", "LRN", "e.g. LRN-000000000001"],
                  ["firstName", "First name", "e.g. Juan"],
                  ["middleName", "Middle name", "e.g. Santos"],
                  ["lastName", "Last name", "e.g. Dela Cruz"],
                  ["nickname", "Nickname", "e.g. Jun"],
                  ["birthLocality", "Birth locality", "e.g. Matnog"],
                  ["birthMunicipality", "Birth municipality", "e.g. Matnog"],
                  ["birthProvince", "Birth province", "e.g. Sorsogon"],
                  ["primaryCitizenship", "Citizenship", "e.g. Filipino"],
                  ["sitio", "Sitio", "e.g. Centro"],
                  ["zone", "Zone", "e.g. Zone 1"],
                  ["street", "Street", "e.g. Rizal St."],
                  ["subdivision", "Subdivision", "e.g. Matnog Village"],
                  ["postalCode", "Postal code", "e.g. 4708"],
                  ["occupation", "Occupation", "e.g. Farmer"],
                  ["employer", "Employer", "e.g. LGU Matnog"],
                ] as [keyof ResidentFilters, string, string][]
              ).map(([k, l, ph]) => (
                <Field key={k} label={l} value={filters[k]} onChange={(v) => setFilter(k, v)} placeholder={ph} />
              ))}
              {selectedBarangay === "all" && (
                <Field label="Barangay" value={filters.barangayId} onChange={(v) => setFilter("barangayId", v)}>
                  <Select value={filters.barangayId} onValueChange={(v) => setFilter("barangayId", v === "__all__" ? "" : v)}>
                    <SelectTrigger aria-label="Barangay filter"><SelectValue placeholder="All barangays" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All barangays</SelectItem>
                      {MATNOG_BARANGAYS.map((b) => (
                        <SelectItem key={b.code} value={b.code}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <Field label="Birth date from" type="date" value={filters.birthDateFrom} onChange={(v) => setFilter("birthDateFrom", v)} />
              <Field label="Birth date to" type="date" value={filters.birthDateTo} onChange={(v) => setFilter("birthDateTo", v)} />
              <Field label="Age from" type="number" value={filters.ageFrom} onChange={(v) => setFilter("ageFrom", v)} placeholder="e.g. 18" />
              <Field label="Age to" type="number" value={filters.ageTo} onChange={(v) => setFilter("ageTo", v)} placeholder="e.g. 60" />
              <Field label="Missing information" value={filters.completeness} onChange={(v) => setFilter("completeness", v)}>
                <Select value={filters.completeness} onValueChange={(v) => setFilter("completeness", v === "__all__" ? "" : v)}>
                  <SelectTrigger aria-label="Completeness"><SelectValue placeholder="Any completeness" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Any completeness</SelectItem>
                    <SelectItem value="photo">Missing photo</SelectItem>
                    <SelectItem value="mobile">Missing mobile</SelectItem>
                    <SelectItem value="email">Missing email</SelectItem>
                    <SelectItem value="occupation">Missing occupation</SelectItem>
                    <SelectItem value="birthPlace">Missing birth place</SelectItem>
                    <SelectItem value="address">Missing address details</SelectItem>
                    <SelectItem value="citizenship">Missing citizenship</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Registration from" type="date" value={filters.registrationDateFrom} onChange={(v) => setFilter("registrationDateFrom", v)} />
              <Field label="Registration to" type="date" value={filters.registrationDateTo} onChange={(v) => setFilter("registrationDateTo", v)} />
              <Field label="Updated from" type="date" value={filters.updatedFrom} onChange={(v) => setFilter("updatedFrom", v)} />
              <Field label="Updated to" type="date" value={filters.updatedTo} onChange={(v) => setFilter("updatedTo", v)} />
            </div>
          </div>
        )}
        <div className={styles.resultsMeta}>
          <strong>
            {filtered.length === scopedTotal
              ? `${filtered.length.toLocaleString()} residents`
              : `${filtered.length.toLocaleString()} of ${scopedTotal.toLocaleString()} residents`}
          </strong>
          <span className={styles.scopeBadge}><MapPin size={13} /> {barangayScopeBadge}</span>
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
                            </div>
                          </td>
                        )}
                        {show("nickname") && <td>{r.nickname || "—"}</td>}
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
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className={styles.compactSelect} aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    </div>
  );
}
