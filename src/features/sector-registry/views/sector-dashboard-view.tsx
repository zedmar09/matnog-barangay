"use client";

import { useMemo } from "react";

import Link from "next/link";

import {
  Accessibility,
  AlertTriangle,
  Baby,
  BellRing,
  BookOpen,
  ClipboardList,
  Download,
  GraduationCap,
  HandHeart,
  HeartHandshake,
  Layers3,
  Plus,
  UserCheck,
  UserRoundCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import dashboardStyles from "@/features/resident-registry/views/resident-dashboard.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useSectorRegistryStore } from "../stores/sector-registry-store";
import type { SectorCode } from "../types/sector";

const STATUS_COLORS = ["#159488", "#f2a93b", "#df625f", "#94a3b8"];
const OVERLAP_COLORS = ["#4f70c8", "#8c66b2", "#d4893d"];
const SECTOR_ICONS: Record<SectorCode, typeof UsersRound> = {
  senior: HeartHandshake,
  pwd: Accessibility,
  "solo-parent": UserRoundCheck,
  child: Baby,
  youth: GraduationCap,
  osy: BookOpen,
  indigent: HandHeart,
  ip: UsersRound,
  "4ps": WalletCards,
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={dashboardStyles.reportTooltip}>
      {label ? <strong>{label}</strong> : null}
      {payload.map((entry) => (
        <span key={entry.name}>
          <i style={{ background: entry.color }} />
          {entry.name}: <b>{entry.value.toLocaleString()}</b>
        </span>
      ))}
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className={dashboardStyles.reportTooltip}>
      <span>
        <i style={{ background: item.payload.fill }} />
        {item.name}: <b>{item.value.toLocaleString()}</b>
      </span>
    </div>
  );
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function SectorDashboardView() {
  const memberships = useSectorRegistryStore((state) => state.memberships);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangayName, isAllSelected, selectedBarangays } = useBarangayScope();

  const dashboard = useMemo(() => {
    const scope = new Set(selectedBarangays);
    const residentById = new Map(residents.map((resident) => [resident.id, resident]));
    const scoped = memberships.filter((membership) => {
      const resident = residentById.get(membership.residentId);
      return resident && (isAllSelected || scope.has(resident.address.barangayId));
    });
    const activeMemberships = scoped.filter((membership) => membership.status === "Active");
    const classifiedResidentIds = new Set(activeMemberships.map((membership) => membership.residentId));
    const activeCountByResident = new Map<string, number>();
    for (const membership of activeMemberships) {
      activeCountByResident.set(membership.residentId, (activeCountByResident.get(membership.residentId) ?? 0) + 1);
    }
    const multipleSectorResidents = [...activeCountByResident.values()].filter((count) => count > 1).length;
    const pendingCount = scoped.filter((membership) => membership.status === "Pending Review").length;
    const expiredCount = scoped.filter((membership) => membership.status === "Expired").length;
    const alerts = scoped.filter(
      (membership) => membership.status === "Pending Review" || membership.status === "Expired",
    );

    const sectorData = definitions.map((definition) => ({
      code: definition.code,
      name: definition.shortName,
      fullName: definition.name,
      members: activeMemberships.filter((membership) => membership.sectorCode === definition.code).length,
      color: definition.color,
    }));

    const statuses = ["Active", "Pending Review", "Expired", "Inactive"] as const;
    const statusData = statuses.map((status) => ({
      name: status,
      value: scoped.filter((membership) => membership.status === status).length,
    }));

    const barangayData = MATNOG_BARANGAYS.map((barangay) => {
      const residentIds = new Set(
        activeMemberships
          .filter((membership) => residentById.get(membership.residentId)?.address.barangayId === barangay.code)
          .map((membership) => membership.residentId),
      );
      return { code: barangay.code, name: barangay.name, residents: residentIds.size };
    })
      .filter((barangay) => barangay.residents > 0)
      .sort((a, b) => b.residents - a.residents)
      .slice(0, isAllSelected ? 12 : 1)
      .reverse();

    const overlapData = [
      { name: "One sector", value: [...activeCountByResident.values()].filter((count) => count === 1).length },
      { name: "Two sectors", value: [...activeCountByResident.values()].filter((count) => count === 2).length },
      { name: "Three or more", value: [...activeCountByResident.values()].filter((count) => count >= 3).length },
    ];

    return {
      scoped,
      activeMemberships,
      classifiedResidents: classifiedResidentIds.size,
      multipleSectorResidents,
      pendingCount,
      expiredCount,
      alerts,
      sectorData,
      statusData,
      barangayData,
      overlapData,
      residentById,
    };
  }, [definitions, isAllSelected, memberships, residents, selectedBarangays]);

  function exportReport() {
    const rows = dashboard.sectorData.map((sector) => {
      const sectorMemberships = dashboard.scoped.filter((membership) => membership.sectorCode === sector.code);
      return [
        sector.fullName,
        sector.members,
        sectorMemberships.filter((membership) => membership.status === "Pending Review").length,
        sectorMemberships.filter((membership) => membership.status === "Expired").length,
      ];
    });
    const csv = [["Sector", "Active Memberships", "Pending Review", "Expired"], ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sectoral-registry-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const heroSummary = `${selectedBarangayName} · ${dashboard.classifiedResidents.toLocaleString()} classified residents · ${dashboard.activeMemberships.length.toLocaleString()} active memberships`;

  return (
    <div className={dashboardStyles.page}>
      <section className={`${dashboardStyles.hero} ${dashboardStyles.sectorHero}`}>
        <div className={dashboardStyles.heroInner}>
          <div>
            <h1>Sectoral Registry Dashboard</h1>
            <p>{heroSummary}</p>
          </div>
          <div className={dashboardStyles.heroActions}>
            <Link className={dashboardStyles.btnPrimary} href="/barangay-affairs/sectors/assign">
              <Plus size={16} /> Assign Sector
            </Link>
            <Link className={dashboardStyles.btnSecondary} href="/barangay-affairs/sectors/masterlist">
              <ClipboardList size={16} /> Open Masterlist
            </Link>
            <button type="button" className={dashboardStyles.btnSecondary} onClick={exportReport}>
              <Download size={16} /> Export Report
            </button>
          </div>
        </div>
      </section>

      <main className={dashboardStyles.body}>
        <section className={dashboardStyles.summaryRow} aria-label="Sectoral registry summary">
          <div className={dashboardStyles.card}>
            <div className={dashboardStyles.cardLabel}>
              <UsersRound size={15} /> Classified Residents
            </div>
            <div className={dashboardStyles.cardValue}>{dashboard.classifiedResidents.toLocaleString()}</div>
            <div className={dashboardStyles.cardSub}>Residents with an active classification</div>
          </div>
          <div className={dashboardStyles.card}>
            <div className={dashboardStyles.cardLabel}>
              <Layers3 size={15} /> Active Memberships
            </div>
            <div className={dashboardStyles.cardValue}>{dashboard.activeMemberships.length.toLocaleString()}</div>
            <div className={dashboardStyles.cardSub}>Across {definitions.length} configured sectors</div>
          </div>
          <div className={dashboardStyles.card}>
            <div className={dashboardStyles.cardLabel}>
              <UserCheck size={15} /> Multiple Sectors
            </div>
            <div className={dashboardStyles.cardValue}>{dashboard.multipleSectorResidents.toLocaleString()}</div>
            <div className={dashboardStyles.cardSub}>Residents in two or more sectors</div>
          </div>
          <div className={dashboardStyles.card}>
            <div className={dashboardStyles.cardLabel}>
              <ClipboardList size={15} /> Pending Review
            </div>
            <div className={dashboardStyles.cardValue}>{dashboard.pendingCount.toLocaleString()}</div>
            <div className={dashboardStyles.cardSub}>Supporting records need validation</div>
          </div>
          <div className={dashboardStyles.card}>
            <div className={dashboardStyles.cardLabel}>
              <AlertTriangle size={15} /> Expired Memberships
            </div>
            <div className={dashboardStyles.cardValue}>{dashboard.expiredCount.toLocaleString()}</div>
            <div className={dashboardStyles.cardSub}>Require renewal or record review</div>
          </div>
        </section>

        <section className={dashboardStyles.chartGrid} aria-label="Sectoral registry reports">
          <article className={dashboardStyles.chartCard}>
            <h2 className={dashboardStyles.chartTitle}>Sector Membership Distribution</h2>
            <p className={dashboardStyles.chartSubtitle}>Active memberships by sector classification</p>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={dashboard.sectorData}
                layout="vertical"
                margin={{ left: 8, right: 24, top: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#edf2f0" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#78908c" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={92}
                  tick={{ fontSize: 11, fill: "#49635f" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(21, 148, 136, 0.06)" }} />
                <Bar dataKey="members" name="Active memberships" radius={[0, 5, 5, 0]} barSize={18}>
                  {dashboard.sectorData.map((entry) => (
                    <Cell key={entry.code} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className={dashboardStyles.chartCard}>
            <h2 className={dashboardStyles.chartTitle}>Membership Status</h2>
            <p className={dashboardStyles.chartSubtitle}>Current validation state of sector memberships</p>
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie
                  data={dashboard.statusData}
                  cx="50%"
                  cy="44%"
                  innerRadius={68}
                  outerRadius={106}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={0}
                >
                  {dashboard.statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={9}
                  formatter={(value: string) => <span className={dashboardStyles.legendLabel}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </article>

          <article className={dashboardStyles.chartCard}>
            <h2 className={dashboardStyles.chartTitle}>Coverage by Barangay</h2>
            <p className={dashboardStyles.chartSubtitle}>
              {isAllSelected ? "Twelve barangays with the most classified residents" : "Classified resident coverage"}
            </p>
            <ResponsiveContainer width="100%" height={330}>
              <BarChart
                data={dashboard.barangayData}
                layout="vertical"
                margin={{ left: 12, right: 24, top: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#edf2f0" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#78908c" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={105}
                  tick={{ fontSize: 10, fill: "#49635f" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(79, 112, 200, 0.06)" }} />
                <Bar
                  dataKey="residents"
                  name="Classified residents"
                  fill="#4f70c8"
                  radius={[0, 5, 5, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className={dashboardStyles.chartCard}>
            <h2 className={dashboardStyles.chartTitle}>Multiple Sector Classifications</h2>
            <p className={dashboardStyles.chartSubtitle}>Number of active classifications held by each resident</p>
            <ResponsiveContainer width="100%" height={330}>
              <PieChart>
                <Pie
                  data={dashboard.overlapData}
                  cx="50%"
                  cy="44%"
                  innerRadius={68}
                  outerRadius={106}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={0}
                >
                  {dashboard.overlapData.map((entry, index) => (
                    <Cell key={entry.name} fill={OVERLAP_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={9}
                  formatter={(value: string) => <span className={dashboardStyles.legendLabel}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </article>
        </section>

        <div className={styles.sectorDashboardGrid}>
          <section className={styles.card}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Configured classifications</p>
                <h2>Sector Overview</h2>
              </div>
              <Link className={styles.secondaryButton} href="/barangay-affairs/sectors/masterlist">
                Open Masterlist
              </Link>
            </div>
            <div className={styles.sectorCardGrid}>
              {definitions.map((definition) => {
                const items = dashboard.scoped.filter((item) => item.sectorCode === definition.code);
                const active = items.filter((item) => item.status === "Active").length;
                const pending = items.filter((item) => item.status === "Pending Review").length;
                const SectorIcon = SECTOR_ICONS[definition.code];
                return (
                  <Link
                    href={`/barangay-affairs/sectors/${definition.code}`}
                    className={styles.sectorCard}
                    key={definition.code}
                  >
                    <span style={{ background: definition.color }}>
                      <SectorIcon size={21} />
                    </span>
                    <div>
                      <h3>{definition.name}</h3>
                      <p>{definition.description}</p>
                      <div className={styles.sectorMetricRow}>
                        <span className={styles.sectorPrimaryMetric}>
                          <strong>{active.toLocaleString()}</strong>
                          <small>Active members</small>
                        </span>
                        <span className={styles.sectorPendingMetric}>{pending.toLocaleString()} pending review</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
          <aside className={styles.card}>
            <div className={styles.householdSidePanel}>
              <h2>
                <BellRing size={16} /> Eligibility and Review Alerts
              </h2>
              <p>Memberships requiring supporting-document review or renewal.</p>
              <div className={styles.priorityList}>
                {dashboard.alerts.slice(0, 10).map((membership) => {
                  const resident = dashboard.residentById.get(membership.residentId);
                  const definition = definitions.find((item) => item.code === membership.sectorCode);
                  return (
                    <Link href={`/barangay-affairs/sectors/residents/${membership.residentId}`} key={membership.id}>
                      <span>
                        <strong>{resident ? formatResidentName(resident) : "Unknown resident"}</strong>
                        <small>
                          {definition?.shortName} ·{" "}
                          {resident
                            ? MATNOG_BARANGAYS.find((item) => item.code === resident.address.barangayId)?.name
                            : ""}
                        </small>
                      </span>
                      <span
                        className={`${styles.badge} ${membership.status === "Expired" ? styles.danger : styles.warning}`}
                      >
                        {membership.status}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
