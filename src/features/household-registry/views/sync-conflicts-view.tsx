"use client";

import { useState } from "react";

import Link from "next/link";

import { AlertTriangle, CheckCircle2, CloudOff, MonitorSmartphone } from "lucide-react";

import styles from "@/features/resident-registry/components/resident-registry.module.css";

import { useHouseholdRegistryStore } from "../stores/household-registry-store";
import { useHouseholdSurveyStore } from "../stores/household-survey-store";

export function SyncConflictsView() {
  const conflicts = useHouseholdSurveyStore((state) => state.conflicts);
  const surveys = useHouseholdSurveyStore((state) => state.surveys);
  const households = useHouseholdRegistryStore((state) => state.households);
  const resolve = useHouseholdSurveyStore((state) => state.resolveConflict);
  const [filter, setFilter] = useState("Open");
  const [message, setMessage] = useState("");
  const rows = conflicts.filter((conflict) => !filter || conflict.status === filter);
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A2 Offline Synchronization</p>
          <h1>Sync & Conflicts</h1>
          <p>Compare device and server values before accepting field changes.</p>
        </div>
      </header>
      {message ? <div className={styles.toast}>{message}</div> : null}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <AlertTriangle size={18} />
          </span>
          <div>
            <strong>{conflicts.filter((item) => item.status === "Open").length}</strong>
            <span>Open conflicts</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CheckCircle2 size={18} />
          </span>
          <div>
            <strong>{conflicts.filter((item) => item.status === "Resolved").length}</strong>
            <span>Resolved conflicts</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CloudOff size={18} />
          </span>
          <div>
            <strong>{surveys.filter((item) => item.syncStatus === "Pending Upload").length}</strong>
            <span>Pending uploads</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <MonitorSmartphone size={18} />
          </span>
          <div>
            <strong>{surveys.filter((item) => item.syncStatus === "Failed").length}</strong>
            <span>Failed sync attempts</span>
          </div>
        </div>
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <select
            className={styles.compactSelect}
            aria-label="Conflict status"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="">All conflicts</option>
            <option>Open</option>
            <option>Resolved</option>
          </select>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th>Conflict</th>
                <th>Survey</th>
                <th>Household</th>
                <th>Field</th>
                <th>Device Value</th>
                <th>Server Value</th>
                <th>Detected</th>
                <th>Status</th>
                <th>Resolution</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((conflict) => {
                const survey = surveys.find((item) => item.id === conflict.surveyId);
                const household = households.find((item) => item.id === conflict.householdId);
                return (
                  <tr key={conflict.id}>
                    <td className={styles.mono}>{conflict.id.toUpperCase()}</td>
                    <td>
                      <Link href={`/barangay-affairs/households/surveys/${survey?.id}`} className={styles.mono}>
                        {survey?.referenceNumber}
                      </Link>
                    </td>
                    <td className={styles.mono}>{household?.householdNumber}</td>
                    <td>
                      <strong>{conflict.fieldName}</strong>
                    </td>
                    <td>
                      <span className={styles.deviceValue}>{conflict.localValue}</span>
                    </td>
                    <td>
                      <span className={styles.serverValue}>{conflict.serverValue}</span>
                    </td>
                    <td>{new Date(conflict.detectedAt).toLocaleString("en-PH")}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${conflict.status === "Resolved" ? styles.active : styles.danger}`}
                      >
                        {conflict.status}
                      </span>
                    </td>
                    <td>
                      {conflict.status === "Open" ? (
                        <div className={styles.conflictActions}>
                          <button
                            type="button"
                            onClick={() => {
                              if (resolve(conflict.id, "Keep Device"))
                                setMessage("Conflict resolved using the device value.");
                            }}
                          >
                            Keep device
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (resolve(conflict.id, "Keep Server"))
                                setMessage("Conflict resolved using the server value.");
                            }}
                          >
                            Keep server
                          </button>
                        </div>
                      ) : (
                        `${conflict.resolution} · ${conflict.resolvedBy}`
                      )}
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
