"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CloudOff,
  Search,
  UploadCloud,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useHouseholdRegistryStore } from "../stores/household-registry-store";
import { useHouseholdSurveyStore } from "../stores/household-survey-store";
import type { SurveyStatus, SurveySyncStatus } from "../types/survey";

const PAGE_SIZE = 25;
function surveyClass(status: SurveyStatus) {
  return status === "Verified"
    ? styles.active
    : status === "Returned"
      ? styles.danger
      : status === "Submitted" || status === "Needs Review"
        ? styles.warning
        : status === "In Progress"
          ? styles.info
          : "";
}
function syncClass(status: SurveySyncStatus) {
  return status === "Synced"
    ? styles.active
    : status === "Conflict" || status === "Failed"
      ? styles.danger
      : styles.warning;
}

export function HouseholdSurveyQueueView() {
  const surveys = useHouseholdSurveyStore((state) => state.surveys);
  const households = useHouseholdRegistryStore((state) => state.households);
  const residents = useResidentRegistryStore((state) => state.residents);
  const enumerators = useHouseholdSurveyStore((state) => state.enumerators);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sync, setSync] = useState("");
  const [page, setPage] = useState(1);
  const rows = useMemo(
    () =>
      surveys.filter((survey) => {
        if (selectedBarangay !== "all" && survey.barangayId !== selectedBarangay) return false;
        if (status && survey.status !== status) return false;
        if (sync && survey.syncStatus !== sync) return false;
        const household = households.find((item) => item.id === survey.householdId);
        const head = household ? residents.find((resident) => resident.id === household.headResidentId) : undefined;
        const enumerator = enumerators.find((item) => item.id === survey.enumeratorId);
        return (
          !search.trim() ||
          `${survey.referenceNumber} ${household?.householdNumber ?? ""} ${head ? formatResidentName(head) : ""} ${enumerator?.name ?? ""}`
            .toLowerCase()
            .includes(search.trim().toLowerCase())
        );
      }),
    [enumerators, households, residents, search, selectedBarangay, status, surveys, sync],
  );
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const update = (callback: () => void) => {
    callback();
    setPage(1);
  };
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A2 Household Surveys</p>
          <h1>Survey Fieldwork</h1>
          <p>Track offline capture, submission, validation, synchronization, and verification.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/households/enumerators">
          <ClipboardList size={15} /> Enumerator assignments
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ClipboardList size={18} />
          </span>
          <div>
            <strong>{surveys.length}</strong>
            <span>Household surveys</span>
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
            <UploadCloud size={18} />
          </span>
          <div>
            <strong>{surveys.filter((item) => item.syncStatus === "Pending Upload").length}</strong>
            <span>Pending upload</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <AlertTriangle size={18} />
          </span>
          <div>
            <strong>
              {surveys.filter((item) => item.syncStatus === "Conflict" || item.syncStatus === "Failed").length}
            </strong>
            <span>Sync attention</span>
          </div>
        </div>
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search household surveys"
              value={search}
              onChange={(event) => update(() => setSearch(event.target.value))}
              placeholder="Search survey, household, head, or enumerator"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="Survey status"
            value={status}
            onChange={(event) => update(() => setStatus(event.target.value))}
          >
            <option value="">All survey statuses</option>
            {["Not Started", "In Progress", "Submitted", "Needs Review", "Verified", "Returned"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <select
            className={styles.compactSelect}
            aria-label="Sync status"
            value={sync}
            onChange={(event) => update(() => setSync(event.target.value))}
          >
            <option value="">All sync statuses</option>
            {["Synced", "Pending Upload", "Conflict", "Failed"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} survey records</strong>
          <span>
            Showing {rows.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, rows.length)}
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1200 }}>
            <thead>
              <tr>
                <th>Survey No.</th>
                <th>Household</th>
                <th>Household Head</th>
                <th>Barangay</th>
                <th>Enumerator</th>
                <th>Completion</th>
                <th>Survey Status</th>
                <th>Sync Status</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((survey) => {
                const household = households.find((item) => item.id === survey.householdId);
                const head = household
                  ? residents.find((resident) => resident.id === household.headResidentId)
                  : undefined;
                const enumerator = enumerators.find((item) => item.id === survey.enumeratorId);
                return (
                  <tr key={survey.id}>
                    <td className={styles.mono}>{survey.referenceNumber}</td>
                    <td className={styles.mono}>{household?.householdNumber}</td>
                    <td>{head ? formatResidentName(head) : "—"}</td>
                    <td>{MATNOG_BARANGAYS.find((barangay) => barangay.code === survey.barangayId)?.name}</td>
                    <td>{enumerator?.name}</td>
                    <td>
                      <div className={styles.progressCell}>
                        <span>
                          <i style={{ width: `${survey.completionPercent}%` }} />
                        </span>
                        <strong>{survey.completionPercent}%</strong>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${surveyClass(survey.status)}`}>{survey.status}</span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${syncClass(survey.syncStatus)}`}>
                        {survey.syncStatus === "Pending Upload" ? <CloudOff size={11} /> : null}
                        {survey.syncStatus}
                      </span>
                    </td>
                    <td>{new Date(survey.updatedAt).toLocaleDateString("en-PH")}</td>
                    <td>
                      <Link
                        className={styles.secondaryButton}
                        href={`/barangay-affairs/households/surveys/${survey.id}`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.pagination}>
          <span>
            Page {page} of {pages}
          </span>
          <button
            type="button"
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => setPage((value) => value - 1)}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            aria-label="Next page"
            disabled={page === pages}
            onClick={() => setPage((value) => value + 1)}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}
