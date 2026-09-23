"use client";

import { type FormEvent, useMemo, useState } from "react";

import Link from "next/link";

import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Plus,
  Search,
  Store,
  UserRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useHouseholdRegistryStore } from "@/features/household-registry/stores/household-registry-store";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { BUSINESS_TYPES, GROSS_SALES_BRACKETS } from "../data/business-data";
import { useBusinessRegistryStore } from "../stores/business-store";
import type { BusinessOwnership, BusinessStatus } from "../types/business";
import businessStyles from "./business.module.css";

const OWNERSHIP_TYPES: BusinessOwnership[] = ["Sole proprietorship", "Partnership", "Corporation", "Cooperative"];
const STATUS_OPTIONS: Array<BusinessStatus | "All statuses"> = [
  "All statuses",
  "Active",
  "For renewal",
  "Lapsed",
  "Closed",
];
const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
const shortDate = (value: string) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    : "—";

function BusinessStatusBadge({ status }: { status: BusinessStatus }) {
  const badgeClass =
    status === "Active"
      ? styles.active
      : status === "For renewal"
        ? styles.warning
        : status === "Lapsed"
          ? styles.danger
          : styles.info;
  return <span className={`${styles.badge} ${badgeClass}`}>{status}</span>;
}

function ClearanceBadge({ status }: { status: string }) {
  const badgeClass =
    status === "Valid"
      ? styles.active
      : status === "Pending"
        ? styles.warning
        : status === "Expired"
          ? styles.danger
          : styles.info;
  return <span className={`${styles.badge} ${badgeClass}`}>{status}</span>;
}

