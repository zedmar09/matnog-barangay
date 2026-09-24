"use client";

import { useMemo } from "react";

import Link from "next/link";

import {
  AlertCircle,
  Download,
  Droplets,
  Home,
  HousePlus,
  MapPinned,
  ShieldCheck,
  Trash2,
  UsersRound,
  Wifi,
  Zap,
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
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useHouseholdRegistryStore } from "../stores/household-registry-store";
import { householdRiskLabels, isHouseholdStale } from "../utils/household-utils";
import styles from "./household-dashboard.module.css";

const PRIORITY_COLORS = ["#1f9d72", "#f2a93b", "#df625f"];
const MATERIAL_COLORS = ["#137c71", "#35a89a", "#76c8bb", "#b9e3dc"];
const TENURE_COLORS = ["#4f70c8", "#7f93d6", "#abb8e3", "#d7def2"];

type ChartTooltipEntry = {
  name: string;
  value: number;
  color?: string;
  payload?: { fill?: string };
};

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: ChartTooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      {label ? <strong>{label}</strong> : null}
      {payload.map((entry) => (
        <span key={entry.name}>
          <i style={{ background: entry.color ?? entry.payload?.fill ?? "#159488" }} />
          {entry.name}: <b>{entry.value.toLocaleString()}</b>
        </span>
      ))}
    </div>
  );
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function HouseholdDashboardView() {
  const households = useHouseholdRegistryStore((state) => state.households);
  const structures = useHouseholdRegistryStore((state) => state.structures);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangayName, isAllSelected, selectedBarangays } = useBarangayScope();

  const dashboard = useMemo(() => {
    const scope = new Set(selectedBarangays);
    const filteredHouseholds = isAllSelected
      ? households
      : households.filter((household) => scope.has(household.barangayId));
    const filteredStructures = isAllSelected
      ? structures
      : structures.filter((structure) => scope.has(structure.barangayId));
    const memberCount = filteredHouseholds.reduce(
      (total, household) => total + household.members.filter((member) => !member.leftAt).length,
      0,
    );
    const averageSize = filteredHouseholds.length ? memberCount / filteredHouseholds.length : 0;
    const staleCount = filteredHouseholds.filter(isHouseholdStale).length;
    const priorityHouseholds = filteredHouseholds
      .filter((household) => isHouseholdStale(household) || householdRiskLabels(household).length > 0)
      .sort((a, b) => {
        const updateDifference = Number(isHouseholdStale(b)) - Number(isHouseholdStale(a));
        return updateDifference || householdRiskLabels(b).length - householdRiskLabels(a).length;
      });

    const rows = MATNOG_BARANGAYS.map((barangay) => {
      const items = filteredHouseholds.filter((household) => household.barangayId === barangay.code);
      const structureIds = new Set(items.map((household) => household.structureId));
      return {
        code: barangay.code,
        name: barangay.name,
        households: items.length,
        residents: items.reduce(
          (total, household) => total + household.members.filter((member) => !member.leftAt).length,
          0,
        ),
        structures: filteredStructures.filter((structure) => structureIds.has(structure.id)).length,
        support: items.filter((household) => householdRiskLabels(household).length > 0).length,
        stale: items.filter(isHouseholdStale).length,
      };
    }).filter((row) => row.households > 0);

    const barangayChart = [...rows]
      .sort((a, b) => b.households - a.households)
      .slice(0, isAllSelected ? 12 : rows.length)
      .reverse();
    const priorityCounts = { current: 0, support: 0, update: 0 };
    for (const household of filteredHouseholds) {
      if (isHouseholdStale(household)) priorityCounts.update += 1;
      else if (householdRiskLabels(household).length > 0) priorityCounts.support += 1;
      else priorityCounts.current += 1;
    }
    const priorityData = [
      { name: "No priority concern", value: priorityCounts.current },
      { name: "Priority support needed", value: priorityCounts.support },
      { name: "Record needs updating", value: priorityCounts.update },
    ];
    const countBy = (values: string[]) => {
      const counts = new Map<string, number>();
      for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
      return [...counts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    };
    const materialData = countBy(filteredStructures.map((structure) => structure.dwelling.constructionMaterial));
    const tenureData = countBy(filteredStructures.map((structure) => structure.dwelling.tenure));
    const totalStructures = filteredStructures.length;
    const serviceRows = [
      {
        label: "Safe toilet access",
        icon: Home,
        count: filteredStructures.filter((structure) => structure.dwelling.toiletFacility !== "None reported").length,
      },
      {
        label: "Regular electricity",
        icon: Zap,
        count: filteredStructures.filter((structure) => structure.dwelling.powerSource !== "No regular connection")
          .length,
      },
      {
        label: "Piped or protected water",
        icon: Droplets,
        count: filteredStructures.filter((structure) =>
          ["Level III connection", "Community faucet", "Deep well", "Spring / protected source"].includes(
            structure.dwelling.waterSource,
          ),
        ).length,
      },
      {
        label: "Regular waste collection",
        icon: Trash2,
        count: filteredStructures.filter((structure) =>
          ["Barangay collection", "Municipal collection"].includes(structure.dwelling.wasteDisposal),
        ).length,
      },
      {
        label: "Internet access",
        icon: Wifi,
        count: filteredStructures.filter((structure) => structure.dwelling.internetAccess !== "None").length,
      },
    ].map((service) => ({
      ...service,
      percentage: totalStructures ? Math.round((service.count / totalStructures) * 100) : 0,
    }));

    return {
      filteredHouseholds,
      filteredStructures,
      memberCount,
      averageSize,
      staleCount,
      priorityHouseholds,
      rows,
      barangayChart,
      priorityData,
      materialData,
      tenureData,
      serviceRows,
    };
  }, [households, structures, selectedBarangays, isAllSelected]);

  function exportInventory() {
    const headers = [
      "Barangay",
      "Households",
      "Residents",
      "Structures",
      "Households Needing Support",
      "Records to Update",
      "Data Status",
    ];
    const lines = dashboard.rows.map((row) => [
      row.name,
      row.households,
      row.residents,
      row.structures,
      row.support,
      row.stale,
      row.stale === 0 ? "Records up to date" : `${row.stale} records to update`,
    ]);
    const csv = [headers, ...lines].map((line) => line.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `household-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <h1>Households &amp; Structures</h1>
            <p>
              {selectedBarangayName} &middot; {dashboard.filteredHouseholds.length.toLocaleString()} households
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href="/barangay-affairs/households/register">
              <HousePlus size={16} /> Register Household
            </Link>
            <button type="button" className={styles.btnSecondary} onClick={exportInventory}>
              <Download size={16} /> Export Report
            </button>
          </div>
        </div>
      </section>

      <main className={styles.body}>
        <section className={styles.summaryRow} aria-label="Household summary">
          <Metric
            icon={<Home size={15} />}
            label="Total Households"
            value={dashboard.filteredHouseholds.length.toLocaleString()}
            detail="Registered in the selected area"
          />
          <Metric
            icon={<UsersRound size={15} />}
            label="Household Members"
            value={dashboard.memberCount.toLocaleString()}
            detail="Active resident memberships"
          />
          <Metric
            icon={<MapPinned size={15} />}
            label="Mapped Structures"
            value={dashboard.filteredStructures.length.toLocaleString()}
            detail="Homes with recorded locations"
          />
          <Metric
            icon={<UsersRound size={15} />}
            label="Average Household Size"
            value={dashboard.averageSize.toFixed(1)}
            detail="Members per household"
          />
          <Metric
            icon={<AlertCircle size={15} />}
            label="Records Needing Update"
            value={dashboard.staleCount.toLocaleString()}
            detail="Due for household verification"
          />
        </section>

        <section className={styles.chartGrid}>
          <article className={styles.chartCard}>
            <SectionTitle
              title="Households by Barangay"
              description={
                isAllSelected ? "Twelve barangays with the most registered households" : "Selected barangay coverage"
              }
            />
            <ResponsiveContainer width="100%" height={330}>
              <BarChart
                data={dashboard.barangayChart}
                layout="vertical"
                margin={{ left: 10, right: 22, top: 4, bottom: 0 }}
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
                  width={100}
                  tick={{ fontSize: 11, fill: "#49635f" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(21, 148, 136, 0.06)" }} />
                <Bar dataKey="households" name="Households" fill="#159488" radius={[0, 5, 5, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className={styles.chartCard}>
            <SectionTitle
              title="Household Priority Overview"
              description="Records grouped by the next action barangay staff should take"
            />
            <ResponsiveContainer width="100%" height={330}>
              <PieChart>
                <Pie
                  data={dashboard.priorityData}
                  cx="50%"
                  cy="45%"
                  innerRadius={66}
                  outerRadius={102}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={0}
                >
                  {dashboard.priorityData.map((entry, index) => (
                    <Cell key={entry.name} fill={PRIORITY_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={9}
                  formatter={(value: string) => <span className={styles.legendText}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </article>

          <article className={`${styles.chartCard} ${styles.housingCard}`}>
            <SectionTitle title="Housing Conditions" description="Construction material and occupancy arrangement" />
            <div className={styles.doubleChart}>
              <Donut title="Construction material" data={dashboard.materialData} colors={MATERIAL_COLORS} />
              <Donut title="Housing arrangement" data={dashboard.tenureData} colors={TENURE_COLORS} />
            </div>
          </article>

          <article className={styles.chartCard}>
            <SectionTitle title="Access to Basic Services" description="Share of mapped structures with each service" />
            <div className={styles.serviceList}>
              {dashboard.serviceRows.map((service) => {
                const Icon = service.icon;
                return (
                  <div className={styles.serviceRow} key={service.label}>
                    <div className={styles.serviceTopline}>
                      <span>
                        <Icon size={15} /> {service.label}
                      </span>
                      <strong>{service.percentage}%</strong>
                    </div>
                    <div className={styles.progressTrack}>
                      <span style={{ width: `${service.percentage}%` }} />
                    </div>
                    <small>
                      {service.count.toLocaleString()} of {dashboard.filteredStructures.length.toLocaleString()}{" "}
                      structures
                    </small>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className={styles.operationsGrid}>
          <article className={styles.inventoryCard}>
            <div className={styles.sectionHeading}>
              <div>
                <h2>Barangay Household Inventory</h2>
                <p>Households, structures, support needs, and record status</p>
              </div>
              <Link className={styles.textButton} href="/barangay-affairs/households/masterlist">
                Open Masterlist
              </Link>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Barangay</th>
                    <th>Households</th>
                    <th>Residents</th>
                    <th>Structures</th>
                    <th>Needing Support</th>
                    <th>Records to Update</th>
                    <th>Data Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.rows.map((row) => (
                    <tr key={row.code}>
                      <td>
                        <strong>{row.name}</strong>
                      </td>
                      <td>{row.households}</td>
                      <td>{row.residents}</td>
                      <td>{row.structures}</td>
                      <td>{row.support}</td>
                      <td>{row.stale}</td>
                      <td>
                        <span className={`${styles.badge} ${row.stale === 0 ? styles.badgeGood : styles.badgeWarning}`}>
                          {row.stale === 0 ? "Records up to date" : `${row.stale} records to update`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <aside className={styles.priorityCard}>
            <SectionTitle
              title="Priority Households"
              description="Households that need staff attention"
              icon={<ShieldCheck size={18} />}
            />
            <div className={styles.priorityList}>
              {dashboard.priorityHouseholds.slice(0, 8).map((household) => {
                const head = residents.find((resident) => resident.id === household.headResidentId);
                const riskCount = householdRiskLabels(household).length;
                const needsUpdate = isHouseholdStale(household);
                return (
                  <Link key={household.id} href={`/barangay-affairs/households/${household.id}`}>
                    <span>
                      <strong>{household.householdNumber}</strong>
                      <small>{head ? formatResidentName(head) : "Household head unavailable"}</small>
                    </span>
                    <em className={needsUpdate ? styles.priorityUpdate : styles.prioritySupport}>
                      {needsUpdate
                        ? "Update household record"
                        : `${riskCount} priority ${riskCount === 1 ? "need" : "needs"}`}
                    </em>
                  </Link>
                );
              })}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className={styles.metricCard}>
      <span className={styles.metricLabel}>
        {icon}
        {label}
      </span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function SectionTitle({ title, description, icon }: { title: string; description: string; icon?: React.ReactNode }) {
  return (
    <div className={styles.sectionHeading}>
      <div>
        <h2>
          {icon}
          {title}
        </h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function Donut({
  title,
  data,
  colors,
}: {
  title: string;
  data: Array<{ name: string; value: number }>;
  colors: string[];
}) {
  return (
    <div>
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={245}>
        <PieChart>
          <Pie data={data} innerRadius={42} outerRadius={70} dataKey="value" nameKey="name" strokeWidth={0}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => <span className={styles.legendText}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
