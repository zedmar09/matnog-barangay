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
  Home,
  HousePlus,
  MapPin,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useHouseholdRegistryStore } from "../stores/household-registry-store";
import { formatStructureAddress, householdRiskLabels, isHouseholdStale } from "../utils/household-utils";

const columns = [
  "number",
  "head",
  "barangay",
  "structure",
  "address",
  "members",
  "income",
  "livelihood",
  "foodSecurity",
  "priority",
  "verified",
  "verification",
  "status",
  "actions",
] as const;
type Column = (typeof columns)[number];
type SortKey = "number" | "head" | "barangay" | "members" | "income" | "verified" | "status";
type Filters = {
  search: string;
  status: string;
  verification: string;
  barangayId: string;
  purok: string;
  income: string;
  livelihood: string;
  foodSecurity: string;
  vulnerability: string;
  material: string;
  tenure: string;
  water: string;
  toilet: string;
  power: string;
  internet: string;
  membersMin: string;
  membersMax: string;
  verifiedFrom: string;
  verifiedTo: string;
};

const EMPTY_FILTERS: Filters = {
  search: "",
  status: "",
  verification: "",
  barangayId: "",
  purok: "",
  income: "",
  livelihood: "",
  foodSecurity: "",
  vulnerability: "",
  material: "",
  tenure: "",
  water: "",
  toilet: "",
  power: "",
  internet: "",
  membersMin: "",
  membersMax: "",
  verifiedFrom: "",
  verifiedTo: "",
};
const labels: Record<Column, string> = {
  number: "Household No.",
  head: "Household Head",
  barangay: "Barangay",
  structure: "Structure",
  address: "Address",
  members: "Members",
  income: "Income",
  livelihood: "Livelihood",
  foodSecurity: "Food Security",
  priority: "Priority Needs",
  verified: "Last Verified",
  verification: "Record Status",
  status: "Household Status",
  actions: "Actions",
};
const fixed = new Set<Column>(["number", "head", "actions"]);
const defaultHidden = new Set<Column>(["structure", "address", "livelihood", "foodSecurity", "verified"]);
const sortable: Partial<Record<Column, SortKey>> = {
  number: "number",
  head: "head",
  barangay: "barangay",
  members: "members",
  income: "income",
  verified: "verified",
  status: "status",
};
const incomeOptions = ["Below ₱10,000", "₱10,000–₱19,999", "₱20,000–₱39,999", "₱40,000 and above"];
const livelihoodOptions = [
  "Farming",
  "Fishing",
  "Retail / sari-sari store",
  "Construction",
  "Transport",
  "Government service",
  "Tourism services",
];
const foodOptions = ["Food secure", "Mild concern", "Moderate concern", "Needs immediate assessment"];
const riskOptions = [
  "Senior",
  "PWD",
  "Pregnant / lactating",
  "Under 5",
  "Solo parent",
  "Bedridden / oxygen-dependent",
  "IP",
];

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

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function HouseholdMasterlistView() {
  const households = useHouseholdRegistryStore((state) => state.households);
  const structures = useHouseholdRegistryStore((state) => state.structures);
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
  const [sortKey, setSortKey] = useState<SortKey>("head");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const scopedRows = useMemo(() => {
    const scope = new Set(selectedBarangays);
    return households
      .filter((household) => isAllSelected || scope.has(household.barangayId))
      .map((household) => {
        const head = residents.find((resident) => resident.id === household.headResidentId);
        const structure = structures.find((item) => item.id === household.structureId);
        return {
          household,
          head,
          structure,
          headName: head ? formatResidentName(head) : "Unknown household head",
          barangayName: MATNOG_BARANGAYS.find((barangay) => barangay.code === household.barangayId)?.name ?? "—",
          memberCount: household.members.filter((member) => !member.leftAt).length,
          risks: householdRiskLabels(household),
        };
      });
  }, [households, isAllSelected, residents, selectedBarangays, structures]);

  const filtered = useMemo(() => {
    const rows = scopedRows.filter(({ household, head, structure, headName, barangayName, memberCount, risks }) => {
      const query = filters.search.trim().toLowerCase();
      const haystack =
        `${household.householdNumber} ${headName} ${head?.lrn ?? ""} ${structure?.structureCode ?? ""} ${structure ? formatStructureAddress(structure) : ""}`.toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (filters.status && household.status !== filters.status) return false;
      if (filters.verification === "current" && isHouseholdStale(household)) return false;
      if (filters.verification === "update" && !isHouseholdStale(household)) return false;
      if (filters.barangayId && household.barangayId !== filters.barangayId) return false;
      if (filters.purok && !structure?.purok.toLowerCase().includes(filters.purok.toLowerCase())) return false;
      if (filters.income && household.monthlyIncomeBracket !== filters.income) return false;
      if (filters.livelihood && household.primaryLivelihood !== filters.livelihood) return false;
      if (filters.foodSecurity && household.foodSecurity !== filters.foodSecurity) return false;
      if (filters.vulnerability && !risks.includes(filters.vulnerability)) return false;
      if (filters.material && structure?.dwelling.constructionMaterial !== filters.material) return false;
      if (filters.tenure && structure?.dwelling.tenure !== filters.tenure) return false;
      if (filters.water && structure?.dwelling.waterSource !== filters.water) return false;
      if (filters.toilet && structure?.dwelling.toiletFacility !== filters.toilet) return false;
      if (filters.power && structure?.dwelling.powerSource !== filters.power) return false;
      if (filters.internet && structure?.dwelling.internetAccess !== filters.internet) return false;
      if (filters.membersMin && memberCount < Number(filters.membersMin)) return false;
      if (filters.membersMax && memberCount > Number(filters.membersMax)) return false;
      if (filters.verifiedFrom && household.lastVerifiedAt.slice(0, 10) < filters.verifiedFrom) return false;
      if (filters.verifiedTo && household.lastVerifiedAt.slice(0, 10) > filters.verifiedTo) return false;
      return Boolean(barangayName);
    });
    const value = (row: (typeof rows)[number]) => {
      if (sortKey === "number") return row.household.householdNumber;
      if (sortKey === "head") return row.headName;
      if (sortKey === "barangay") return row.barangayName;
      if (sortKey === "members") return row.memberCount;
      if (sortKey === "income") return row.household.monthlyIncomeBracket;
      if (sortKey === "verified") return row.household.lastVerifiedAt;
      return row.household.status;
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
      "Household Number",
      "Household Head",
      "Barangay",
      "Structure",
      "Address",
      "Members",
      "Income",
      "Livelihood",
      "Food Security",
      "Priority Needs",
      "Last Verified",
      "Record Status",
      "Household Status",
    ];
    const values = filtered.map(({ household, headName, barangayName, structure, memberCount, risks }) => [
      household.householdNumber,
      headName,
      barangayName,
      structure?.structureCode ?? "",
      structure ? formatStructureAddress(structure) : "",
      memberCount,
      household.monthlyIncomeBracket,
      household.primaryLivelihood,
      household.foodSecurity,
      risks.join("; "),
      household.lastVerifiedAt.slice(0, 10),
      isHouseholdStale(household) ? "Record needs updating" : "Records up to date",
      household.status,
    ]);
    const csv = [headers, ...values].map((line) => line.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `household-masterlist-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${styles.householdHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>Household Masterlist</h1>
            <p>Search, review, and maintain household, membership, and structure records.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href="/barangay-affairs/households/register">
              <HousePlus size={16} /> Register Household
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
                aria-label="Search households"
                value={filters.search}
                onChange={(event) => setFilter("search", event.target.value)}
                placeholder="Search household number, head, LRN, structure, or address"
              />
            </label>
            <Select
              value={filters.status || "__all__"}
              onValueChange={(value) => setFilter("status", value === "__all__" ? "" : value)}
            >
              <SelectTrigger className={styles.compactSelect} aria-label="Household status filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
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
                <FilterSelect
                  label="Record status"
                  value={filters.verification}
                  placeholder="All record statuses"
                  options={[
                    ["current", "Records up to date"],
                    ["update", "Records need updating"],
                  ]}
                  onChange={(value) => setFilter("verification", value)}
                />
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
                  label="Purok"
                  value={filters.purok}
                  onChange={(value) => setFilter("purok", value)}
                  placeholder="e.g. Purok 2"
                />
                <FilterSelect
                  label="Income bracket"
                  value={filters.income}
                  placeholder="All income brackets"
                  options={incomeOptions.map((value) => [value, value])}
                  onChange={(value) => setFilter("income", value)}
                />
                <FilterSelect
                  label="Primary livelihood"
                  value={filters.livelihood}
                  placeholder="All livelihoods"
                  options={livelihoodOptions.map((value) => [value, value])}
                  onChange={(value) => setFilter("livelihood", value)}
                />
                <FilterSelect
                  label="Food security"
                  value={filters.foodSecurity}
                  placeholder="All conditions"
                  options={foodOptions.map((value) => [value, value])}
                  onChange={(value) => setFilter("foodSecurity", value)}
                />
                <FilterSelect
                  label="Priority need"
                  value={filters.vulnerability}
                  placeholder="All priority needs"
                  options={riskOptions.map((value) => [value, value])}
                  onChange={(value) => setFilter("vulnerability", value)}
                />
                <FilterSelect
                  label="Construction material"
                  value={filters.material}
                  placeholder="All materials"
                  options={["Concrete", "Mixed concrete and wood", "Wood", "Light materials"].map((value) => [
                    value,
                    value,
                  ])}
                  onChange={(value) => setFilter("material", value)}
                />
                <FilterSelect
                  label="Housing arrangement"
                  value={filters.tenure}
                  placeholder="All arrangements"
                  options={["Owned", "Rented", "Rent-free with consent", "Informal occupancy"].map((value) => [
                    value,
                    value,
                  ])}
                  onChange={(value) => setFilter("tenure", value)}
                />
                <FilterSelect
                  label="Water source"
                  value={filters.water}
                  placeholder="All water sources"
                  options={["Level III connection", "Community faucet", "Deep well", "Spring / protected source"].map(
                    (value) => [value, value],
                  )}
                  onChange={(value) => setFilter("water", value)}
                />
                <FilterSelect
                  label="Toilet facility"
                  value={filters.toilet}
                  placeholder="All toilet facilities"
                  options={["Water-sealed private", "Water-sealed shared", "Pit latrine", "None reported"].map(
                    (value) => [value, value],
                  )}
                  onChange={(value) => setFilter("toilet", value)}
                />
                <FilterSelect
                  label="Power source"
                  value={filters.power}
                  placeholder="All power sources"
                  options={["Electric cooperative", "Solar", "Generator", "No regular connection"].map((value) => [
                    value,
                    value,
                  ])}
                  onChange={(value) => setFilter("power", value)}
                />
                <FilterSelect
                  label="Internet access"
                  value={filters.internet}
                  placeholder="All access types"
                  options={["Fixed broadband", "Mobile data", "None"].map((value) => [value, value])}
                  onChange={(value) => setFilter("internet", value)}
                />
                <Field
                  label="Members from"
                  type="number"
                  value={filters.membersMin}
                  onChange={(value) => setFilter("membersMin", value)}
                  placeholder="e.g. 2"
                />
                <Field
                  label="Members to"
                  type="number"
                  value={filters.membersMax}
                  onChange={(value) => setFilter("membersMax", value)}
                  placeholder="e.g. 8"
                />
                <Field
                  label="Verified from"
                  type="date"
                  value={filters.verifiedFrom}
                  onChange={(value) => setFilter("verifiedFrom", value)}
                />
                <Field
                  label="Verified to"
                  type="date"
                  value={filters.verifiedTo}
                  onChange={(value) => setFilter("verifiedTo", value)}
                />
              </div>
            </div>
          )}

          <div className={styles.resultsMeta}>
            <strong>
              {filtered.length === scopedRows.length
                ? `${filtered.length.toLocaleString()} households`
                : `${filtered.length.toLocaleString()} of ${scopedRows.length.toLocaleString()} households`}
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
                    {rows.map(({ household, head, structure, headName, barangayName, memberCount, risks }) => (
                      <tr key={household.id}>
                        {show("number") && <td className={styles.mono}>{household.householdNumber}</td>}
                        {show("head") && (
                          <td>
                            <div className={styles.nameCell}>
                              <Link href={`/barangay-affairs/households/${household.id}`}>{headName}</Link>
                              <small>{head?.lrn}</small>
                            </div>
                          </td>
                        )}
                        {show("barangay") && <td>{barangayName}</td>}
                        {show("structure") && <td className={styles.mono}>{structure?.structureCode ?? "—"}</td>}
                        {show("address") && (
                          <td title={structure ? formatStructureAddress(structure) : ""}>
                            {structure ? formatStructureAddress(structure).slice(0, 38) : "—"}
                          </td>
                        )}
                        {show("members") && <td>{memberCount}</td>}
                        {show("income") && <td>{household.monthlyIncomeBracket}</td>}
                        {show("livelihood") && <td>{household.primaryLivelihood}</td>}
                        {show("foodSecurity") && <td>{household.foodSecurity}</td>}
                        {show("priority") && (
                          <td>
                            <div className={styles.signals}>
                              {risks.length ? (
                                risks.slice(0, 2).map((risk) => (
                                  <span className={styles.signal} key={risk}>
                                    {risk}
                                  </span>
                                ))
                              ) : (
                                <span className={styles.muted}>None recorded</span>
                              )}
                            </div>
                          </td>
                        )}
                        {show("verified") && <td>{new Date(household.lastVerifiedAt).toLocaleDateString("en-PH")}</td>}
                        {show("verification") && (
                          <td>
                            <span
                              className={`${styles.badge} ${isHouseholdStale(household) ? styles.warning : styles.active}`}
                            >
                              {isHouseholdStale(household) ? "Record needs updating" : "Records up to date"}
                            </span>
                          </td>
                        )}
                        {show("status") && (
                          <td>
                            <span
                              className={`${styles.badge} ${household.status === "Active" ? styles.active : styles.warning}`}
                            >
                              {household.status}
                            </span>
                          </td>
                        )}
                        {show("actions") && (
                          <td>
                            <details className={styles.rowActions}>
                              <summary className={styles.actionSummary}>
                                <MoreHorizontal size={16} />
                              </summary>
                              <div className={styles.actionMenu}>
                                <Link href={`/barangay-affairs/households/${household.id}`}>View household</Link>
                                <Link href={`/barangay-affairs/households/${household.id}/edit`}>Edit household</Link>
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
                <Home size={28} />
                <h3>No households found</h3>
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
