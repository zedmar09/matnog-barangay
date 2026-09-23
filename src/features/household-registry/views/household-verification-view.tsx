"use client";

import { useState } from "react";

import Link from "next/link";

import { CheckCircle2, RotateCcw, Search, ShieldCheck } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useHouseholdRegistryStore } from "../stores/household-registry-store";
import { useHouseholdSurveyStore } from "../stores/household-survey-store";

export function HouseholdVerificationView() {
  const surveys = useHouseholdSurveyStore((state) => state.surveys);
  const update = useHouseholdSurveyStore((state) => state.updateSurveyStatus);
  const households = useHouseholdRegistryStore((state) => state.households);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const rows = surveys
    .filter(
      (survey) =>
        ["Submitted", "Needs Review"].includes(survey.status) &&
        survey.syncStatus === "Synced" &&
        (selectedBarangay === "all" || survey.barangayId === selectedBarangay),
    )
    .filter((survey) => {
      const household = households.find((item) => item.id === survey.householdId);
      const head = household ? residents.find((item) => item.id === household.headResidentId) : undefined;
      return (
        !search.trim() ||
        `${survey.referenceNumber} ${household?.householdNumber ?? ""} ${head ? formatResidentName(head) : ""}`
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      );
    });
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A2 Survey Verification</p>
          <h1>Household Verification Queue</h1>
          <p>Review synchronized surveys before updating the municipal household inventory.</p>
        </div>
      </header>
      {message ? <div className={styles.toast}>{message}</div> : null}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ShieldCheck size={18} />
          </span>
          <div>
            <strong>{rows.length}</strong>
            <span>Ready for verification</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CheckCircle2 size={18} />
          </span>
          <div>
            <strong>{surveys.filter((item) => item.status === "Verified").length}</strong>
            <span>Verified</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <RotateCcw size={18} />
          </span>
          <div>
            <strong>{surveys.filter((item) => item.status === "Returned").length}</strong>
            <span>Returned</span>
          </div>
        </div>
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search verification queue"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search survey, household, or household head"
            />
          </label>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1050 }}>
            <thead>
              <tr>
                <th>Survey</th>
                <th>Household</th>
                <th>Household Head</th>
                <th>Barangay</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Validation Note</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((survey) => {
                const household = households.find((item) => item.id === survey.householdId);
                const head = household ? residents.find((item) => item.id === household.headResidentId) : undefined;
                return (
                  <tr key={survey.id}>
                    <td className={styles.mono}>{survey.referenceNumber}</td>
                    <td className={styles.mono}>{household?.householdNumber}</td>
                    <td>{head ? formatResidentName(head) : "—"}</td>
                    <td>{MATNOG_BARANGAYS.find((item) => item.code === survey.barangayId)?.name}</td>
                    <td>
                      <span className={`${styles.badge} ${styles.warning}`}>{survey.status}</span>
                    </td>
                    <td>{new Date(survey.submittedAt).toLocaleString("en-PH")}</td>
                    <td>{survey.reviewNote || "Automated checks passed"}</td>
                    <td>
                      <div className={styles.conflictActions}>
                        <Link href={`/barangay-affairs/households/surveys/${survey.id}`}>Review</Link>
                        <button
                          type="button"
                          onClick={() => {
                            if (update(survey.id, "Verified", "Verified against household and resident records."))
                              setMessage(`${survey.referenceNumber} verified successfully.`);
                          }}
                        >
                          Verify
                        </button>
                      </div>
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
