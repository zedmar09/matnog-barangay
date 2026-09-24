"use client";

import { type FormEvent, useMemo, useState } from "react";

import Link from "next/link";

import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Database,
  FileWarning,
  Plus,
  Search,
  Store,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  const payments = useBusinessRegistryStore((state) => state.payments);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();

  const report = useMemo(() => {
    const scoped = businesses.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
    const scopedIds = new Set(scoped.map((item) => item.id));
    const scopedPayments = payments.filter((payment) => scopedIds.has(payment.businessId));
    const active = scoped.filter((item) => item.status === "Active");
    const renewal = scoped.filter((item) => item.status === "For renewal");
    const lapsed = scoped.filter((item) => item.status === "Lapsed");
    const collected = scopedPayments.reduce((total, item) => total + item.amount, 0);
    const outstanding = scoped.reduce((total, item) => total + Math.max(0, item.assessedFee - item.amountPaid), 0);
    const employees = scoped.reduce((total, item) => total + item.employeeCount, 0);
    const validClearances = scoped.filter((item) => item.clearanceStatus === "Valid").length;
    const bplsSynced = scoped.filter((item) => item.bplsSyncStatus === "Synced").length;
    const bplsNeedsReview = scoped.filter((item) => item.bplsSyncStatus === "Needs review").length;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return {
      scoped,
      active,
      renewal,
      lapsed,
      collected,
      outstanding,
      employees,
      validClearances,
      bplsSynced,
      bplsNeedsReview,
      activityData: BUSINESS_TYPES.map((name) => ({
        name,
        businesses: scoped.filter((item) => item.businessType === name).length,
        employees: scoped
          .filter((item) => item.businessType === name)
          .reduce((sum, item) => sum + item.employeeCount, 0),
      })).sort((a, b) => b.businesses - a.businesses),
      statusData: [
        { name: "Active", value: active.length, color: "#168e83" },
        { name: "For renewal", value: renewal.length, color: "#e8a23a" },
        { name: "Lapsed", value: lapsed.length, color: "#df675f" },
        { name: "Closed", value: scoped.filter((item) => item.status === "Closed").length, color: "#7d8e8b" },
      ],
      registrationTrend: months.map((month, index) => ({
        month,
        registrations: scoped.filter((item) => Number(item.registrationDate.slice(5, 7)) === index + 1).length,
      })),
      collectionTrend: months.map((month, index) => ({
        month,
        collected: scopedPayments
          .filter((item) => Number(item.paymentDate.slice(5, 7)) === index + 1)
          .reduce((sum, item) => sum + item.amount, 0),
      })),
      ownershipData: OWNERSHIP_TYPES.map((name, index) => ({
        name,
        value: scoped.filter((item) => item.ownership === name).length,
        color: ["#168e83", "#4285c5", "#e8a23a", "#835fb4"][index],
      })),
      salesData: GROSS_SALES_BRACKETS.map((name) => ({
        name,
        businesses: scoped.filter((item) => item.grossSalesBracket === name).length,
      })),
      barangayData: MATNOG_BARANGAYS.map((barangay) => ({
        name: barangay.name,
        businesses: scoped.filter((item) => item.barangayId === barangay.code).length,
      }))
        .filter((item) => item.businesses)
        .sort((a, b) => b.businesses - a.businesses)
        .slice(0, 10),
    };
  }, [businesses, payments, selectedBarangay]);

  const tooltipStyle = {
    border: "1px solid #dce8e5",
    borderRadius: 9,
    boxShadow: "0 8px 24px rgb(32 72 66 / 12%)",
    color: "#284640",
    fontSize: 12,
  };
  const complianceRate = report.scoped.length ? Math.round((report.validClearances / report.scoped.length) * 100) : 0;
  const syncRate = report.scoped.length ? Math.round((report.bplsSynced / report.scoped.length) * 100) : 0;

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${businessStyles.businessHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>Business Registry Dashboard</h1>
            <p>{selectedBarangayName} · Registration, compliance, collections, employment, and permit health.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnSecondary} href="/barangay-affairs/businesses/masterlist">
              View masterlist
            </Link>
            <Link className={styles.btnPrimary} href="/barangay-affairs/businesses/register">
              <Plus size={15} /> Register business
            </Link>
          </div>
        </div>
      </section>

      <div className={`${styles.body} ${businessStyles.dashboardBody}`}>
        <section className={businessStyles.businessKpiGrid} aria-label="Business registry summary">
          <article className={businessStyles.businessKpiCard}>
            <span>
              <Store size={20} />
            </span>
            <div>
              <small>Registered businesses</small>
              <strong>{report.scoped.length.toLocaleString()}</strong>
              <b>
                <TrendingUp size={12} /> 360 municipal records
              </b>
            </div>
          </article>
          <article className={businessStyles.businessKpiCard}>
            <span>
              <BadgeCheck size={20} />
            </span>
            <div>
              <small>Active businesses</small>
              <strong>{report.active.length.toLocaleString()}</strong>
              <b>{Math.round((report.active.length / Math.max(report.scoped.length, 1)) * 100)}% of registry</b>
            </div>
          </article>
          <article className={businessStyles.businessKpiCard}>
            <span>
              <Users size={20} />
            </span>
            <div>
              <small>Employment generated</small>
              <strong>{report.employees.toLocaleString()}</strong>
              <b>Reported local jobs</b>
            </div>
          </article>
          <article className={businessStyles.businessKpiCard}>
            <span>
              <Banknote size={20} />
            </span>
            <div>
              <small>Fees collected</small>
              <strong>{money(report.collected)}</strong>
              <b>Recorded payments</b>
            </div>
          </article>
          <article className={`${businessStyles.businessKpiCard} ${businessStyles.warningKpi}`}>
            <span>
              <CalendarClock size={20} />
            </span>
            <div>
              <small>Due for renewal</small>
              <strong>{report.renewal.length}</strong>
              <b>Action before Oct 15</b>
            </div>
          </article>
          <article className={`${businessStyles.businessKpiCard} ${businessStyles.dangerKpi}`}>
            <span>
              <CircleAlert size={20} />
            </span>
            <div>
              <small>Lapsed businesses</small>
              <strong>{report.lapsed.length}</strong>
              <b>{money(report.outstanding)} outstanding</b>
            </div>
          </article>
        </section>

        <section className={businessStyles.insightStrip}>
          <div>
            <BadgeCheck size={18} />
            <span>
              <small>Clearance compliance</small>
              <strong>{complianceRate}% valid</strong>
            </span>
          </div>
          <i>
            <b style={{ width: `${complianceRate}%` }} />
          </i>
          <div>
            <Database size={18} />
            <span>
              <small>BPLS integration</small>
              <strong>{syncRate}% synchronized</strong>
            </span>
          </div>
          <i>
            <b style={{ width: `${syncRate}%` }} />
          </i>
          <div>
            <FileWarning size={18} />
            <span>
              <small>Needs review</small>
              <strong>{report.bplsNeedsReview} records</strong>
            </span>
          </div>
        </section>

        <section className={businessStyles.businessChartGrid}>
          <article className={`${businessStyles.businessChartCard} ${businessStyles.chartWide}`}>
            <div className={businessStyles.chartHeader}>
              <span>
                <BarChart3 size={20} />
              </span>
              <div>
                <h2>Businesses by Activity</h2>
                <p>Registered establishments and reported jobs by economic activity</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={430}>
              <BarChart
                data={report.activityData}
                layout="vertical"
                margin={{ top: 4, right: 28, left: 38, bottom: 0 }}
              >
                <CartesianGrid stroke="#edf3f1" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "#647b77", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={145}
                  tick={{ fill: "#425f5a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f2f8f6" }} />
                <Bar dataKey="businesses" name="Businesses" fill="#168e83" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className={businessStyles.businessChartCard}>
            <div className={businessStyles.chartHeader}>
              <span>
                <Activity size={20} />
              </span>
              <div>
                <h2>Registry Status</h2>
                <p>Current operating and renewal position</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={245}>
              <PieChart>
                <Pie
                  data={report.statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={94}
                  paddingAngle={3}
                >
                  {report.statusData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className={businessStyles.chartLegend}>
              {report.statusData.map((item) => (
                <span key={item.name}>
                  <i style={{ background: item.color }} />
                  {item.name}
                  <b>{item.value}</b>
                </span>
              ))}
            </div>
          </article>

          <article className={businessStyles.businessChartCard}>
            <div className={businessStyles.chartHeader}>
              <span>
                <TrendingUp size={20} />
              </span>
              <div>
                <h2>Monthly Registrations</h2>
                <p>New and renewed registry entries by month</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={285}>
              <AreaChart data={report.registrationTrend} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="businessRegistrations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#168e83" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="#168e83" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#edf3f1" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#647b77", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#647b77", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="registrations"
                  name="Registrations"
                  stroke="#168e83"
                  strokeWidth={2.5}
                  fill="url(#businessRegistrations)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </article>

          <article className={businessStyles.businessChartCard}>
            <div className={businessStyles.chartHeader}>
              <span>
                <Banknote size={20} />
              </span>
              <div>
                <h2>Monthly Collections</h2>
                <p>Barangay clearance fee payments recorded in 2026</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={285}>
              <BarChart data={report.collectionTrend} margin={{ top: 10, right: 12, left: 6, bottom: 0 }}>
                <CartesianGrid stroke="#edf3f1" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#647b77", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(value) => `₱${Math.round(value / 1000)}k`}
                  tick={{ fill: "#647b77", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => money(Number(value))}
                  cursor={{ fill: "#f2f8f6" }}
                />
                <Bar dataKey="collected" name="Collected" fill="#4285c5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className={businessStyles.businessChartCard}>
            <div className={businessStyles.chartHeader}>
              <span>
                <Building2 size={20} />
              </span>
              <div>
                <h2>Ownership Structure</h2>
                <p>Registered businesses by legal ownership type</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={235}>
              <PieChart>
                <Pie data={report.ownershipData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={92}>
                  {report.ownershipData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className={businessStyles.chartLegend}>
              {report.ownershipData.map((item) => (
                <span key={item.name}>
                  <i style={{ background: item.color }} />
                  {item.name}
                  <b>{item.value}</b>
                </span>
              ))}
            </div>
          </article>

          <article className={businessStyles.businessChartCard}>
            <div className={businessStyles.chartHeader}>
              <span>
                <Store size={20} />
              </span>
              <div>
                <h2>Gross Sales Profile</h2>
                <p>Business count by declared annual sales bracket</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={report.salesData} layout="vertical" margin={{ top: 4, right: 18, left: 35, bottom: 0 }}>
                <CartesianGrid stroke="#edf3f1" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "#647b77", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={{ fill: "#4e6863", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f2f8f6" }} />
                <Bar dataKey="businesses" name="Businesses" fill="#e8a23a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className={`${businessStyles.businessChartCard} ${businessStyles.chartWide}`}>
            <div className={businessStyles.chartHeader}>
              <span>
                <Store size={20} />
              </span>
              <div>
                <h2>Business Density by Barangay</h2>
                <p>Top barangays by registered establishment count</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={310}>
              <BarChart data={report.barangayData} margin={{ top: 10, right: 14, left: 0, bottom: 25 }}>
                <CartesianGrid stroke="#edf3f1" vertical={false} />
                <XAxis
                  dataKey="name"
                  angle={-24}
                  textAnchor="end"
                  height={60}
                  tick={{ fill: "#536d68", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#647b77", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f2f8f6" }} />
                <Bar dataKey="businesses" name="Businesses" fill="#835fb4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>
        </section>

        <section className={businessStyles.businessOperationsGrid}>
          <article className={businessStyles.operationsCard}>
            <div className={businessStyles.operationsHeader}>
              <div>
                <h2>Renewal and Lapse Queue</h2>
                <p>Businesses requiring immediate follow-up</p>
              </div>
              <Link href="/barangay-affairs/businesses/renewals">
                Open renewals <ArrowRight size={14} />
              </Link>
            </div>
            <div className={businessStyles.operationsList}>
              {[...report.renewal, ...report.lapsed].slice(0, 7).map((item) => (
                <div key={item.id}>
                  <span className={businessStyles.businessIcon}>
                    <BriefcaseBusiness size={16} />
                  </span>
                  <div>
                    <strong>{item.businessName}</strong>
                    <small>
                      {item.businessNumber} · Brgy. {barangayName(item.barangayId)}
                    </small>
                  </div>
                  <BusinessStatusBadge status={item.status} />
                  <time>{shortDate(item.renewalDueDate)}</time>
                </div>
              ))}
            </div>
          </article>
          <aside className={businessStyles.operationsCard}>
            <div className={businessStyles.operationsHeader}>
              <div>
                <h2>Operational Health</h2>
                <p>Key compliance and integration signals</p>
              </div>
            </div>
            <div className={businessStyles.healthList}>
              <div>
                <span>
                  <BadgeCheck size={17} /> Valid clearances
                </span>
                <strong>{report.validClearances}</strong>
              </div>
              <div>
                <span>
                  <CalendarClock size={17} /> Pending issuance
                </span>
                <strong>{report.scoped.filter((item) => item.clearanceStatus === "Pending").length}</strong>
              </div>
              <div>
                <span>
                  <CircleAlert size={17} /> Expired clearances
                </span>
                <strong>{report.scoped.filter((item) => item.clearanceStatus === "Expired").length}</strong>
              </div>
              <div>
                <span>
                  <ClipboardCheck size={17} /> BPLS synchronized
                </span>
                <strong>{report.bplsSynced}</strong>
              </div>
              <div>
                <span>
                  <FileWarning size={17} /> BPLS needs review
                </span>
                <strong>{report.bplsNeedsReview}</strong>
              </div>
              <div>
                <span>
                  <Banknote size={17} /> Outstanding fees
                </span>
                <strong>{money(report.outstanding)}</strong>
              </div>
            </div>
          </aside>
        </section>
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

export function BusinessRegistrationView({ businessId }: { businessId?: string }) {
  const registerBusiness = useBusinessRegistryStore((state) => state.registerBusiness);
  const updateBusiness = useBusinessRegistryStore((state) => state.updateBusiness);
  const existingBusiness = useBusinessRegistryStore((state) =>
    businessId ? state.businesses.find((item) => item.id === businessId) : undefined,
  );
  const residents = useResidentRegistryStore((state) => state.residents);
  const structures = useHouseholdRegistryStore((state) => state.structures);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const defaultBarangay = selectedBarangay === "all" ? MATNOG_BARANGAYS[0].code : selectedBarangay;
  const [barangayId, setBarangayId] = useState(existingBusiness?.barangayId ?? defaultBarangay);
  const [ownerQuery, setOwnerQuery] = useState("");
  const [ownerResidentId, setOwnerResidentId] = useState(existingBusiness?.ownerResidentId ?? "");
  const [businessName, setBusinessName] = useState(existingBusiness?.businessName ?? "");
  const [tradeName, setTradeName] = useState(existingBusiness?.tradeName ?? "");
  const [businessType, setBusinessType] = useState(existingBusiness?.businessType ?? BUSINESS_TYPES[0]);
  const [ownership, setOwnership] = useState<BusinessOwnership>(existingBusiness?.ownership ?? "Sole proprietorship");
  const [structureId, setStructureId] = useState(existingBusiness?.structureId ?? "");
  const [grossSalesBracket, setGrossSalesBracket] = useState(
    existingBusiness?.grossSalesBracket ?? GROSS_SALES_BRACKETS[0],
  );
  const [employeeCount, setEmployeeCount] = useState(existingBusiness?.employeeCount ?? 1);
  const [contactNumber, setContactNumber] = useState(existingBusiness?.contactNumber ?? "");
  const [email, setEmail] = useState(existingBusiness?.email ?? "");
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
    const input = {
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
    };
    const business = businessId ? updateBusiness(businessId, input) : registerBusiness(input);
    if (!business) return;
    setNotice(
      businessId
        ? `${business.businessNumber} was updated successfully.`
        : `${business.businessNumber} was created. Clearance assessment can now begin.`,
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A9 Business Registry</p>
          <h1>{businessId ? "Update Business" : "Register Business"}</h1>
          <p>
            {businessId
              ? "Update the registered owner, location, activity, and contact information."
              : "Create a barangay business record linked to an existing resident and structure."}
          </p>
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
              <small>Search the resident registry and confirm the registered owner</small>
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
              {businessId ? <CheckCircle2 size={14} /> : <Plus size={14} />}{" "}
              {businessId ? "Save changes" : "Create business record"}
            </button>
          </footer>
        </section>
      </form>
    </div>
  );
}