export function BusinessDashboardView() {
  const businesses = useBusinessRegistryStore((state) => state.businesses);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const scoped = businesses.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const active = scoped.filter((item) => item.status === "Active");
  const renewal = scoped.filter((item) => item.status === "For renewal");
  const lapsed = scoped.filter((item) => item.status === "Lapsed");
  const collected = scoped.reduce((total, item) => total + item.amountPaid, 0);
  const typeCounts = BUSINESS_TYPES.map((type) => ({
    type,
    count: scoped.filter((item) => item.businessType === type).length,
  })).sort((a, b) => b.count - a.count);
  const barangayCounts = MATNOG_BARANGAYS.map((barangay) => ({
    name: barangay.name,
    count: scoped.filter((item) => item.barangayId === barangay.code).length,
  }))
    .filter((item) => item.count)
    .sort((a, b) => b.count - a.count);
  const maxType = Math.max(...typeCounts.map((item) => item.count), 1);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A9 Business Registry</p>
          <h1>Business Registry</h1>
          <p>Barangay business records, clearances, fees, and renewal status for {selectedBarangayName}.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/businesses/register">
          <Plus size={15} /> Register business
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Store size={18} />
          </span>
          <div>
            <strong>{active.length}</strong>
            <span>Active businesses</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CalendarClock size={18} />
          </span>
          <div>
            <strong>{renewal.length}</strong>
            <span>Due for renewal</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CircleAlert size={18} />
          </span>
          <div>
            <strong>{lapsed.length}</strong>
            <span>Lapsed businesses</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Banknote size={18} />
          </span>
          <div>
            <strong>{money(collected)}</strong>
            <span>Clearance fees collected</span>
          </div>
        </div>
      </div>
      <div className={businessStyles.dashboardGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Registry composition</p>
              <h2>Businesses by activity</h2>
            </div>
            <Link className={styles.secondaryButton} href="/barangay-affairs/businesses/masterlist">
              View masterlist
            </Link>
          </div>
          <div className={businessStyles.typeChart}>
            {typeCounts.map((item) => (
              <div key={item.type}>
                <span>{item.type}</span>
                <div>
                  <i style={{ width: `${Math.max(5, (item.count / maxType) * 100)}%` }} />
                </div>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Compliance watch</p>
              <h2>Clearance status</h2>
            </div>
          </div>
          <div className={businessStyles.complianceList}>
            <div>
              <span>
                <BadgeCheck size={15} /> Valid clearances
              </span>
              <strong>{scoped.filter((item) => item.clearanceStatus === "Valid").length}</strong>
            </div>
            <div>
              <span>
                <CalendarClock size={15} /> Pending issuance
              </span>
              <strong>{scoped.filter((item) => item.clearanceStatus === "Pending").length}</strong>
            </div>
            <div>
              <span>
                <CircleAlert size={15} /> Expired
              </span>
              <strong>{scoped.filter((item) => item.clearanceStatus === "Expired").length}</strong>
            </div>
            <div>
              <span>
                <ClipboardCheck size={15} /> BPLS synced
              </span>
              <strong>{scoped.filter((item) => item.bplsSyncStatus === "Synced").length}</strong>
            </div>
          </div>
        </aside>
      </div>
      <div className={businessStyles.dashboardGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Attention required</p>
              <h2>Renewal and lapse queue</h2>
            </div>
          </div>
          <div className={businessStyles.attentionList}>
            {[...renewal, ...lapsed].slice(0, 8).map((item) => (
              <article key={item.id}>
                <span className={businessStyles.businessIcon}>
                  <BriefcaseBusiness size={16} />
                </span>
                <div>
                  <strong>{item.businessName}</strong>
                  <small>
                    {item.businessNumber} · {barangayName(item.barangayId)}
                  </small>
                </div>
                <BusinessStatusBadge status={item.status} />
                <span>{shortDate(item.renewalDueDate)}</span>
                <ArrowRight size={14} />
              </article>
            ))}
          </div>
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Municipal view</p>
              <h2>Top barangays</h2>
            </div>
          </div>
          <div className={businessStyles.barangayList}>
            {barangayCounts.slice(0, 8).map((item, index) => (
              <div key={item.name}>
                <span>{index + 1}</span>
                <strong>{item.name}</strong>
                <b>{item.count}</b>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function BusinessMasterlistView() {
  const businesses = useBusinessRegistryStore((state) => state.businesses);
  const residents = useResidentRegistryStore((state) => state.residents);
  const structures = useHouseholdRegistryStore((state) => state.structures);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("All statuses");
  const [type, setType] = useState("All business types");
  const residentMap = useMemo(() => new Map(residents.map((item) => [item.id, formatResidentName(item)])), [residents]);
  const structureMap = useMemo(() => new Map(structures.map((item) => [item.id, item])), [structures]);
  const filtered = businesses.filter((item) => {
    if (selectedBarangay !== "all" && item.barangayId !== selectedBarangay) return false;
    if (status !== "All statuses" && item.status !== status) return false;
    if (type !== "All business types" && item.businessType !== type) return false;
    return `${item.businessName} ${item.tradeName} ${item.businessNumber} ${residentMap.get(item.ownerResidentId) ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase());
  });

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A9 Business Registry</p>
          <h1>Business Masterlist</h1>
          <p>{selectedBarangayName} registered establishments and compliance status.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/businesses/register">
          <Plus size={15} /> Register business
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Building2 size={18} />
          </span>
          <div>
            <strong>{filtered.length}</strong>
            <span>Matching records</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <BadgeCheck size={18} />
          </span>
          <div>
            <strong>{filtered.filter((item) => item.clearanceStatus === "Valid").length}</strong>
            <span>Valid clearances</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CircleAlert size={18} />
          </span>
          <div>
            <strong>{filtered.filter((item) => item.status === "Lapsed").length}</strong>
            <span>Lapsed registrations</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ClipboardCheck size={18} />
          </span>
          <div>
            <strong>{filtered.filter((item) => item.bplsSyncStatus === "Synced").length}</strong>
            <span>BPLS synchronized</span>
          </div>
        </div>
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search business, owner, or registry number"
            />
          </div>
          <select
            className={styles.compactSelect}
            value={status}
            onChange={(event) => setStatus(event.target.value as (typeof STATUS_OPTIONS)[number])}
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select className={styles.compactSelect} value={type} onChange={(event) => setType(event.target.value)}>
            <option>All business types</option>
            {BUSINESS_TYPES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <span>
            <strong>{filtered.length}</strong> businesses found
          </span>
          <span>Registry updated Sep 23, 2026</span>
        </div>
        <div className={businessStyles.tableWrap}>
          <table className={businessStyles.table}>
            <thead>
              <tr>
                <th>Registry number</th>
                <th>Business</th>
                <th>Owner</th>
                <th>Location</th>
                <th>Sales bracket</th>
                <th>Status</th>
                <th>Clearance</th>
                <th>Fee</th>
                <th>BPLS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((item) => {
                const structure = structureMap.get(item.structureId);
                return (
                  <tr key={item.id}>
                    <td>
                      <strong className={businessStyles.registryNumber}>{item.businessNumber}</strong>
                      <span>{shortDate(item.registrationDate)}</span>
                    </td>
                    <td>
                      <strong>{item.businessName}</strong>
                      <span>
                        {item.businessType} · {item.ownership}
                      </span>
                    </td>
                    <td>
                      <strong>{residentMap.get(item.ownerResidentId) ?? "Resident record"}</strong>
                      <span>{item.contactNumber}</span>
                    </td>
                    <td>
                      <strong>{barangayName(item.barangayId)}</strong>
                      <span>
                        {structure
                          ? `${structure.street || structure.purok || "Local address"} · ${structure.structureCode}`
                          : "Structure record"}
                      </span>
                    </td>
                    <td>
                      {item.grossSalesBracket}
                      <span>{item.employeeCount} employees</span>
                    </td>
                    <td>
                      <BusinessStatusBadge status={item.status} />
                    </td>
                    <td>
                      <ClearanceBadge status={item.clearanceStatus} />
                      <span>{item.clearanceNumber || "No clearance yet"}</span>
                    </td>
                    <td>
                      <strong>{money(item.assessedFee)}</strong>
                      <span>
                        {item.assessedFee === 0
                          ? "Not assessed"
                          : item.amountPaid >= item.assessedFee
                            ? "Paid"
                            : `${money(item.amountPaid)} paid`}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${businessStyles.syncStatus} ${item.bplsSyncStatus === "Synced" ? businessStyles.synced : ""}`}
                      >
                        {item.bplsSyncStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function BusinessRegistrationView() {
  const registerBusiness = useBusinessRegistryStore((state) => state.registerBusiness);
  const residents = useResidentRegistryStore((state) => state.residents);
  const structures = useHouseholdRegistryStore((state) => state.structures);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const defaultBarangay = selectedBarangay === "all" ? MATNOG_BARANGAYS[0].code : selectedBarangay;
  const [barangayId, setBarangayId] = useState(defaultBarangay);
  const [ownerQuery, setOwnerQuery] = useState("");
  const [ownerResidentId, setOwnerResidentId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [ownership, setOwnership] = useState<BusinessOwnership>("Sole proprietorship");
  const [structureId, setStructureId] = useState("");
  const [grossSalesBracket, setGrossSalesBracket] = useState(GROSS_SALES_BRACKETS[0]);
  const [employeeCount, setEmployeeCount] = useState(1);
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const matchingResidents = residents
    .filter(
      (item) =>
        item.address.barangayId === barangayId &&
        formatResidentName(item).toLowerCase().includes(ownerQuery.toLowerCase()),
    )
    .slice(0, 12);
  const matchingStructures = structures.filter((item) => item.barangayId === barangayId);
  const selectedOwner = residents.find((item) => item.id === ownerResidentId);
  const selectedStructure = structures.find((item) => item.id === structureId);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ownerResidentId || !structureId) return;
    const business = registerBusiness({
      businessName,
      tradeName,
      businessType,
      ownership,
      ownerResidentId,
      structureId,
      barangayId,
      contactNumber,
      email,
      grossSalesBracket,
      employeeCount,
    });
    setNotice(`${business.businessNumber} was created. Clearance assessment can now begin.`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A9 Business Registry</p>
          <h1>Register Business</h1>
          <p>Create a barangay business record linked to an existing resident and structure.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/businesses/masterlist">
          View masterlist
        </Link>
      </header>
      {notice ? (
        <div className={businessStyles.successNotice}>
          <CheckCircle2 size={16} /> <span>{notice}</span>
          <Link href="/barangay-affairs/businesses/masterlist">
            Open masterlist <ArrowRight size={13} />
          </Link>
        </div>
      ) : null}
      <form className={businessStyles.registrationLayout} onSubmit={submit}>
        <section className={styles.card}>
          <div className={businessStyles.panelHeading}>
            <UserRound size={18} />
            <div>
              <strong>Owner and barangay</strong>
              <small>Search the resident registry before creating the business record</small>
            </div>
          </div>
          <div className={businessStyles.formSection}>
            <label className={styles.field}>
              <span>Barangay</span>
              <select
                value={barangayId}
                onChange={(event) => {
                  setBarangayId(event.target.value);
                  setOwnerResidentId("");
                  setStructureId("");
                }}
              >
                {MATNOG_BARANGAYS.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
              <small>Current app scope: {selectedBarangayName}</small>
            </label>
            <label className={styles.field}>
              <span>Find resident owner</span>
              <input
                value={ownerQuery}
                onChange={(event) => setOwnerQuery(event.target.value)}
                placeholder="Search owner name"
              />
            </label>
          </div>
          <div className={businessStyles.ownerList}>
            {matchingResidents.map((resident) => (
              <button
                type="button"
                key={resident.id}
                className={ownerResidentId === resident.id ? businessStyles.selectedOwner : ""}
                onClick={() => {
                  setOwnerResidentId(resident.id);
                  setContactNumber(resident.contact.primaryMobile);
                }}
              >
                <span>
                  {resident.firstName[0]}
                  {resident.lastName[0]}
                </span>
                <div>
                  <strong>{formatResidentName(resident)}</strong>
                  <small>
                    {resident.lrn} ·{" "}
                    {resident.address.street || resident.address.purok || barangayName(resident.address.barangayId)}
                  </small>
                </div>
                {ownerResidentId === resident.id ? <CheckCircle2 size={15} /> : <ArrowRight size={14} />}
              </button>
            ))}
          </div>
        </section>
        <section className={styles.card}>
          <div className={businessStyles.panelHeading}>
            <BriefcaseBusiness size={18} />
            <div>
              <strong>Business information</strong>
              <small>Record the operating identity, location, and size classification</small>
            </div>
          </div>
          {selectedOwner ? (
            <div className={businessStyles.linkedOwner}>
              <span>Linked resident owner</span>
              <strong>{formatResidentName(selectedOwner)}</strong>
              <small>
                {selectedOwner.lrn} · {barangayName(selectedOwner.address.barangayId)}
              </small>
            </div>
          ) : (
            <div className={businessStyles.selectionPrompt}>Select a resident owner to continue.</div>
          )}
          <div className={businessStyles.formGrid}>
            <label className={styles.field}>
              <span>Registered business name</span>
              <input
                required
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="e.g. Matnog Coastal Trading"
              />
            </label>
            <label className={styles.field}>
              <span>Trade name, optional</span>
              <input
                value={tradeName}
                onChange={(event) => setTradeName(event.target.value)}
                placeholder="Name displayed to customers"
              />
            </label>
            <label className={styles.field}>
              <span>Business activity</span>
              <select value={businessType} onChange={(event) => setBusinessType(event.target.value)}>
                {BUSINESS_TYPES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Ownership</span>
              <select value={ownership} onChange={(event) => setOwnership(event.target.value as BusinessOwnership)}>
                {OWNERSHIP_TYPES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className={`${styles.field} ${businessStyles.wideField}`}>
              <span>Business location / structure</span>
              <select required value={structureId} onChange={(event) => setStructureId(event.target.value)}>
                <option value="">Select a registered structure</option>
                {matchingStructures.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.structureCode} · {item.houseNumber} {item.street || item.purok || item.sitio}
                  </option>
                ))}
              </select>
              <small>
                {selectedStructure
                  ? `Mapped at ${selectedStructure.latitude.toFixed(5)}, ${selectedStructure.longitude.toFixed(5)}`
                  : `${matchingStructures.length} structures available in ${barangayName(barangayId)}`}
              </small>
            </label>
            <label className={styles.field}>
              <span>Gross sales bracket</span>
              <select value={grossSalesBracket} onChange={(event) => setGrossSalesBracket(event.target.value)}>
                {GROSS_SALES_BRACKETS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Employees</span>
              <input
                min={1}
                type="number"
                value={employeeCount}
                onChange={(event) => setEmployeeCount(Number(event.target.value))}
              />
            </label>
            <label className={styles.field}>
              <span>Contact number</span>
              <input
                required
                value={contactNumber}
                onChange={(event) => setContactNumber(event.target.value)}
                placeholder="09XX XXX XXXX"
              />
            </label>
            <label className={styles.field}>
              <span>Email, optional</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="business@example.ph"
              />
            </label>
          </div>
          <footer className={businessStyles.formFooter}>
            <div>
              <BadgeCheck size={16} />
              <span>
                <strong>Registry first</strong>
                <small>Clearance and fee assessment begin after saving.</small>
              </span>
            </div>
            <button className={styles.primaryButton} disabled={!ownerResidentId || !structureId} type="submit">
              <Plus size={14} /> Create business record
            </button>
          </footer>
        </section>
      </form>
    </div>
  );
}
