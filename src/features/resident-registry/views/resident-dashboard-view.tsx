"use client";

import { useMemo } from "react";

import { CalendarDays, Download, Heart, TrendingUp, UserCheck, UserPlus, Users } from "lucide-react";
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
  Treemap,
  XAxis,
  YAxis,
} from "recharts";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useResidentRegistryStore } from "../stores/resident-registry-store";
import { calculateAge } from "../utils/resident-utils";
import styles from "./resident-dashboard.module.css";

const GENDER_COLORS = ["#4a90d9", "#e87590"];
const CIVIL_COLORS = ["#6366f1", "#f97316", "#22c55e", "#ef4444", "#f59e0b", "#0ea5e9"];
const STATUS_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#94a3b8", "#cbd5e1"];
const TREEMAP_COLORS = [
  "#0d7a70", "#159488", "#1ea898", "#2aab9e", "#38b5a6",
  "#47bfae", "#5ac9b8", "#6dd3c2", "#82dccc", "#97e4d5",
];

const AGE_COLOR = "#6366f1";
const REG_COLOR = "#6366f1";

const AGE_BRACKETS = [
  { label: "0–17", min: 0, max: 17 },
  { label: "18–30", min: 18, max: 30 },
  { label: "31–45", min: 31, max: 45 },
  { label: "46–59", min: 46, max: 59 },
  { label: "60+", min: 60, max: 200 },
] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e2ebe9", borderRadius: 8, padding: "10px 14px", fontSize: 12, boxShadow: "0 4px 16px rgb(23 61 58 / 10%)" }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: "#1a3331" }}>{label}</div>
      {payload.map((entry) => (
        <div key={entry.name} style={{ color: "#5f7a77", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, flexShrink: 0 }} />
          {entry.name}: <strong style={{ color: "#1a3331" }}>{entry.value.toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string; percent: number } }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div style={{ background: "#fff", border: "1px solid #e2ebe9", borderRadius: 8, padding: "10px 14px", fontSize: 12, boxShadow: "0 4px 16px rgb(23 61 58 / 10%)" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.payload.fill, flexShrink: 0 }} />
        <strong style={{ color: "#1a3331" }}>{item.name}</strong>
      </div>
      <div style={{ color: "#5f7a77", marginTop: 2 }}>
        {item.value.toLocaleString()} ({(item.payload.percent * 100).toFixed(1)}%)
      </div>
    </div>
  );
}

function TreemapCell({ x, y, width, height, name, value, index }: { x: number; y: number; width: number; height: number; name: string; value: number; index: number }) {
  if (width < 4 || height < 4) return null;
  const fill = TREEMAP_COLORS[index % TREEMAP_COLORS.length];
  const showLabel = width > 45 && height > 28;
  const showValue = width > 45 && height > 44;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={4} fill={fill} stroke="#fff" strokeWidth={2} />
      {showLabel && (
        <text x={x + width / 2} y={y + height / 2 - (showValue ? 7 : 0)} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={width < 70 ? 10 : 12} fontWeight={600}>
          {name.length > Math.floor(width / 7) ? `${name.slice(0, Math.floor(width / 7) - 1)}…` : name}
        </text>
      )}
      {showValue && (
        <text x={x + width / 2} y={y + height / 2 + 11} textAnchor="middle" dominantBaseline="central" fill="rgb(255 255 255 / 80%)" fontSize={10}>
          {value.toLocaleString()}
        </text>
      )}
    </g>
  );
}

function TreemapTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; size: number } }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div style={{ background: "#fff", border: "1px solid #e2ebe9", borderRadius: 8, padding: "10px 14px", fontSize: 12, boxShadow: "0 4px 16px rgb(23 61 58 / 10%)" }}>
      <div style={{ fontWeight: 600, color: "#1a3331" }}>{item.name}</div>
      <div style={{ color: "#5f7a77", marginTop: 2 }}>{item.size.toLocaleString()} residents</div>
    </div>
  );
}

