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
  Map as MapIcon,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useHouseholdRegistryStore } from "../stores/household-registry-store";
import { formatStructureAddress } from "../utils/household-utils";

const columns = [
  "code",
  "barangay",
  "address",
  "gps",
  "households",
  "construction",
  "tenure",
  "water",
  "toilet",
  "power",
  "waste",
  "internet",
  "actions",
] as const;
type Column = (typeof columns)[number];
type SortKey = "code" | "barangay" | "households" | "construction" | "tenure";
type Filters = {
  search: string;
  occupancy: string;
  mapping: string;
  barangayId: string;
  purok: string;
  sitio: string;
  zone: string;
  material: string;
  tenure: string;
  water: string;
  toilet: string;
  power: string;
  waste: string;
  internet: string;
  householdsMin: string;
  householdsMax: string;
};

const EMPTY_FILTERS: Filters = {
  search: "",
  occupancy: "",
  mapping: "",
  barangayId: "",
  purok: "",
  sitio: "",
  zone: "",
  material: "",
  tenure: "",
  water: "",
  toilet: "",
  power: "",
  waste: "",
  internet: "",
  householdsMin: "",
  householdsMax: "",
};

const labels: Record<Column, string> = {
  code: "Structure Code",
  barangay: "Barangay",
  address: "Normalized Address",
  gps: "GPS Coordinates",
  households: "Households",
  construction: "Construction",
  tenure: "Housing Arrangement",
  water: "Water Source",
  toilet: "Toilet Facility",
  power: "Power Source",
  waste: "Waste Disposal",
  internet: "Internet Access",
  actions: "Actions",
};
const fixed = new Set<Column>(["code", "actions"]);
const defaultHidden = new Set<Column>(["gps", "toilet", "waste", "internet"]);
const sortable: Partial<Record<Column, SortKey>> = {
  code: "code",
  barangay: "barangay",
  households: "households",
  construction: "construction",
  tenure: "tenure",
};

const materialOptions = ["Concrete", "Mixed concrete and wood", "Wood", "Light materials"];
const tenureOptions = ["Owned", "Rented", "Rent-free with consent", "Informal occupancy"];
const waterOptions = ["Level III connection", "Community faucet", "Deep well", "Spring / protected source"];
const toiletOptions = ["Water-sealed private", "Water-sealed shared", "Pit latrine", "None reported"];
const powerOptions = ["Electric cooperative", "Solar", "Generator", "No regular connection"];
const wasteOptions = ["Collected", "Composted", "Burned", "Open dumping"];
const internetOptions = ["Fixed broadband", "Mobile data", "None"];

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

