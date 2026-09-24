"use client";

import { useMemo, useState } from "react";

import {
  BadgeCheck,
  Banknote,
  Calculator,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  FileCheck2,
  Filter,
  MapPin,
  Printer,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { BUSINESS_TYPES } from "../data/business-data";
import { useBusinessRegistryStore } from "../stores/business-store";
import type { BusinessRecord } from "../types/business";
import businessStyles from "./business.module.css";

type Filters = {
  search: string;
  status: string;
  activity: string;
  barangayId: string;
  readiness: string;
  payment: string;
  ownership: string;
};
const EMPTY: Filters = {
  search: "",
  status: "",
  activity: "",
  barangayId: "",
  readiness: "",
  payment: "",
  ownership: "",
};
const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
const isReady = (record: BusinessRecord) => record.assessedFee > 0 && record.amountPaid >= record.assessedFee;

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
    // biome-ignore lint/a11y/noLabelWithoutControl: the select trigger is nested through the shared Select component.
    <label className={styles.field}>
      <span>{label}</span>
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
    </label>
  );
}

function RecordBadge({ status }: { status: BusinessRecord["clearanceStatus"] }) {
  const className =
    status === "Valid"
      ? styles.active
      : status === "Expired"
        ? styles.danger
        : status === "Pending"
          ? styles.warning
          : styles.info;
  return <span className={`${styles.badge} ${className}`}>{status}</span>;
}