export function ResidentDashboardView() {
  const residents = useResidentRegistryStore((s) => s.residents);
  const { selectedBarangayName, isAllSelected, selectedBarangays } = useBarangayScope();

  const filtered = useMemo(() => {
    if (isAllSelected) return residents;
    const set = new Set(selectedBarangays);
    return residents.filter((r) => set.has(r.address.barangayId));
  }, [residents, isAllSelected, selectedBarangays]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const male = filtered.filter((r) => r.gender === "Male").length;
    const female = filtered.filter((r) => r.gender === "Female").length;
    const active = filtered.filter((r) => r.residentStatus === "Active").length;
    const seniors = filtered.filter((r) => calculateAge(r.birthDate) >= 60).length;
    const pwd = filtered.filter((r) => r.isPwd).length;

    const ages = filtered.map((r) => calculateAge(r.birthDate));
    const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

    const now = new Date();
    const thisMonth = filtered.filter((r) => {
      const d = new Date(r.registrationDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const genderData = [
      { name: "Male", value: male },
      { name: "Female", value: female },
    ];

    const civilMap = new Map<string, number>();
    for (const r of filtered) {
      civilMap.set(r.civilStatus, (civilMap.get(r.civilStatus) ?? 0) + 1);
    }
    const civilData = Array.from(civilMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const statusMap = new Map<string, number>();
    for (const r of filtered) {
      statusMap.set(r.residentStatus, (statusMap.get(r.residentStatus) ?? 0) + 1);
    }
    const statusData = Array.from(statusMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const ageData = AGE_BRACKETS.map(({ label, min, max }) => ({
      bracket: label,
      count: ages.filter((a) => a >= min && a <= max).length,
    }));

    const regMap = new Map<string, number>();
    for (const r of filtered) {
      const d = new Date(r.registrationDate);
      if (!Number.isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        regMap.set(key, (regMap.get(key) ?? 0) + 1);
      }
    }
    const regEntries = Array.from(regMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const recentReg = regEntries.slice(-12).map(([key, count]) => {
      const [y, m] = key.split("-");
      return { month: `${MONTHS[Number(m) - 1]} ${y.slice(2)}`, count };
    });

    const barangayMap = new Map<string, { total: number; male: number; female: number; senior: number; pwd: number; avgAge: number; ages: number[] }>();
    for (const brgy of MATNOG_BARANGAYS) {
      barangayMap.set(brgy.code, { total: 0, male: 0, female: 0, senior: 0, pwd: 0, avgAge: 0, ages: [] });
    }
    for (const r of filtered) {
      const entry = barangayMap.get(r.address.barangayId);
      if (!entry) continue;
      const age = calculateAge(r.birthDate);
      entry.total += 1;
      entry.ages.push(age);
      if (r.gender === "Male") entry.male += 1;
      else entry.female += 1;
      if (age >= 60) entry.senior += 1;
      if (r.isPwd) entry.pwd += 1;
    }
    for (const entry of barangayMap.values()) {
      entry.avgAge = entry.ages.length ? Math.round(entry.ages.reduce((a, b) => a + b, 0) / entry.ages.length) : 0;
    }

    const barangayBreakdown = MATNOG_BARANGAYS.map((brgy) => {
      const entry = barangayMap.get(brgy.code)!;
      return { code: brgy.code, name: brgy.name, ...entry };
    })
      .filter((b) => b.total > 0)
      .sort((a, b) => b.total - a.total);

    const maxBarangayPop = Math.max(...barangayBreakdown.map((b) => b.total), 1);

    const treemapData = barangayBreakdown.map((b) => ({
      name: b.name,
      size: b.total,
    }));

    return {
      total,
      male,
      female,
      active,
      seniors,
      pwd,
      avgAge,
      thisMonth,
      genderData,
      civilData,
      statusData,
      ageData,
      recentReg,
      barangayBreakdown,
      maxBarangayPop,
      treemapData,
    };
  }, [filtered]);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <h1>Residents Dashboard</h1>
            <p>{selectedBarangayName} &middot; {stats.total.toLocaleString()} residents</p>
          </div>
          <div className={styles.heroActions}>
            <button type="button" className={styles.btnPrimary}><UserPlus size={16} /> Register Resident</button>
            <button type="button" className={styles.btnSecondary}><Download size={16} /> Export Report</button>
          </div>
        </div>
      </section>

      <div className={styles.body}>
      {/* Summary cards */}
      <div className={styles.summaryRow}>
        <div className={styles.card}>
          <div className={styles.cardLabel}><Users size={15} /> Total Residents</div>
          <div className={styles.cardValue}>{stats.total.toLocaleString()}</div>
          <div className={styles.cardSub}>{stats.active.toLocaleString()} active</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}><Heart size={15} /> Male / Female</div>
          <div className={styles.cardValue}>{stats.male.toLocaleString()} / {stats.female.toLocaleString()}</div>
          <div className={styles.cardSub}>{stats.total ? ((stats.male / stats.total) * 100).toFixed(1) : 0}% male</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}><CalendarDays size={15} /> Average Age</div>
          <div className={styles.cardValue}>{stats.avgAge}</div>
          <div className={styles.cardSub}>{stats.seniors.toLocaleString()} senior citizens</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}><UserCheck size={15} /> PWD</div>
          <div className={styles.cardValue}>{stats.pwd.toLocaleString()}</div>
          <div className={styles.cardSub}>{stats.total ? ((stats.pwd / stats.total) * 100).toFixed(1) : 0}% of population</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}><TrendingUp size={15} /> New This Month</div>
          <div className={styles.cardValue}>{stats.thisMonth.toLocaleString()}</div>
          <div className={styles.cardSub}>Registered this month</div>
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartGrid}>
        {/* Population by Barangay — full width */}
        <div className={`${styles.chartCard} ${styles.chartCardFull}`}>
          <h3 className={styles.chartTitle}>Population by Barangay</h3>
          <p className={styles.chartSubtitle}>All {stats.treemapData.length} barangays &middot; area proportional to population</p>
          <ResponsiveContainer width="100%" height={360}>
            <Treemap data={stats.treemapData} dataKey="size" nameKey="name" content={<TreemapCell x={0} y={0} width={0} height={0} name="" value={0} index={0} />} isAnimationActive={false}>
              <Tooltip content={<TreemapTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>

        {/* Registration Trend */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Registration Trend</h3>
          <p className={styles.chartSubtitle}>Monthly registrations over time</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.recentReg} margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#edf2f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#5f7a77" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8fa09d" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgb(99 102 241 / 6%)" }} />
              <Bar dataKey="count" name="Registrations" fill={REG_COLOR} radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Age Distribution */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Age Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.ageData} margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#edf2f0" vertical={false} />
              <XAxis dataKey="bracket" tick={{ fontSize: 11, fill: "#5f7a77" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8fa09d" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgb(99 102 241 / 6%)" }} />
              <Bar dataKey="count" name="Residents" fill={AGE_COLOR} radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender, Civil Status, Resident Status — 3-column row */}
        <div className={styles.chartRow3}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Gender Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats.genderData} cx="50%" cy="45%" innerRadius={45} outerRadius={78} paddingAngle={3} dataKey="value" nameKey="name" strokeWidth={0}>
                  {stats.genderData.map((_, i) => (
                    <Cell key={stats.genderData[i].name} fill={GENDER_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend iconType="circle" iconSize={10} formatter={(value: string) => <span style={{ color: "#5f7a77", fontSize: 12 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Civil Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats.civilData} cx="50%" cy="45%" innerRadius={45} outerRadius={78} paddingAngle={2} dataKey="value" nameKey="name" strokeWidth={0}>
                  {stats.civilData.map((_, i) => (
                    <Cell key={stats.civilData[i].name} fill={CIVIL_COLORS[i % CIVIL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend iconType="circle" iconSize={10} formatter={(value: string) => <span style={{ color: "#5f7a77", fontSize: 12 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Resident Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats.statusData} cx="50%" cy="45%" innerRadius={45} outerRadius={78} paddingAngle={2} dataKey="value" nameKey="name" strokeWidth={0}>
                  {stats.statusData.map((_, i) => (
                    <Cell key={stats.statusData[i].name} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend iconType="circle" iconSize={10} formatter={(value: string) => <span style={{ color: "#5f7a77", fontSize: 12 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Barangay Breakdown Table */}
        <div className={styles.breakdownCard}>
          <h3 className={styles.chartTitle}>Barangay Breakdown</h3>
          <p className={styles.chartSubtitle}>Detailed population statistics per barangay</p>
          <div style={{ overflowX: "auto" }}>
            <table className={styles.breakdownTable}>
              <thead>
                <tr>
                  <th>Barangay</th>
                  <th>Total</th>
                  <th>Male</th>
                  <th>Female</th>
                  <th>Avg Age</th>
                  <th>Seniors</th>
                  <th>PWD</th>
                </tr>
              </thead>
              <tbody>
                {stats.barangayBreakdown.map((b) => (
                  <tr key={b.code}>
                    <td>
                      <span
                        className={styles.miniBar}
                        style={{ width: `${Math.max((b.total / stats.maxBarangayPop) * 60, 4)}px` }}
                      />
                      <span className={styles.barangayName}>{b.name}</span>
                    </td>
                    <td>{b.total}</td>
                    <td>{b.male}</td>
                    <td>{b.female}</td>
                    <td>{b.avgAge}</td>
                    <td>{b.senior}</td>
                    <td>{b.pwd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
