"use client";

import { BarChart3, CheckCircle2, Clock3, UploadCloud } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useHouseholdSurveyStore } from "../stores/household-survey-store";

export function SurveyProgressView() {
  const surveys = useHouseholdSurveyStore((state) => state.surveys);
  const { selectedBarangay } = useBarangayScope();
  const scoped = surveys.filter((survey) => selectedBarangay === "all" || survey.barangayId === selectedBarangay);
  const verified = scoped.filter((survey) => survey.status === "Verified").length;
  const completed = scoped.filter((survey) =>
    ["Submitted", "Needs Review", "Verified", "Returned"].includes(survey.status),
  ).length;
  const synced = scoped.filter((survey) => survey.syncStatus === "Synced").length;
  const rows = MATNOG_BARANGAYS.map((barangay) => {
    const items = surveys.filter((survey) => survey.barangayId === barangay.code);
    const done = items.filter((survey) => survey.status === "Verified").length;
    const submitted = items.filter((survey) =>
      ["Submitted", "Needs Review", "Verified", "Returned"].includes(survey.status),
    ).length;
    const attention = items.filter(
      (survey) => survey.syncStatus === "Conflict" || survey.syncStatus === "Failed",
    ).length;
    return {
      ...barangay,
      total: items.length,
      done,
      submitted,
      attention,
      rate: Math.round((done / Math.max(1, items.length)) * 100),
    };
  }).filter((row) => selectedBarangay === "all" || row.code === selectedBarangay);
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A2 Survey Operations</p>
          <h1>Barangay Survey Progress</h1>
          <p>Roll up capture, submission, synchronization, and verification across all 40 barangays.</p>
        </div>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <BarChart3 size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>Total assigned</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Clock3 size={18} />
          </span>
          <div>
            <strong>{completed}</strong>
            <span>Submitted captures</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <UploadCloud size={18} />
          </span>
          <div>
            <strong>{synced}</strong>
            <span>Synced to server</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CheckCircle2 size={18} />
          </span>
          <div>
            <strong>{verified}</strong>
            <span>Verified surveys</span>
          </div>
        </div>
      </div>
      <section className={styles.card}>
        <div className={styles.resultsMeta}>
          <strong>Municipal progress by barangay</strong>
          <span>{Math.round((verified / Math.max(1, scoped.length)) * 100)}% overall verification</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>Barangay</th>
                <th>Assigned</th>
                <th>Submitted</th>
                <th>Verified</th>
                <th>Sync Attention</th>
                <th>Verification Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.code}>
                  <td>
                    <strong>{row.name}</strong>
                  </td>
                  <td>{row.total}</td>
                  <td>{row.submitted}</td>
                  <td>{row.done}</td>
                  <td>{row.attention}</td>
                  <td>
                    <div className={styles.rollupProgress}>
                      <span>
                        <i style={{ width: `${row.rate}%` }} />
                      </span>
                      <strong>{row.rate}%</strong>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${row.rate >= 75 ? styles.active : row.rate >= 40 ? styles.warning : styles.danger}`}
                    >
                      {row.rate >= 75 ? "On track" : row.rate >= 40 ? "Monitor" : "Needs action"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
