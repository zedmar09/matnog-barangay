"use client";

import { useMemo } from "react";

import Link from "next/link";

import {
  AlertTriangle,
  BadgeAlert,
  CircleDollarSign,
  Clock3,
  FilePlus2,
  Landmark,
  ReceiptText,
  UsersRound,
  WalletCards,
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
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import dashboardStyles from "@/features/resident-registry/views/resident-dashboard.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { ASSISTANCE_TYPES } from "../data/assistance-data";
import { useAssistanceStore } from "../stores/assistance-store";
import type { AssistanceRecord } from "../types/assistance";
import assistanceStyles from "./assistance.module.css";

const _barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
const _date = (value: string) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-PH") : "—");

function _StatusBadge({ status }: { status: AssistanceRecord["status"] }) {
  return (
    <span
      className={`${styles.badge} ${status === "Released" ? styles.active : status === "Held" ? styles.danger : styles.warning}`}
    >
      {status}
    </span>
  );
}

export function AssistanceDashboardView() {
  const records = useAssistanceStore((state) => state.records);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();

  const report = useMemo(() => {
    const scoped = records.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
    const released = scoped.filter((item) => item.status === "Released");
    const uniqueResidents = new Set(scoped.map((item) => item.residentId)).size;
    const uniqueHouseholds = new Set(scoped.map((item) => item.householdId).filter(Boolean)).size;
    const totalReleased = released.reduce((sum, item) => sum + item.amount, 0);
    const totalLiquidated = released.reduce((sum, item) => sum + item.liquidatedAmount, 0);

    const programData = ASSISTANCE_TYPES.map((type) => {
      const items = scoped.filter((item) => item.assistanceType === type);
      return {
        name: type,
        requests: items.length,
        released: items.filter((item) => item.status === "Released").reduce((sum, item) => sum + item.amount, 0),
      };
    });

    const statusColors: Record<AssistanceRecord["status"], string> = {
      Released: "#159488",
      "Pending Review": "#f2a93b",
      Held: "#df625f",
    };
    const statusData = (["Released", "Pending Review", "Held"] as const)
      .map((status) => ({
        name: status === "Held" ? "Needs duplicate review" : status,
        value: scoped.filter((item) => item.status === status).length,
        color: statusColors[status],
      }))
      .filter((item) => item.value > 0);

    const monthMap = new Map<string, { requests: number; amount: number }>();
    for (const item of scoped) {
      const month = item.assistanceDate.slice(0, 7);
      const current = monthMap.get(month) ?? { requests: 0, amount: 0 };
      current.requests += 1;
      if (item.status === "Released") current.amount += item.amount;
      monthMap.set(month, current);
    }
    const monthlyData = [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, values]) => ({
        month: new Date(`${month}-01T00:00:00`).toLocaleDateString("en-PH", { month: "short" }),
        ...values,
      }));

    const totalsBy = (field: "fundSource" | "releasingOffice") => {
      const totals = new Map<string, { records: number; amount: number }>();
      for (const item of released) {
        const key = item[field];
        const current = totals.get(key) ?? { records: 0, amount: 0 };
        current.records += 1;
        current.amount += item.amount;
        totals.set(key, current);
      }
      return [...totals.entries()].map(([name, values]) => ({ name, ...values })).sort((a, b) => b.amount - a.amount);
    };

    const barangayData = MATNOG_BARANGAYS.map((barangay) => {
      const items = scoped.filter((item) => item.barangayId === barangay.code);
      return {
        name: barangay.name,
        beneficiaries: new Set(items.map((item) => item.residentId)).size,
        amount: items.filter((item) => item.status === "Released").reduce((sum, item) => sum + item.amount, 0),
      };
    })
      .filter((item) => item.beneficiaries > 0)
      .sort((a, b) => b.beneficiaries - a.beneficiaries)
      .slice(0, selectedBarangay === "all" ? 10 : 1)
      .reverse();

    return {
      scoped,
      released,
      uniqueResidents,
      uniqueHouseholds,
      totalReleased,
      totalLiquidated,
      pending: scoped.filter((item) => item.status === "Pending Review").length,
      held: scoped.filter((item) => item.status === "Held").length,
      unliquidated: released.reduce((sum, item) => sum + Math.max(item.amount - item.liquidatedAmount, 0), 0),
      liquidationRate: totalReleased ? Math.round((totalLiquidated / totalReleased) * 100) : 0,
      programData,
      statusData,
      monthlyData,
      fundData: totalsBy("fundSource"),
      officeData: totalsBy("releasingOffice"),
      barangayData,
    };
  }, [records, selectedBarangay]);

  const tooltipStyle = {
    border: "1px solid #cfdedb",
    borderRadius: 10,
    boxShadow: "0 10px 28px rgb(21 63 58 / 18%)",
    color: "#173c37",
    fontSize: 12,
  };

  return (
    <main className={dashboardStyles.page}>
      <section className={`${dashboardStyles.hero} ${dashboardStyles.assistanceHero}`}>
        <div className={dashboardStyles.heroInner}>
          <div>
            <h1>Assistance &amp; Benefits Dashboard</h1>
            <p>{selectedBarangayName} · Program reach, releases, funding, and accountability in one view.</p>
          </div>
          <div className={dashboardStyles.heroActions}>
            <Link className={dashboardStyles.btnPrimary} href="/barangay-affairs/assistance/new">
              <FilePlus2 size={16} /> New Assistance
            </Link>
            <Link className={dashboardStyles.btnSecondary} href="/barangay-affairs/assistance/ledger">
              <ReceiptText size={16} /> Open Ledger
            </Link>
          </div>
        </div>
      </section>

      <div className={dashboardStyles.body}>
        <section className={dashboardStyles.summaryRow} aria-label="Assistance and benefits summary">
          {[
            {
              label: "People Assisted",
              value: report.uniqueResidents.toLocaleString(),
              sub: `${report.uniqueHouseholds.toLocaleString()} households reached`,
              icon: UsersRound,
            },
            {
              label: "Released Assistance",
              value: money(report.totalReleased),
              sub: `${report.released.length.toLocaleString()} completed releases`,
              icon: CircleDollarSign,
            },
            {
              label: "Pending Review",
              value: report.pending.toLocaleString(),
              sub: "Applications awaiting assessment",
              icon: Clock3,
            },
            {
              label: "Needs Verification",
              value: report.held.toLocaleString(),
              sub: "Possible duplicate assistance records",
              icon: AlertTriangle,
            },
            {
              label: "For Liquidation",
              value: money(report.unliquidated),
              sub: `${report.liquidationRate}% of released value liquidated`,
              icon: WalletCards,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article className={dashboardStyles.card} key={item.label}>
                <span className={dashboardStyles.cardLabel}>
                  <Icon size={16} /> {item.label}
                </span>
                <strong className={dashboardStyles.cardValue}>{item.value}</strong>
                <div className={dashboardStyles.cardSub}>{item.sub}</div>
              </article>
            );
          })}
        </section>

        <section className={dashboardStyles.chartGrid}>
          <article className={dashboardStyles.chartCard}>
            <h2 className={dashboardStyles.chartTitle}>Assistance by Program</h2>
            <p className={dashboardStyles.chartSubtitle}>Released value and number of requests for each benefit</p>
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={report.programData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#edf3f1" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#68807c", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(value) => `₱${Math.round(value / 1000)}k`}
                  tick={{ fill: "#68807c", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "#eef7f5" }}
                  formatter={(value) => money(Number(value))}
                />
                <Bar dataKey="released" name="Released amount" fill="#159488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className={dashboardStyles.chartCard}>
            <h2 className={dashboardStyles.chartTitle}>Application Status</h2>
            <p className={dashboardStyles.chartSubtitle}>Current position of assistance applications</p>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={report.statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={3}
                >
                  {report.statusData.map((entry) => (
                    <Cell fill={entry.color} key={entry.name} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className={dashboardStyles.legendRow}>
              {report.statusData.map((entry) => (
                <span className={dashboardStyles.legendItem} key={entry.name}>
                  <i className={dashboardStyles.legendDot} style={{ background: entry.color }} />
                  {entry.name} ({entry.value})
                </span>
              ))}
            </div>
          </article>

          <article className={`${dashboardStyles.chartCard} ${dashboardStyles.chartCardFull}`}>
            <h2 className={dashboardStyles.chartTitle}>Monthly Assistance Activity</h2>
            <p className={dashboardStyles.chartSubtitle}>
              Applications received and assistance value released during 2026
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={report.monthlyData} margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="assistanceAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#159488" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#159488" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#edf3f1" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#68807c", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(value) => `₱${Math.round(value / 1000)}k`}
                  tick={{ fill: "#68807c", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => money(Number(value))} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  name="Released amount"
                  stroke="#159488"
                  strokeWidth={2.5}
                  fill="url(#assistanceAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </article>

          <article className={`${dashboardStyles.chartCard} ${assistanceStyles.dashboardAccountabilityCard}`}>
            <div className={assistanceStyles.dashboardAccountabilityHeader}>
              <span className={assistanceStyles.dashboardAccountabilityIcon}>
                <CircleDollarSign size={22} />
              </span>
              <div>
                <h2 className={dashboardStyles.chartTitle}>Fund Reconciliation</h2>
                <p className={dashboardStyles.chartSubtitle}>Released assistance value by funding source</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={report.fundData} layout="vertical" margin={{ top: 4, right: 18, left: 30, bottom: 0 }}>
                <CartesianGrid stroke="#edf3f1" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(value) => `₱${Math.round(value / 1000)}k`}
                  tick={{ fill: "#68807c", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={118}
                  tick={{ fill: "#516c68", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => money(Number(value))} />
                <Bar dataKey="amount" name="Released amount" fill="#287bb5" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className={`${dashboardStyles.chartCard} ${assistanceStyles.dashboardAccountabilityCard}`}>
            <div className={assistanceStyles.dashboardAccountabilityHeader}>
              <span className={assistanceStyles.dashboardAccountabilityIcon}>
                <Landmark size={22} />
              </span>
              <div>
                <h2 className={dashboardStyles.chartTitle}>Office Accountability</h2>
                <p className={dashboardStyles.chartSubtitle}>Share of released assistance managed by each office</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={report.officeData} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={92}>
                  {report.officeData.map((entry, index) => (
                    <Cell fill={["#137c71", "#35a89a", "#76c8bb", "#4f70c8", "#f2a93b"][index % 5]} key={entry.name} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => money(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
            <div className={dashboardStyles.legendRow}>
              {report.officeData.map((entry, index) => (
                <span className={dashboardStyles.legendItem} key={entry.name}>
                  <i
                    className={dashboardStyles.legendDot}
                    style={{ background: ["#137c71", "#35a89a", "#76c8bb", "#4f70c8", "#f2a93b"][index % 5] }}
                  />
                  {entry.name}
                </span>
              ))}
            </div>
          </article>

          <article className={`${dashboardStyles.chartCard} ${dashboardStyles.chartCardFull}`}>
            <h2 className={dashboardStyles.chartTitle}>Barangay Reach</h2>
            <p className={dashboardStyles.chartSubtitle}>
              {selectedBarangay === "all"
                ? "Top barangays by unique residents assisted"
                : "Residents assisted in the selected barangay"}
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={report.barangayData}
                layout="vertical"
                margin={{ top: 4, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid stroke="#edf3f1" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "#68807c", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={115}
                  tick={{ fill: "#516c68", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="beneficiaries" name="Residents assisted" fill="#159488" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <section className={`${assistanceStyles.accountabilityGrid} ${dashboardStyles.chartCardFull}`}>
            <article className={assistanceStyles.accountabilityCard}>
              <span>
                <Landmark size={19} /> Financial Accountability
              </span>
              <strong>{report.liquidationRate}%</strong>
              <p>{money(report.totalLiquidated)} supported by liquidation documents</p>
              <i>
                <b style={{ width: `${report.liquidationRate}%` }} />
              </i>
              <Link href="/barangay-affairs/assistance/disbursement">Review disbursement and liquidation</Link>
            </article>
            <article className={assistanceStyles.accountabilityCard}>
              <span>
                <BadgeAlert size={19} /> Records Requiring Attention
              </span>
              <strong>{(report.pending + report.held).toLocaleString()}</strong>
              <p>
                {report.pending} pending assessments and {report.held} possible duplicate records
              </p>
              <div className={assistanceStyles.attentionLinks}>
                <Link href="/barangay-affairs/assistance/ledger?status=Pending%20Review">
                  Open pending applications
                </Link>
                <Link href="/barangay-affairs/assistance/alerts">Review duplicate alerts</Link>
              </div>
            </article>
          </section>
        </section>
      </div>
    </main>
  );
}

export { AssistanceLedgerMasterlistView as AssistanceLedgerView } from "./assistance-ledger-view";
