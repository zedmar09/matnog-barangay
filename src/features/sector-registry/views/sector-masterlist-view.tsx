"use client";

import { useMemo, useState } from "react";

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
  UserRoundX,
  X,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { calculateAge, formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import dashboardStyles from "@/features/resident-registry/views/resident-dashboard.module.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useSectorRegistryStore } from "../stores/sector-registry-store";

const columns = [
  "resident",
  "lrn",
  "barangay",
  "age",
  "gender",
  "mobile",
  "sectors",
  "active",
  "attention",
  "certified",
  "validity",
  "updated",
  "actions",
] as const;
type Column = (typeof columns)[number];
type SortKey = "resident" | "lrn" | "barangay" | "age" | "active" | "attention" | "updated";
type Filters = {
  search: string;
  sector: string;
  status: string;
  barangayId: string;
  ageMin: string;
  ageMax: string;
  classificationsMin: string;
  classificationsMax: string;
  certification: string;
  validityFrom: string;
  validityTo: string;
  updatedFrom: string;
  updatedTo: string;
};

const EMPTY_FILTERS: Filters = {
  search: "",
  sector: "",
  status: "",
  barangayId: "",
  ageMin: "",
  ageMax: "",
  classificationsMin: "",
  classificationsMax: "",
  certification: "",
  validityFrom: "",
  validityTo: "",
  updatedFrom: "",
  updatedTo: "",
};

const labels: Record<Column, string> = {
  resident: "Resident",
  lrn: "LRN",
  barangay: "Barangay",
  age: "Age",
  gender: "Sex",
  mobile: "Mobile",
  sectors: "Sector Classifications",
  active: "Active",
  attention: "Needs Attention",
  certified: "Barangay Certified",
  validity: "Nearest Validity End",
  updated: "Latest Update",
  actions: "Actions",
};
const fixed = new Set<Column>(["resident", "actions"]);
const defaultHidden = new Set<Column>(["gender", "mobile", "certified", "validity"]);
const sortable: Partial<Record<Column, SortKey>> = {
  resident: "resident",
  lrn: "lrn",
  barangay: "barangay",
  age: "age",
  active: "active",
  attention: "attention",
  updated: "updated",
};

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

export function SectorMasterlistView() {
  const memberships = useSectorRegistryStore((state) => state.memberships);
  const definitions = useSectorRegistryStore((state) => state.definitions);
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
  const [sortKey, setSortKey] = useState<SortKey>("resident");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const scopedRows = useMemo(() => {
    const scope = new Set(selectedBarangays);
    return residents
      .filter((resident) => isAllSelected || scope.has(resident.address.barangayId))
      .map((resident) => {
        const items = memberships.filter((membership) => membership.residentId === resident.id);
        const active = items.filter((membership) => membership.status === "Active").length;
        const attention = items.filter(
          (membership) => membership.status === "Pending Review" || membership.status === "Expired",
        ).length;
        const certified = items.filter((membership) => membership.certifiedByBarangay).length;
        const latestUpdate = [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.updatedAt ?? "";
        const nearestValidity =
          items
            .map((membership) => membership.validityEnd)
            .filter(Boolean)
            .sort()[0] ?? "";
        return {
          resident,
          memberships: items,
          residentName: formatResidentName(resident),
          barangayName: MATNOG_BARANGAYS.find((barangay) => barangay.code === resident.address.barangayId)?.name ?? "—",
          age: calculateAge(resident.birthDate),
          active,
          attention,
          certified,
          latestUpdate,
          nearestValidity,
        };
      })
      .filter((row) => row.memberships.length > 0);
  }, [isAllSelected, memberships, residents, selectedBarangays]);

  const filtered = useMemo(() => {
    const rows = scopedRows.filter((row) => {
      const { resident, memberships: items, residentName, barangayName, age, latestUpdate } = row;
      const query = filters.search.trim().toLowerCase();
      const sectors = items
        .map((membership) => definitions.find((definition) => definition.code === membership.sectorCode)?.name ?? "")
        .join(" ");
      const haystack =
        `${residentName} ${resident.lrn} ${resident.contact.primaryMobile} ${barangayName} ${sectors}`.toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (filters.sector && !items.some((membership) => membership.sectorCode === filters.sector)) return false;
      if (filters.status && !items.some((membership) => membership.status === filters.status)) return false;
      if (filters.barangayId && resident.address.barangayId !== filters.barangayId) return false;
      if (filters.ageMin && age < Number(filters.ageMin)) return false;
      if (filters.ageMax && age > Number(filters.ageMax)) return false;
      if (filters.classificationsMin && items.length < Number(filters.classificationsMin)) return false;
      if (filters.classificationsMax && items.length > Number(filters.classificationsMax)) return false;
      if (filters.certification === "certified" && !items.some((membership) => membership.certifiedByBarangay))
        return false;
      if (filters.certification === "uncertified" && !items.some((membership) => !membership.certifiedByBarangay))
        return false;
      if (
        filters.validityFrom &&
        !items.some((membership) => membership.validityEnd && membership.validityEnd >= filters.validityFrom)
      )
        return false;
      if (
        filters.validityTo &&
        !items.some((membership) => membership.validityEnd && membership.validityEnd <= filters.validityTo)
      )
        return false;
      if (filters.updatedFrom && latestUpdate.slice(0, 10) < filters.updatedFrom) return false;
      if (filters.updatedTo && latestUpdate.slice(0, 10) > filters.updatedTo) return false;
      return true;
    });

    const value = (row: (typeof rows)[number]) => {
      if (sortKey === "resident") return row.residentName;
      if (sortKey === "lrn") return row.resident.lrn;
      if (sortKey === "barangay") return row.barangayName;
      if (sortKey === "age") return row.age;
      if (sortKey === "active") return row.active;
      if (sortKey === "attention") return row.attention;
      return row.latestUpdate;
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
  }, [definitions, direction, filters, scopedRows, sortKey]);

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
            {labels[column]}
            <ChevronsUpDown size={12} />
          </button>
        ) : (
          labels[column]
        )}
      </th>
    );
  };

  function exportReport() {
    const headers = [
      "Resident",
      "LRN",
      "Barangay",
      "Age",
      "Sex",
      "Mobile",
      "Sector Classifications",
      "Active",
      "Needs Attention",
      "Barangay Certified",
      "Nearest Validity End",
      "Latest Update",
    ];
    const values = filtered.map((row) => [
      row.residentName,
      row.resident.lrn,
      row.barangayName,
      row.age,
      row.resident.gender,
      row.resident.contact.primaryMobile,
      row.memberships
        .map(
          (membership) =>
            `${definitions.find((definition) => definition.code === membership.sectorCode)?.shortName ?? membership.sectorCode} (${membership.status})`,
        )
        .join("; "),
      row.active,
      row.attention,
      `${row.certified} of ${row.memberships.length}`,
      row.nearestValidity,
      row.latestUpdate.slice(0, 10),
    ]);
    const csv = [headers, ...values].map((line) => line.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sectoral-masterlist-${new Date().toISOString().slice(0, 10)}.csv`;
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
            <h1>Consolidated Sectoral Masterlist</h1>
            <p>Search and maintain every resident’s sector classifications, validity, and review status.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href="/barangay-affairs/sectors/assign">
              <Plus size={16} /> Assign Sector
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
                aria-label="Search sectoral residents"
                value={filters.search}
                onChange={(event) => setFilter("search", event.target.value)}
                placeholder="Search resident name, LRN, mobile, barangay, or sector"
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
              <SelectTrigger className={styles.compactSelect} aria-label="Membership status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                {(["Active", "Pending Review", "Expired", "Inactive"] as const).map((status) => (
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
                <Field
                  label="Age from"
                  type="number"
                  value={filters.ageMin}
                  onChange={(value) => setFilter("ageMin", value)}
                  placeholder="e.g. 18"
                />
                <Field
                  label="Age to"
                  type="number"
                  value={filters.ageMax}
                  onChange={(value) => setFilter("ageMax", value)}
                  placeholder="e.g. 60"
                />
                <Field
                  label="Classifications from"
                  type="number"
                  value={filters.classificationsMin}
                  onChange={(value) => setFilter("classificationsMin", value)}
                  placeholder="e.g. 1"
                />
                <Field
                  label="Classifications to"
                  type="number"
                  value={filters.classificationsMax}
                  onChange={(value) => setFilter("classificationsMax", value)}
                  placeholder="e.g. 3"
                />
                <FilterSelect
                  label="Barangay certification"
                  value={filters.certification}
                  placeholder="All certification states"
                  options={[
                    ["certified", "Has barangay-certified record"],
                    ["uncertified", "Has record awaiting certification"],
                  ]}
                  onChange={(value) => setFilter("certification", value)}
                />
                <Field
                  label="Validity ending from"
                  type="date"
                  value={filters.validityFrom}
                  onChange={(value) => setFilter("validityFrom", value)}
                  placeholder="Select start date"
                />
                <Field
                  label="Validity ending to"
                  type="date"
                  value={filters.validityTo}
                  onChange={(value) => setFilter("validityTo", value)}
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
              </div>
            </div>
          )}

          <div className={styles.resultsMeta}>
            <strong>
              {filtered.length === scopedRows.length
                ? `${filtered.length.toLocaleString()} classified residents`
                : `${filtered.length.toLocaleString()} of ${scopedRows.length.toLocaleString()} classified residents`}
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
                    {rows.map((row) => (
                      <tr key={row.resident.id}>
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
                        {show("age") && <td>{row.age}</td>}
                        {show("gender") && <td>{row.resident.gender}</td>}
                        {show("mobile") && <td>{row.resident.contact.primaryMobile || "—"}</td>}
                        {show("sectors") && (
                          <td>
                            <div className={styles.sectorBadges}>
                              {row.memberships.map((membership) => {
                                const definition = definitions.find((item) => item.code === membership.sectorCode);
                                return (
                                  <span
                                    key={membership.id}
                                    title={`${definition?.name ?? membership.sectorCode} · ${membership.status}`}
                                    style={{ borderColor: definition?.color, color: definition?.color }}
                                  >
                                    {definition?.shortName ?? membership.sectorCode}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        )}
                        {show("active") && <td>{row.active}</td>}
                        {show("attention") && (
                          <td>
                            <span className={`${styles.badge} ${row.attention ? styles.warning : styles.active}`}>
                              {row.attention ? `${row.attention} to review` : "No action needed"}
                            </span>
                          </td>
                        )}
                        {show("certified") && (
                          <td>
                            {row.certified} of {row.memberships.length}
                          </td>
                        )}
                        {show("validity") && (
                          <td>
                            {row.nearestValidity
                              ? new Date(row.nearestValidity).toLocaleDateString("en-PH")
                              : "No fixed expiry"}
                          </td>
                        )}
                        {show("updated") && <td>{new Date(row.latestUpdate).toLocaleDateString("en-PH")}</td>}
                        {show("actions") && (
                          <td>
                            <details className={styles.rowActions}>
                              <summary className={styles.actionSummary} aria-label={`Actions for ${row.residentName}`}>
                                <MoreHorizontal size={16} />
                              </summary>
                              <div className={styles.actionMenu}>
                                <Link href={`/barangay-affairs/sectors/residents/${row.resident.id}`}>
                                  View sector profile
                                </Link>
                                <Link href={`/barangay-affairs/sectors/assign?resident=${row.resident.id}`}>
                                  Edit classifications
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
                <h3>No classified residents found</h3>
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
