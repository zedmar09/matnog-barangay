"use client";

import { useMemo } from "react";

import Link from "next/link";

import { CheckCircle2, Clock3, FileBadge2, Files, PackageCheck, UserCheck } from "lucide-react";
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
import dashboardStyles from "@/features/resident-registry/views/resident-dashboard.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useDocumentStore } from "../stores/document-store";

const STATUS_COLORS: Record<string, string> = {
  Draft: "#94a3b8",
  "Pending Review": "#f59e0b",
  "For Approval": "#3b82f6",
  "Ready for Release": "#8b5cf6",
  Released: "#159488",
  Rejected: "#ef4444",
  Revoked: "#7f1d1d",
};

const chartTooltipStyle = {
  border: "1px solid #cfdedb",
  borderRadius: 10,
  boxShadow: "0 10px 28px rgb(21 63 58 / 18%)",
  color: "#173c37",
  fontSize: 12,
};

export function DocumentDashboardView() {
  const templates = useDocumentStore((state) => state.templates);
  const documents = useDocumentStore((state) => state.documents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();

  const report = useMemo(() => {
    const scoped = documents.filter(
      (document) => selectedBarangay === "all" || document.barangayId === selectedBarangay,
    );
    const count = (status: string) => scoped.filter((document) => document.status === status).length;
    const released = count("Released");

    const statusData = Object.keys(STATUS_COLORS)
      .map((status) => ({ name: status, value: count(status) }))
      .filter((item) => item.value > 0);

    const templateData = templates
      .map((template) => ({
        name: template.shortCode,
        requests: scoped.filter((document) => document.templateCode === template.code).length,
      }))
      .sort((a, b) => b.requests - a.requests);

    const monthMap = new Map<string, { requests: number; released: number }>();
    for (const document of scoped) {
      const key = document.requestedAt.slice(0, 7);
      const current = monthMap.get(key) ?? { requests: 0, released: 0 };
      current.requests += 1;
      if (document.status === "Released") current.released += 1;
      monthMap.set(key, current);
    }
    const monthlyData = [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-9)
      .map(([month, totals]) => ({
        month: new Date(`${month}-01T00:00:00`).toLocaleDateString("en-PH", { month: "short" }),
        ...totals,
      }));

    const barangayData = MATNOG_BARANGAYS.map((barangay) => ({
      name: barangay.name,
      requests: scoped.filter((document) => document.barangayId === barangay.code).length,
    }))
      .filter((item) => item.requests > 0)
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10)
      .reverse();

    const releasedDocuments = scoped.filter((document) => document.releasedAt);
    const turnaroundHours = releasedDocuments.map(
      (document) => (new Date(document.releasedAt).getTime() - new Date(document.requestedAt).getTime()) / 3_600_000,
    );
    const averageHours = turnaroundHours.length
      ? turnaroundHours.reduce((sum, value) => sum + value, 0) / turnaroundHours.length
      : 0;

    return {
      total: scoped.length,
      pending: count("Pending Review"),
      approval: count("For Approval"),
      ready: count("Ready for Release"),
      released,
      releaseRate: scoped.length ? Math.round((released / scoped.length) * 100) : 0,
      averageHours,
      paymentVerified: scoped.filter((document) => document.paymentVerified).length,
      statusData,
      templateData,
      monthlyData,
      barangayData,
    };
  }, [documents, selectedBarangay, templates]);

  return (
    <main className={dashboardStyles.page}>
      <section className={`${dashboardStyles.hero} ${dashboardStyles.documentHero}`}>
        <div className={dashboardStyles.heroInner}>
          <div>
            <h1>Barangay Documents Dashboard</h1>
            <p>{selectedBarangayName} · Monitor document demand, approvals, releases, and processing performance.</p>
          </div>
          <div className={dashboardStyles.heroActions}>
            <Link className={dashboardStyles.btnPrimary} href="/barangay-affairs/documents/requests">
              <FileBadge2 size={16} /> Open requests
            </Link>
          </div>
        </div>
      </section>

      <div className={dashboardStyles.body}>
        <section className={dashboardStyles.summaryRow} aria-label="Document workflow summary">
          {[
            { label: "Total requests", value: report.total, sub: selectedBarangayName, icon: Files },
            { label: "Pending review", value: report.pending, sub: "Needs document checking", icon: Clock3 },
            { label: "For approval", value: report.approval, sub: "Awaiting approval decision", icon: UserCheck },
            { label: "Ready for release", value: report.ready, sub: "Available for claiming", icon: PackageCheck },
            {
              label: "Released",
              value: report.released,
              sub: `${report.releaseRate}% of all requests`,
              icon: CheckCircle2,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article className={dashboardStyles.card} key={item.label}>
                <span className={dashboardStyles.cardLabel}>
                  <Icon size={16} /> {item.label}
                </span>
                <strong className={dashboardStyles.cardValue}>{item.value.toLocaleString()}</strong>
                <div className={dashboardStyles.cardSub}>{item.sub}</div>
              </article>
            );
          })}
        </section>

        <section className={dashboardStyles.chartGrid}>
          <article className={dashboardStyles.chartCard}>
            <h2 className={dashboardStyles.chartTitle}>Requests by document type</h2>
            <p className={dashboardStyles.chartSubtitle}>Volume for each certificate and clearance</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={report.templateData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#edf3f1" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#68807c", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#68807c", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "#eef7f5" }} />
                <Bar dataKey="requests" fill="#159488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className={dashboardStyles.chartCard}>
            <h2 className={dashboardStyles.chartTitle}>Workflow status</h2>
            <p className={dashboardStyles.chartSubtitle}>Where current document requests are in the process</p>
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
                  paddingAngle={2}
                >
                  {report.statusData.map((entry) => (
                    <Cell fill={STATUS_COLORS[entry.name]} key={entry.name} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className={dashboardStyles.legendRow}>
              {report.statusData.map((entry) => (
                <span className={dashboardStyles.legendItem} key={entry.name}>
                  <i className={dashboardStyles.legendDot} style={{ background: STATUS_COLORS[entry.name] }} />
                  {entry.name} ({entry.value})
                </span>
              ))}
            </div>
          </article>

          <article className={`${dashboardStyles.chartCard} ${dashboardStyles.chartCardFull}`}>
            <h2 className={dashboardStyles.chartTitle}>Monthly document volume</h2>
            <p className={dashboardStyles.chartSubtitle}>Requests received and documents released during 2026</p>
            <ResponsiveContainer width="100%" height={290}>
              <AreaChart data={report.monthlyData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="documentRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#159488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#159488" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#edf3f1" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#68807c", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#68807c", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#159488"
                  strokeWidth={2.5}
                  fill="url(#documentRequests)"
                />
                <Area type="monotone" dataKey="released" stroke="#6366f1" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </article>

          <article className={dashboardStyles.chartCard}>
            <h2 className={dashboardStyles.chartTitle}>Requests by barangay</h2>
            <p className={dashboardStyles.chartSubtitle}>Ten barangays with the highest request volume</p>
            <ResponsiveContainer width="100%" height={330}>
              <BarChart
                data={report.barangayData}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 38, bottom: 0 }}
              >
                <CartesianGrid stroke="#edf3f1" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "#68807c", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={92}
                  tick={{ fill: "#4e6965", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "#eef7f5" }} />
                <Bar dataKey="requests" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className={dashboardStyles.chartCard}>
            <h2 className={dashboardStyles.chartTitle}>Processing performance</h2>
            <p className={dashboardStyles.chartSubtitle}>Operational indicators for the selected barangay scope</p>
            <div style={{ display: "grid", gap: 18, paddingTop: 10 }}>
              {[
                {
                  label: "Release completion",
                  value: report.releaseRate,
                  detail: `${report.released} released requests`,
                },
                {
                  label: "Payment verification",
                  value: report.total ? Math.round((report.paymentVerified / report.total) * 100) : 0,
                  detail: `${report.paymentVerified} verified or no-fee requests`,
                },
              ].map((metric) => (
                <div key={metric.label}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      color: "#4e6965",
                      fontSize: 12,
                    }}
                  >
                    <span>{metric.label}</span>
                    <strong style={{ color: "#173c37", fontSize: 17 }}>{metric.value}%</strong>
                  </div>
                  <div
                    style={{
                      height: 10,
                      margin: "8px 0 5px",
                      overflow: "hidden",
                      borderRadius: 999,
                      background: "#e8f0ee",
                    }}
                  >
                    <div
                      style={{ width: `${metric.value}%`, height: "100%", borderRadius: 999, background: "#159488" }}
                    />
                  </div>
                  <small style={{ color: "#8fa09d" }}>{metric.detail}</small>
                </div>
              ))}
              <div className={dashboardStyles.card} style={{ background: "#f5faf8" }}>
                <span className={dashboardStyles.cardLabel}>Average release time</span>
                <strong className={dashboardStyles.cardValue}>{report.averageHours.toFixed(1)} hrs</strong>
                <div className={dashboardStyles.cardSub}>From request encoding to claimant release</div>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