export function BusinessClearanceView() {
  const businesses = useBusinessRegistryStore((state) => state.businesses);
  const issueClearance = useBusinessRegistryStore((state) => state.issueClearance);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangayName, isAllSelected, selectedBarangays } = useBarangayScope();
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [more, setMore] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [notice, setNotice] = useState("");
  const residentMap = useMemo(() => new Map(residents.map((item) => [item.id, formatResidentName(item)])), [residents]);

  const scoped = useMemo(() => {
    const scope = new Set(selectedBarangays);
    return businesses.filter((item) => isAllSelected || scope.has(item.barangayId));
  }, [businesses, isAllSelected, selectedBarangays]);
  const queue = useMemo(
    () => scoped.filter((item) => item.clearanceStatus !== "Valid" && item.status !== "Closed"),
    [scoped],
  );
  const filtered = useMemo(
    () =>
      queue.filter((item) => {
        const query = filters.search.trim().toLowerCase();
        const owner = residentMap.get(item.ownerResidentId) ?? "";
        if (
          query &&
          !`${item.businessName} ${item.tradeName} ${item.businessNumber} ${owner} ${item.clearanceNumber}`
            .toLowerCase()
            .includes(query)
        )
          return false;
        if (filters.status && item.clearanceStatus !== filters.status) return false;
        if (filters.activity && item.businessType !== filters.activity) return false;
        if (filters.barangayId && item.barangayId !== filters.barangayId) return false;
        if (filters.ownership && item.ownership !== filters.ownership) return false;
        if (filters.readiness === "ready" && !isReady(item)) return false;
        if (filters.readiness === "hold" && isReady(item)) return false;
        if (filters.payment === "unassessed" && item.assessedFee !== 0) return false;
        if (filters.payment === "unpaid" && !(item.assessedFee > 0 && item.amountPaid === 0)) return false;
        if (filters.payment === "partial" && !(item.amountPaid > 0 && item.amountPaid < item.assessedFee)) return false;
        if (filters.payment === "paid" && !isReady(item)) return false;
        return true;
      }),
    [filters, queue, residentMap],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selected = businesses.find((item) => item.id === selectedId) ?? pageRows[0];
  const readyCount = queue.filter(isReady).length;
  const activeCount = Object.entries(filters).filter(([key, value]) => key !== "search" && Boolean(value)).length;
  const setFilter = (key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const reset = () => {
    setFilters(EMPTY);
    setPage(1);
  };
  const issue = () => {
    if (!selected) return;
    const result = issueClearance(selected.id);
    if (result) setNotice(`${result.clearanceNumber} was issued and queued for BPLS synchronization.`);
  };

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${businessStyles.businessHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>Barangay Business Clearances</h1>
            <p>
              Select a business to review its payment readiness and generate the barangay business clearance for{" "}
              {selectedBarangayName}.
            </p>
          </div>
        </div>
      </section>
      <div className={`${styles.body} ${businessStyles.clearanceBody}`}>
        <section className={businessStyles.clearanceKpis}>
          <article>
            <FileCheck2 size={21} />
            <div>
              <span>Awaiting action</span>
              <strong>{queue.length}</strong>
            </div>
          </article>
          <article>
            <BadgeCheck size={21} />
            <div>
              <span>Ready to issue</span>
              <strong>{readyCount}</strong>
            </div>
          </article>
          <article>
            <ShieldCheck size={21} />
            <div>
              <span>Valid clearances</span>
              <strong>{scoped.filter((item) => item.clearanceStatus === "Valid").length}</strong>
            </div>
          </article>
          <article>
            <CircleAlert size={21} />
            <div>
              <span>Expired clearances</span>
              <strong>{scoped.filter((item) => item.clearanceStatus === "Expired").length}</strong>
            </div>
          </article>
        </section>
        {notice && (
          <div className={businessStyles.successNotice}>
            <BadgeCheck size={16} />
            <span>{notice}</span>
          </div>
        )}
        <div className={businessStyles.clearanceWorkspace}>
          <section className={`${styles.card} ${businessStyles.clearanceQueueCard}`}>
            <div className={styles.toolbar}>
              <label className={styles.searchBox}>
                <Search size={15} />
                <input
                  aria-label="Search clearance queue"
                  value={filters.search}
                  onChange={(event) => setFilter("search", event.target.value)}
                  placeholder="Search business, owner, or registry"
                />
              </label>
              <Select
                value={filters.readiness || "__all__"}
                onValueChange={(value) => setFilter("readiness", value === "__all__" ? "" : value)}
              >
                <SelectTrigger className={styles.compactSelect} aria-label="Issuance readiness filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All readiness states</SelectItem>
                  <SelectItem value="ready">Ready to issue</SelectItem>
                  <SelectItem value="hold">Requires action</SelectItem>
                </SelectContent>
              </Select>
              <button
                type="button"
                className={`${styles.secondaryButton} ${styles.filterButton}`}
                onClick={() => setMore((current) => !current)}
              >
                <Filter size={14} /> Filters{" "}
                {activeCount > 0 && <span className={styles.filterCount}>{activeCount}</span>}
              </button>
              {(activeCount > 0 || filters.search) && (
                <button type="button" className={styles.secondaryButton} onClick={reset}>
                  <X size={14} /> Clear
                </button>
              )}
            </div>
            {more && (
              <div className={`${styles.advancedPanel} ${businessStyles.clearanceFilters}`}>
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
                    label="Clearance status"
                    value={filters.status}
                    placeholder="All clearance statuses"
                    options={["Pending", "Expired", "Not issued"].map((item) => [item, item])}
                    onChange={(value) => setFilter("status", value)}
                  />
                  <FilterSelect
                    label="Business activity"
                    value={filters.activity}
                    placeholder="All business activities"
                    options={BUSINESS_TYPES.map((item) => [item, item])}
                    onChange={(value) => setFilter("activity", value)}
                  />
                  <FilterSelect
                    label="Ownership"
                    value={filters.ownership}
                    placeholder="All ownership types"
                    options={["Sole proprietorship", "Partnership", "Corporation", "Cooperative"].map((item) => [
                      item,
                      item,
                    ])}
                    onChange={(value) => setFilter("ownership", value)}
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
                </div>
              </div>
            )}
            <div className={styles.resultsMeta}>
              <strong>{filtered.length} businesses</strong>
              <span className={styles.scopeBadge}>
                <MapPin size={13} /> {isAllSelected ? "All Barangays" : selectedBarangayName}
              </span>
            </div>
            <div className={businessStyles.clearanceList}>
              {pageRows.map((item) => {
                const ready = isReady(item);
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={selected?.id === item.id ? businessStyles.selectedRecord : ""}
                    onClick={() => {
                      setSelectedId(item.id);
                      setNotice("");
                    }}
                  >
                    <span className={businessStyles.businessIcon}>
                      <FileCheck2 size={17} />
                    </span>
                    <div>
                      <strong>{item.businessName}</strong>
                      <small>
                        {item.businessNumber} · {residentMap.get(item.ownerResidentId) ?? "Resident record"}
                      </small>
                      <em>
                        Brgy. {barangayName(item.barangayId)} · {item.businessType}
                      </em>
                    </div>
                    <RecordBadge status={item.clearanceStatus} />
                    <b className={ready ? businessStyles.readyText : businessStyles.holdText}>
                      {ready
                        ? "Ready"
                        : item.assessedFee
                          ? `${money(item.assessedFee - item.amountPaid)} due`
                          : "Needs assessment"}
                    </b>
                  </button>
                );
              })}
            </div>
            <div className={`${styles.pagination} ${businessStyles.queuePagination}`}>
              <span>Rows</span>
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
                  {[10, 25, 50].map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>
                {filtered.length
                  ? `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length}`
                  : "0 results"}
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
          </section>
          <section className={`${styles.card} ${businessStyles.clearanceDocumentCard}`}>
            <div className={businessStyles.panelHeading}>
              <FileCheck2 size={20} />
              <div>
                <strong>Clearance preview</strong>
                <small>Generated dynamically from the selected business record</small>
              </div>
            </div>
            {selected ? (
              <>
                <div className={businessStyles.readinessStrip}>
                  <div className={selected.assessedFee > 0 ? businessStyles.checkDone : ""}>
                    <Calculator size={16} />
                    <span>
                      Assessment<b>{selected.assessedFee ? money(selected.assessedFee) : "Required"}</b>
                    </span>
                  </div>
                  <div className={isReady(selected) ? businessStyles.checkDone : ""}>
                    <Banknote size={16} />
                    <span>
                      Payment<b>{isReady(selected) ? "Paid in full" : `${money(selected.amountPaid)} paid`}</b>
                    </span>
                  </div>
                  <div>
                    <ShieldCheck size={16} />
                    <span>
                      BPLS handoff<b>After issuance</b>
                    </span>
                  </div>
                </div>
                <div className={businessStyles.clearancePaper}>
                  <header>
                    <span>Republic of the Philippines</span>
                    <strong>BARANGAY {barangayName(selected.barangayId).toUpperCase()}</strong>
                    <small>Municipality of Matnog, Province of Sorsogon</small>
                  </header>
                  <div className={businessStyles.documentTitle}>BARANGAY BUSINESS CLEARANCE</div>
                  <p>
                    This certifies that the business described below is registered within this barangay and has complied
                    with the requirements recorded for the current transaction.
                  </p>
                  <dl>
                    <div>
                      <dt>Business name</dt>
                      <dd>{selected.businessName}</dd>
                    </div>
                    <div>
                      <dt>Registered owner</dt>
                      <dd>{residentMap.get(selected.ownerResidentId) ?? "Resident record"}</dd>
                    </div>
                    <div>
                      <dt>Business activity</dt>
                      <dd>{selected.businessType}</dd>
                    </div>
                    <div>
                      <dt>Registry number</dt>
                      <dd>{selected.businessNumber}</dd>
                    </div>
                    <div>
                      <dt>Clearance number</dt>
                      <dd>{selected.clearanceNumber || "Assigned upon issuance"}</dd>
                    </div>
                  </dl>
                  <footer>
                    <div>
                      <span>Barangay Captain</span>
                      <small>Authorized signatory</small>
                    </div>
                    <div className={businessStyles.qrPlaceholder}>
                      QR<small>Verification</small>
                    </div>
                  </footer>
                </div>
                <div className={businessStyles.issueFooter}>
                  <button className={styles.secondaryButton} type="button">
                    <Printer size={14} /> Print preview
                  </button>
                  <button className={styles.primaryButton} type="button" disabled={!isReady(selected)} onClick={issue}>
                    <BadgeCheck size={14} /> Issue clearance
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.empty}>
                <div>
                  <FileCheck2 size={28} />
                  <h3>No business selected</h3>
                  <p>Choose a business from the list to generate its clearance.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
