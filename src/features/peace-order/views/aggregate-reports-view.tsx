"use client";

import { useMemo, useState } from "react";

import { BarChart3, Download, FileCheck2, MapPinned, ShieldAlert, ShieldCheck, TrendingUp } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useBadacStore } from "../stores/badac-store";
import { useBcpcStore } from "../stores/bcpc-store";
import { useJusticeStore } from "../stores/justice-store";
import { usePeaceOrderStore } from "../stores/peace-order-store";
import { useVawStore } from "../stores/vaw-store";
import type { IncidentType } from "../types/blotter";
import peaceStyles from "./peace-order.module.css";

const incidentTypes: IncidentType[] = [
  "Physical Injury",
  "Threats",
  "Property Dispute",
  "Noise Complaint",
  "Theft",
  "Public Disturbance",
  "Domestic Dispute",
  "Other",
];

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

export function AggregateReportsView() {
  const blotter = usePeaceOrderStore((state) => state.blotterRecords);
  const justice = useJusticeStore((state) => state.cases);
  const vaw = useVawStore((state) => state.cases);
  const bcpc = useBcpcStore((state) => state.cases);
  const badac = useBadacStore((state) => state.records);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [period, setPeriod] = useState("2026");

  const scopedBlotter = blotter.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const scopedJustice = justice.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const scopedVaw = vaw.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const scopedBcpc = bcpc.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const scopedBadac = badac.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const closedIncidents = scopedBlotter.filter((item) => item.status === "Closed").length;
  const completedJustice = scopedJustice.filter((item) =>
    ["Settlement", "Repudiation Period", "CFA Issued", "Closed"].includes(item.stage),
  ).length;
  const safeguardingCount = scopedVaw.length + scopedBcpc.length + scopedBadac.length;

  const barangayRows = useMemo(
    () =>
      MATNOG_BARANGAYS.map((barangay) => {
        const incidents = blotter.filter((item) => item.barangayId === barangay.code);
        const justiceCases = justice.filter((item) => item.barangayId === barangay.code);
        const closed = incidents.filter((item) => item.status === "Closed").length;
        return {
          ...barangay,
          incidents: incidents.length,
          active: incidents.filter((item) => item.status !== "Closed").length,
          highPriority: incidents.filter((item) => item.priority === "High" && item.status !== "Closed").length,
          justice: justiceCases.length,
          resolved: percent(closed, incidents.length),
          safeguarding:
            vaw.filter((item) => item.barangayId === barangay.code).length +
            bcpc.filter((item) => item.barangayId === barangay.code).length +
            badac.filter((item) => item.barangayId === barangay.code).length,
        };
      }).filter((item) => selectedBarangay === "all" || item.code === selectedBarangay),
    [badac, bcpc, blotter, justice, selectedBarangay, vaw],
  );

  const monthly = Array.from({ length: 9 }, (_, index) => ({
    label: new Date(2026, index).toLocaleString("en-PH", { month: "short" }),
    value: scopedBlotter.filter((item) => new Date(item.incidentAt).getMonth() === index).length,
  }));
  const maxMonthly = Math.max(...monthly.map((item) => item.value), 1);
  const typeCounts = incidentTypes.map((type) => ({
    type,
    value: scopedBlotter.filter((item) => item.incidentType === type).length,
  }));
  const maxType = Math.max(...typeCounts.map((item) => item.value), 1);

  const downloadCsv = () => {
    const header = [
      "Barangay",
      "Blotter incidents",
      "Active incidents",
      "High priority",
      "Justice cases",
      "Resolution rate",
      "Restricted safeguarding aggregate",
    ];
    const csv = [
      header,
      ...barangayRows.map((row) => [
        row.name,
        row.incidents,
        row.active,
        row.highPriority,
        row.justice,
        `${row.resolved}%`,
        row.safeguarding,
      ]),
    ]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `peace-order-aggregate-${selectedBarangay}-${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.page}>
      <div className={peaceStyles.aggregateBanner}>
        <ShieldCheck size={18} />
        <div>
          <strong>Aggregate-only municipal view</strong>
          <span>
            This report contains counts, categories, geography, and rates. It excludes names, identifiers, narratives,
            and restricted case bodies.
          </span>
        </div>
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A5 Municipal Aggregate Reporting</p>
          <h1>Peace & Order Reports</h1>
          <p>{selectedBarangayName} trends, outcomes, and geographic workload.</p>
        </div>
        <div className={styles.headerButtonGroup}>
          <select
            className={styles.compactSelect}
            aria-label="Reporting year"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          >
            <option>2026</option>
            <option>2025</option>
            <option>2024</option>
          </select>
          <button className={styles.primaryButton} type="button" onClick={downloadCsv}>
            <Download size={15} /> Export aggregate CSV
          </button>
        </div>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <BarChart3 size={18} />
          </span>
          <div>
            <strong>{scopedBlotter.length}</strong>
            <span>Blotter incidents</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <TrendingUp size={18} />
          </span>
          <div>
            <strong>{percent(closedIncidents, scopedBlotter.length)}%</strong>
            <span>Incident resolution</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <FileCheck2 size={18} />
          </span>
          <div>
            <strong>{percent(completedJustice, scopedJustice.length)}%</strong>
            <span>Justice completion</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ShieldAlert size={18} />
          </span>
          <div>
            <strong>{safeguardingCount}</strong>
            <span>Restricted safeguarding aggregate</span>
          </div>
        </div>
      </div>
      <div className={peaceStyles.reportGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Monthly trend</p>
              <h2>Reported incidents</h2>
            </div>
            <span className={`${styles.badge} ${styles.info}`}>{period}</span>
          </div>
          <div className={peaceStyles.barChart}>
            {monthly.map((item) => (
              <div key={item.label}>
                <div className={peaceStyles.barTrack}>
                  <span style={{ height: `${Math.max(6, (item.value / maxMonthly) * 100)}%` }} />
                </div>
                <strong>{item.value}</strong>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </section>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Incident profile</p>
              <h2>Reports by type</h2>
            </div>
          </div>
          <div className={peaceStyles.horizontalBars}>
            {typeCounts.map((item) => (
              <div key={item.type}>
                <span>{item.type}</span>
                <div>
                  <i style={{ width: `${(item.value / maxType) * 100}%` }} />
                </div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Geographic workload</p>
            <h2>Barangay comparison</h2>
          </div>
          <span className={`${styles.badge} ${styles.info}`}>{barangayRows.length} barangays</span>
        </div>
        <div className={peaceStyles.heatGrid}>
          {barangayRows.map((row) => (
            <div key={row.code} style={{ "--heat": Math.min(0.9, 0.12 + row.incidents / 12) } as React.CSSProperties}>
              <MapPinned size={14} />
              <strong>{row.name}</strong>
              <span>{row.incidents} incidents</span>
              <small>{row.resolved}% resolved</small>
            </div>
          ))}
        </div>
      </section>
      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Operational comparison</p>
            <h2>Aggregate barangay table</h2>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th>Barangay</th>
                <th>Incidents</th>
                <th>Active</th>
                <th>High priority</th>
                <th>Justice cases</th>
                <th>Resolution</th>
                <th>Restricted safeguarding aggregate</th>
              </tr>
            </thead>
            <tbody>
              {barangayRows.map((row) => (
                <tr key={row.code}>
                  <td>
                    <strong>{row.name}</strong>
                  </td>
                  <td>{row.incidents}</td>
                  <td>{row.active}</td>
                  <td>{row.highPriority}</td>
                  <td>{row.justice}</td>
                  <td>
                    <span className={`${styles.badge} ${row.resolved >= 50 ? styles.active : styles.warning}`}>
                      {row.resolved}%
                    </span>
                  </td>
                  <td>{row.safeguarding}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
