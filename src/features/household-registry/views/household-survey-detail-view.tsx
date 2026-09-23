"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowLeft, CheckCircle2, CloudOff, RefreshCw, RotateCcw, Send, ShieldCheck, Tablet } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";

import { useHouseholdRegistryStore } from "../stores/household-registry-store";
import { useHouseholdSurveyStore } from "../stores/household-survey-store";
import type { SurveyStatus } from "../types/survey";
import { formatStructureAddress, householdRiskLabels } from "../utils/household-utils";

export function HouseholdSurveyDetailView({ id }: { id: string }) {
  const survey = useHouseholdSurveyStore((state) => state.surveys.find((item) => item.id === id));
  const enumerators = useHouseholdSurveyStore((state) => state.enumerators);
  const updateStatus = useHouseholdSurveyStore((state) => state.updateSurveyStatus);
  const syncSurvey = useHouseholdSurveyStore((state) => state.syncSurvey);
  const household = useHouseholdRegistryStore((state) =>
    survey ? state.households.find((item) => item.id === survey.householdId) : undefined,
  );
  const structures = useHouseholdRegistryStore((state) => state.structures);
  const residents = useResidentRegistryStore((state) => state.residents);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  if (!survey || !household)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <Tablet size={34} />
          <h1>Survey not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/households/surveys">
            Return to surveys
          </Link>
        </div>
      </div>
    );
  const structure = structures.find((item) => item.id === household.structureId);
  const head = residents.find((item) => item.id === household.headResidentId);
  const enumerator = enumerators.find((item) => item.id === survey.enumeratorId);
  const mutate = (status: SurveyStatus) => {
    const result = updateStatus(survey.id, status, note);
    if (result) {
      setMessage(`Survey status changed to ${status}.`);
      setNote("");
    }
  };
  const sections = [
    { label: "Household identity", complete: 100 },
    { label: "Members and relationships", complete: survey.completionPercent >= 35 ? 100 : survey.completionPercent },
    {
      label: "Dwelling and utilities",
      complete: survey.completionPercent >= 60 ? 100 : Math.max(0, survey.completionPercent - 20),
    },
    {
      label: "Socio-economic profile",
      complete: survey.completionPercent >= 85 ? 100 : Math.max(0, survey.completionPercent - 45),
    },
    {
      label: "Vulnerability and review",
      complete: survey.completionPercent === 100 ? 100 : Math.max(0, survey.completionPercent - 70),
    },
  ];
  return (
    <div className={styles.page}>
      {message ? <div className={styles.toast}>{message}</div> : null}
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A2 Household Survey</p>
          <h1>{survey.referenceNumber}</h1>
          <p>
            {household.householdNumber} · {head ? formatResidentName(head) : "Unknown head"}
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/households/surveys">
          <ArrowLeft size={15} /> Survey queue
        </Link>
      </header>
      {survey.syncStatus !== "Synced" ? (
        <div
          className={`${styles.offlineBanner} ${survey.syncStatus === "Conflict" || survey.syncStatus === "Failed" ? styles.offlineDanger : ""}`}
        >
          <CloudOff size={18} />
          <div>
            <strong>{survey.syncStatus}</strong>
            <span>
              {survey.syncStatus === "Conflict"
                ? "Device and server changes must be resolved before verification."
                : "The survey is safely stored on the assigned device and awaits synchronization."}
            </span>
          </div>
          {survey.syncStatus !== "Conflict" ? (
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => {
                if (syncSurvey(survey.id)) setMessage("Offline survey synchronized successfully.");
              }}
            >
              <RefreshCw size={14} /> Sync now
            </button>
          ) : (
            <Link className={styles.secondaryButton} href="/barangay-affairs/households/sync-conflicts">
              Resolve conflict
            </Link>
          )}
        </div>
      ) : null}
      <div className={styles.surveyDetailGrid}>
        <section className={styles.card}>
          <div className={styles.formBody}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Capture progress</p>
                <h2>{survey.completionPercent}% complete</h2>
              </div>
              <span
                className={`${styles.badge} ${survey.status === "Verified" ? styles.active : survey.status === "Returned" ? styles.danger : styles.warning}`}
              >
                {survey.status}
              </span>
            </div>
            <div className={styles.surveySections}>
              {sections.map((section) => (
                <div key={section.label}>
                  <span className={section.complete === 100 ? styles.sectionComplete : ""}>
                    {section.complete === 100 ? <CheckCircle2 size={14} /> : <i />}
                  </span>
                  <div>
                    <strong>{section.label}</strong>
                    <small>{section.complete}% complete</small>
                  </div>
                  <div className={styles.progressTrack}>
                    <i style={{ width: `${section.complete}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <aside className={styles.card}>
          <div className={styles.householdSidePanel}>
            <h2>
              <Tablet size={16} /> Field assignment
            </h2>
            <dl className={styles.accessFacts}>
              <div>
                <dt>Enumerator</dt>
                <dd>{enumerator?.name}</dd>
              </div>
              <div>
                <dt>Device</dt>
                <dd>{survey.deviceId}</dd>
              </div>
              <div>
                <dt>Form version</dt>
                <dd>{survey.formVersion}</dd>
              </div>
              <div>
                <dt>Barangay</dt>
                <dd>{MATNOG_BARANGAYS.find((item) => item.code === survey.barangayId)?.name}</dd>
              </div>
              <div>
                <dt>Last update</dt>
                <dd>{new Date(survey.updatedAt).toLocaleString("en-PH")}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
      <div className={styles.profileGrid}>
        <section className={styles.detailCard}>
          <h3>Household snapshot</h3>
          <dl className={styles.dataList}>
            {[
              ["Household head", head ? formatResidentName(head) : "—"],
              ["Members", household.members.length],
              ["Address", structure ? formatStructureAddress(structure) : "—"],
              ["Income bracket", household.monthlyIncomeBracket],
              ["Livelihood", household.primaryLivelihood],
              ["Food security", household.foodSecurity],
            ].map(([label, value]) => (
              <div className={styles.dataRow} key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <Link className={styles.secondaryButton} href={`/barangay-affairs/households/${household.id}`}>
            Open household record
          </Link>
        </section>
        <section className={styles.detailCard}>
          <h3>Validation summary</h3>
          <div className={styles.validationList}>
            <span className={styles.active}>
              <CheckCircle2 size={14} /> Household head linked to A1 resident
            </span>
            <span className={styles.active}>
              <CheckCircle2 size={14} /> Structure and normalized address linked
            </span>
            <span className={styles.active}>
              <CheckCircle2 size={14} /> {household.members.length} household members validated
            </span>
            {householdRiskLabels(household).map((risk) => (
              <span key={risk}>
                <ShieldCheck size={14} /> Vulnerability: {risk}
              </span>
            ))}
          </div>
          {survey.reviewNote ? (
            <div className={styles.reviewNote}>
              <strong>Review note</strong>
              <p>{survey.reviewNote}</p>
            </div>
          ) : null}
        </section>
      </div>
      <section className={`${styles.card} ${styles.surveyActionsPanel}`}>
        <div>
          <h2>Review action</h2>
          <p>Record a note when returning or verifying this household survey.</p>
        </div>
        <label className={styles.field}>
          <span>Review note</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add validation findings or instructions"
          />
        </label>
        <div className={styles.actionGrid}>
          {survey.status === "Not Started" ? (
            <button className={styles.primaryButton} type="button" onClick={() => mutate("In Progress")}>
              <Tablet size={14} /> Start offline capture
            </button>
          ) : null}
          {survey.status === "In Progress" ? (
            <button className={styles.primaryButton} type="button" onClick={() => mutate("Submitted")}>
              <Send size={14} /> Submit survey
            </button>
          ) : null}
          {["Submitted", "Needs Review"].includes(survey.status) && survey.syncStatus === "Synced" ? (
            <button className={styles.primaryButton} type="button" onClick={() => mutate("Verified")}>
              <CheckCircle2 size={14} /> Verify survey
            </button>
          ) : null}
          {["Submitted", "Needs Review"].includes(survey.status) ? (
            <button className={styles.dangerButton} type="button" onClick={() => mutate("Returned")}>
              <RotateCcw size={14} /> Return to enumerator
            </button>
          ) : null}
          {survey.status === "Returned" ? (
            <button className={styles.primaryButton} type="button" onClick={() => mutate("In Progress")}>
              <RefreshCw size={14} /> Resume correction
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