export function StructureMasterlistView() {
  const structures = useHouseholdRegistryStore((state) => state.structures);
  const households = useHouseholdRegistryStore((state) => state.households);
  const { selectedBarangayName, isAllSelected, selectedBarangays } = useBarangayScope();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [more, setMore] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visible, setVisible] = useState<Set<Column>>(() => {
    const initial = new Set(columns as readonly Column[]);
    for (const column of defaultHidden) initial.delete(column);
    return initial;
  });
  const [sortKey, setSortKey] = useState<SortKey>("code");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const scopedRows = useMemo(() => {
    const scope = new Set(selectedBarangays);
    return structures
      .filter((structure) => isAllSelected || scope.has(structure.barangayId))
      .map((structure) => ({
        structure,
        barangayName: MATNOG_BARANGAYS.find((barangay) => barangay.code === structure.barangayId)?.name ?? "—",
        householdCount: households.filter((household) => household.structureId === structure.id).length,
      }));
  }, [households, isAllSelected, selectedBarangays, structures]);

  const filtered = useMemo(() => {
    const rows = scopedRows.filter(({ structure, barangayName, householdCount }) => {
      const query = filters.search.trim().toLowerCase();
      const haystack =
        `${structure.structureCode} ${barangayName} ${formatStructureAddress(structure)} ${structure.dwelling.constructionMaterial}`.toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (filters.occupancy === "vacant" && householdCount !== 0) return false;
      if (filters.occupancy === "single" && householdCount !== 1) return false;
      if (filters.occupancy === "multiple" && householdCount < 2) return false;
      const mapped = Boolean(structure.latitude && structure.longitude);
      if (filters.mapping === "mapped" && !mapped) return false;
      if (filters.mapping === "missing" && mapped) return false;
      if (filters.barangayId && structure.barangayId !== filters.barangayId) return false;
      if (filters.purok && !structure.purok.toLowerCase().includes(filters.purok.toLowerCase())) return false;
      if (filters.sitio && !structure.sitio.toLowerCase().includes(filters.sitio.toLowerCase())) return false;
      if (filters.zone && !structure.zone.toLowerCase().includes(filters.zone.toLowerCase())) return false;
      if (filters.material && structure.dwelling.constructionMaterial !== filters.material) return false;
      if (filters.tenure && structure.dwelling.tenure !== filters.tenure) return false;
      if (filters.water && structure.dwelling.waterSource !== filters.water) return false;
      if (filters.toilet && structure.dwelling.toiletFacility !== filters.toilet) return false;
      if (filters.power && structure.dwelling.powerSource !== filters.power) return false;
      if (filters.waste && structure.dwelling.wasteDisposal !== filters.waste) return false;
      if (filters.internet && structure.dwelling.internetAccess !== filters.internet) return false;
      if (filters.householdsMin && householdCount < Number(filters.householdsMin)) return false;
      if (filters.householdsMax && householdCount > Number(filters.householdsMax)) return false;
      return true;
    });
    const value = (row: (typeof rows)[number]) => {
      if (sortKey === "code") return row.structure.structureCode;
      if (sortKey === "barangay") return row.barangayName;
      if (sortKey === "households") return row.householdCount;
      if (sortKey === "construction") return row.structure.dwelling.constructionMaterial;
      return row.structure.dwelling.tenure;
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
      "Structure Code",
      "Barangay",
      "Normalized Address",
      "GPS Coordinates",
      "Households",
      "Construction",
      "Housing Arrangement",
      "Water Source",
      "Toilet Facility",
      "Power Source",
      "Waste Disposal",
      "Internet Access",
    ];
    const values = filtered.map(({ structure, barangayName, householdCount }) => [
      structure.structureCode,
      barangayName,
      formatStructureAddress(structure),
      structure.latitude && structure.longitude
        ? `${structure.latitude.toFixed(6)}, ${structure.longitude.toFixed(6)}`
        : "Not mapped",
      householdCount,
      structure.dwelling.constructionMaterial,
      structure.dwelling.tenure,
      structure.dwelling.waterSource,
      structure.dwelling.toiletFacility,
      structure.dwelling.powerSource,
      structure.dwelling.wasteDisposal,
      structure.dwelling.internetAccess,
    ]);
    const csv = [headers, ...values].map((line) => line.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `structure-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
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
            <h1>Structure Inventory</h1>
            <p>Search, review, and maintain normalized addresses, dwelling details, and household occupancy.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href="/barangay-affairs/structures/new">
              <Plus size={16} /> Register Structure
            </Link>
            <Link className={styles.btnSecondary} href="/barangay-affairs/households/map">
              <MapIcon size={16} /> GPS Map
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
                aria-label="Search structures"
                value={filters.search}
                onChange={(event) => setFilter("search", event.target.value)}
                placeholder="Search structure code, barangay, address, or material"
              />
            </label>
            <Select
              value={filters.occupancy || "__all__"}
              onValueChange={(value) => setFilter("occupancy", value === "__all__" ? "" : value)}
            >
              <SelectTrigger className={styles.compactSelect} aria-label="Household occupancy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All occupancy</SelectItem>
                <SelectItem value="vacant">No household</SelectItem>
                <SelectItem value="single">One household</SelectItem>
                <SelectItem value="multiple">Multiple households</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.mapping || "__all__"}
              onValueChange={(value) => setFilter("mapping", value === "__all__" ? "" : value)}
            >
              <SelectTrigger className={styles.compactSelect} aria-label="GPS mapping">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All mapping statuses</SelectItem>
                <SelectItem value="mapped">GPS mapped</SelectItem>
                <SelectItem value="missing">Missing coordinates</SelectItem>
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
                <Field
                  label="Purok"
                  value={filters.purok}
                  onChange={(value) => setFilter("purok", value)}
                  placeholder="e.g. Purok 2"
                />
                <Field
                  label="Sitio"
                  value={filters.sitio}
                  onChange={(value) => setFilter("sitio", value)}
                  placeholder="Search sitio"
                />
                <Field
                  label="Zone"
                  value={filters.zone}
                  onChange={(value) => setFilter("zone", value)}
                  placeholder="e.g. Zone 1"
                />
                <FilterSelect
                  label="Construction material"
                  value={filters.material}
                  placeholder="All materials"
                  options={materialOptions.map((value) => [value, value])}
                  onChange={(value) => setFilter("material", value)}
                />
                <FilterSelect
                  label="Housing arrangement"
                  value={filters.tenure}
                  placeholder="All arrangements"
                  options={tenureOptions.map((value) => [value, value])}
                  onChange={(value) => setFilter("tenure", value)}
                />
                <FilterSelect
                  label="Water source"
                  value={filters.water}
                  placeholder="All water sources"
                  options={waterOptions.map((value) => [value, value])}
                  onChange={(value) => setFilter("water", value)}
                />
                <FilterSelect
                  label="Toilet facility"
                  value={filters.toilet}
                  placeholder="All toilet facilities"
                  options={toiletOptions.map((value) => [value, value])}
                  onChange={(value) => setFilter("toilet", value)}
                />
                <FilterSelect
                  label="Power source"
                  value={filters.power}
                  placeholder="All power sources"
                  options={powerOptions.map((value) => [value, value])}
                  onChange={(value) => setFilter("power", value)}
                />
                <FilterSelect
                  label="Waste disposal"
                  value={filters.waste}
                  placeholder="All disposal methods"
                  options={wasteOptions.map((value) => [value, value])}
                  onChange={(value) => setFilter("waste", value)}
                />
                <FilterSelect
                  label="Internet access"
                  value={filters.internet}
                  placeholder="All access types"
                  options={internetOptions.map((value) => [value, value])}
                  onChange={(value) => setFilter("internet", value)}
                />
                <Field
                  label="Households from"
                  type="number"
                  value={filters.householdsMin}
                  onChange={(value) => setFilter("householdsMin", value)}
                  placeholder="e.g. 1"
                />
                <Field
                  label="Households to"
                  type="number"
                  value={filters.householdsMax}
                  onChange={(value) => setFilter("householdsMax", value)}
                  placeholder="e.g. 3"
                />
              </div>
            </div>
          )}

          <div className={styles.resultsMeta}>
            <strong>
              {filtered.length === scopedRows.length
                ? `${filtered.length.toLocaleString()} structures`
                : `${filtered.length.toLocaleString()} of ${scopedRows.length.toLocaleString()} structures`}
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
                    {rows.map(({ structure, barangayName, householdCount }) => (
                      <tr key={structure.id}>
                        {show("code") && <td className={styles.mono}>{structure.structureCode}</td>}
                        {show("barangay") && <td>{barangayName}</td>}
                        {show("address") && (
                          <td title={formatStructureAddress(structure)}>
                            <span className={styles.truncatedAddress}>{formatStructureAddress(structure)}</span>
                          </td>
                        )}
                        {show("gps") && (
                          <td className={styles.mono}>
                            {structure.latitude && structure.longitude
                              ? `${structure.latitude.toFixed(5)}, ${structure.longitude.toFixed(5)}`
                              : "Not mapped"}
                          </td>
                        )}
                        {show("households") && (
                          <td>
                            <span
                              className={`${styles.badge} ${householdCount > 1 ? styles.info : householdCount ? styles.active : styles.warning}`}
                            >
                              {householdCount} household{householdCount === 1 ? "" : "s"}
                            </span>
                          </td>
                        )}
                        {show("construction") && <td>{structure.dwelling.constructionMaterial}</td>}
                        {show("tenure") && <td>{structure.dwelling.tenure}</td>}
                        {show("water") && <td>{structure.dwelling.waterSource}</td>}
                        {show("toilet") && <td>{structure.dwelling.toiletFacility}</td>}
                        {show("power") && <td>{structure.dwelling.powerSource}</td>}
                        {show("waste") && <td>{structure.dwelling.wasteDisposal}</td>}
                        {show("internet") && <td>{structure.dwelling.internetAccess}</td>}
                        {show("actions") && (
                          <td>
                            <details className={styles.rowActions}>
                              <summary className={styles.actionSummary}>
                                <MoreHorizontal size={16} />
                              </summary>
                              <div className={styles.actionMenu}>
                                <Link href={`/barangay-affairs/structures/${structure.id}`}>View structure</Link>
                                <Link href={`/barangay-affairs/structures/${structure.id}/edit`}>Edit structure</Link>
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
                <h3>No structures found</h3>
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
