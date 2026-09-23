"use client";

import { useState } from "react";

import { Search, Tablet, UserCheck, WifiOff } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";

import { useHouseholdSurveyStore } from "../stores/household-survey-store";

export function EnumeratorAssignmentsView() {
  const enumerators = useHouseholdSurveyStore((state) => state.enumerators);
  const surveys = useHouseholdSurveyStore((state) => state.surveys);
  const [search, setSearch] = useState("");
  const rows = enumerators.filter(
    (item) =>
      !search.trim() ||
      `${item.name} ${item.staffNumber} ${item.deviceId}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A2 Survey Operations</p>
          <h1>Enumerator Assignments</h1>
          <p>Monitor barangay coverage, assigned devices, workload, and synchronization activity.</p>
        </div>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <UserCheck size={18} />
          </span>
          <div>
            <strong>{enumerators.length}</strong>
            <span>Enumerators</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Tablet size={18} />
          </span>
          <div>
            <strong>{enumerators.filter((item) => item.status === "Active").length}</strong>
            <span>Active field staff</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <WifiOff size={18} />
          </span>
          <div>
            <strong>{enumerators.filter((item) => item.status === "Offline").length}</strong>
            <span>Currently offline</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Tablet size={18} />
          </span>
          <div>
            <strong>{surveys.filter((item) => item.status === "Verified").length}</strong>
            <span>Verified surveys</span>
          </div>
        </div>
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search enumerators"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search enumerator, staff number, or device"
            />
          </label>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th>Staff No.</th>
                <th>Enumerator</th>
                <th>Barangay Assignments</th>
                <th>Device</th>
                <th>Assigned</th>
                <th>Completed</th>
                <th>Pending Sync</th>
                <th>Last Sync</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((enumerator) => {
                const assigned = surveys.filter((survey) => survey.enumeratorId === enumerator.id);
                const completed = assigned.filter((survey) => survey.status === "Verified").length;
                const pending = assigned.filter((survey) => survey.syncStatus !== "Synced").length;
                return (
                  <tr key={enumerator.id}>
                    <td className={styles.mono}>{enumerator.staffNumber}</td>
                    <td>
                      <strong>{enumerator.name}</strong>
                    </td>
                    <td>
                      <div className={styles.signals}>
                        {enumerator.assignedBarangayIds.map((id) => (
                          <span className={styles.signal} key={id}>
                            {MATNOG_BARANGAYS.find((item) => item.code === id)?.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={styles.mono}>{enumerator.deviceId}</td>
                    <td>{assigned.length}</td>
                    <td>{completed}</td>
                    <td>{pending}</td>
                    <td>{new Date(enumerator.lastSyncAt).toLocaleString("en-PH")}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${enumerator.status === "Active" ? styles.active : enumerator.status === "Offline" ? styles.warning : styles.danger}`}
                      >
                        {enumerator.status}
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
