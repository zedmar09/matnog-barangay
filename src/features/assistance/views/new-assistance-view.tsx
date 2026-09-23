"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { AlertTriangle, CheckCircle2, FileCheck2, Search, ShieldCheck, UserRound } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useHouseholdRegistryStore } from "@/features/household-registry/stores/household-registry-store";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { ASSISTANCE_TYPES } from "../data/assistance-data";
import { useAssistanceStore } from "../stores/assistance-store";
import type { AssistanceType } from "../types/assistance";
import assistanceStyles from "./assistance.module.css";

const fundSources = [
  "Municipal General Fund",
  "Barangay General Fund",
  "Local Disaster Risk Reduction Fund",
  "GAD Fund",
  "Social Welfare Fund",
  "External Grant",
];
const offices = ["MSWDO", "Mayor's Office", "Barangay Council", "MDRRMO", "Municipal Health Office"];
const documentOptions = ["Valid ID", "Barangay certification", "Request form", "Case assessment", "Supporting receipt"];
const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;

export function NewAssistanceView() {
  const residents = useResidentRegistryStore((state) => state.residents);
  const households = useHouseholdRegistryStore((state) => state.households);
  const records = useAssistanceStore((state) => state.records);
  const checkEligibility = useAssistanceStore((state) => state.checkEligibility);
  const addAssistance = useAssistanceStore((state) => state.addAssistance);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [selectedResidentId, setSelectedResidentId] = useState("");
  const [assistanceType, setAssistanceType] = useState<AssistanceType>("AICS");
  const [amount, setAmount] = useState("3000");
  const [assistanceDate, setAssistanceDate] = useState("2026-09-23");
  const [fundSource, setFundSource] = useState(fundSources[0]);
  const [releasingOffice, setReleasingOffice] = useState(offices[0]);
  const [purpose, setPurpose] = useState("");
  const [documents, setDocuments] = useState<string[]>(["Valid ID", "Request form"]);
  const [message, setMessage] = useState("");

  const candidates = residents
    .filter((resident) => selectedBarangay === "all" || resident.address.barangayId === selectedBarangay)
    .filter((resident) =>
      !search.trim()
        ? true
        : `${resident.lrn} ${formatResidentName(resident)}`.toLowerCase().includes(search.toLowerCase()),
    )
    .slice(0, 12);
  const resident = residents.find((item) => item.id === selectedResidentId);
  const household = households.find((item) => item.members.some((member) => member.residentId === selectedResidentId));
  const eligibility = useMemo(
    () =>
      resident && household
        ? checkEligibility({
            residentId: resident.id,
            householdId: household.id,
            assistanceType,
            assistanceDate,
          })
        : undefined,
    [assistanceDate, assistanceType, checkEligibility, household, resident],
  );
  const history = records
    .filter((item) => item.residentId === selectedResidentId || (!!household && item.householdId === household.id))
    .slice(0, 6);
  const canSubmit = !!resident && !!household && !!eligibility?.eligible && Number(amount) > 0 && documents.length > 0;

  const submit = () => {
    if (!resident || !household || !canSubmit) return;
    const result = addAssistance({
      residentId: resident.id,
      householdId: household.id,
      barangayId: resident.address.barangayId,
      assistanceType,
      amount: Number(amount),
      assistanceDate,
      fundSource,
      releasingOffice,
      purpose: purpose.trim() || `${assistanceType} assistance request.`,
      supportingDocuments: documents,
    });
    setMessage(result.record ? `${result.record.referenceNumber} submitted for review.` : result.eligibility.message);
  };

  return (
    <div className={styles.page}>
      {message && (
        <div className={assistanceStyles.successNotice}>
          <CheckCircle2 size={18} /> {message}
        </div>
      )}
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A7 Controlled Intake</p>
          <h1>New Assistance</h1>
          <p>
            Select one municipal resident record, confirm the linked household, then run eligibility before submission.
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/assistance/ledger">
          View ledger
        </Link>
      </header>
      <div className={assistanceStyles.intakeGrid}>
        <section className={styles.card}>
          <div className={assistanceStyles.panelHeading}>
            <span>
              <UserRound size={17} />
            </span>
            <div>
              <strong>1. Select resident</strong>
              <small>Searches the permanent A1 registry</small>
            </div>
          </div>
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                aria-label="Search resident for assistance"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search LRN or resident name"
              />
            </label>
          </div>
          <div className={assistanceStyles.residentPicker}>
            {candidates.map((item) => (
              <button
                className={
                  item.id === selectedResidentId ? assistanceStyles.residentSelected : assistanceStyles.residentOption
                }
                type="button"
                key={item.id}
                onClick={() => {
                  setSelectedResidentId(item.id);
                  setMessage("");
                }}
              >
                <span>
                  {item.firstName[0]}
                  {item.lastName[0]}
                </span>
                <div>
                  <strong>{formatResidentName(item)}</strong>
                  <small>
                    {item.lrn} · Brgy. {barangayName(item.address.barangayId)}
                  </small>
                </div>
                {item.id === selectedResidentId && <CheckCircle2 size={17} />}
              </button>
            ))}
          </div>
        </section>
        <div className={assistanceStyles.intakeMain}>
          <section className={styles.card}>
            <div className={assistanceStyles.panelHeading}>
              <span>
                <FileCheck2 size={17} />
              </span>
              <div>
                <strong>2. Assistance details</strong>
                <small>Resident and household references are stored with the transaction</small>
              </div>
            </div>
            {resident ? (
              <div className={assistanceStyles.selectedBeneficiary}>
                <div>
                  <small>BENEFICIARY</small>
                  <strong>{formatResidentName(resident)}</strong>
                  <span>{resident.lrn}</span>
                </div>
                <div>
                  <small>HOUSEHOLD</small>
                  <strong>{household?.householdNumber ?? "No linked household"}</strong>
                  <span>Brgy. {barangayName(resident.address.barangayId)}</span>
                </div>
              </div>
            ) : (
              <div className={assistanceStyles.selectionPrompt}>Select a resident from the registry to begin.</div>
            )}
            <div className={assistanceStyles.formBody}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Assistance type</span>
                  <select
                    value={assistanceType}
                    onChange={(event) => setAssistanceType(event.target.value as AssistanceType)}
                  >
                    {ASSISTANCE_TYPES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Amount</span>
                  <input type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} />
                </label>
                <label className={styles.field}>
                  <span>Assistance date</span>
                  <input
                    type="date"
                    value={assistanceDate}
                    onChange={(event) => setAssistanceDate(event.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>Fund source</span>
                  <select value={fundSource} onChange={(event) => setFundSource(event.target.value)}>
                    {fundSources.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Releasing office</span>
                  <select value={releasingOffice} onChange={(event) => setReleasingOffice(event.target.value)}>
                    {offices.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className={`${styles.field} ${assistanceStyles.purposeField}`}>
                  <span>Purpose / case note</span>
                  <textarea
                    rows={3}
                    value={purpose}
                    onChange={(event) => setPurpose(event.target.value)}
                    placeholder="Describe the need and intended use"
                  />
                </label>
              </div>
              <div className={assistanceStyles.documentsBox}>
                <strong>Supporting documents</strong>
                <div>
                  {documentOptions.map((item) => (
                    <label key={item}>
                      <input
                        type="checkbox"
                        checked={documents.includes(item)}
                        onChange={(event) =>
                          setDocuments((current) =>
                            event.target.checked ? [...current, item] : current.filter((entry) => entry !== item),
                          )
                        }
                      />{" "}
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>
          <section className={styles.card}>
            <div className={assistanceStyles.panelHeading}>
              <span>
                <ShieldCheck size={17} />
              </span>
              <div>
                <strong>3. Duplicate and cooling-off check</strong>
                <small>Checks resident and household releases across barangays and offices</small>
              </div>
            </div>
            {!resident || !household ? (
              <div className={assistanceStyles.eligibilityNeutral}>
                <AlertTriangle size={18} /> Select a resident with a linked household to run eligibility.
              </div>
            ) : eligibility?.eligible ? (
              <div className={assistanceStyles.eligibilityPass}>
                <CheckCircle2 size={20} />
                <div>
                  <strong>Eligible for submission</strong>
                  <span>{eligibility.message}</span>
                </div>
              </div>
            ) : (
              <div className={assistanceStyles.eligibilityBlocked}>
                <AlertTriangle size={20} />
                <div>
                  <strong>Submission blocked</strong>
                  <span>{eligibility?.message}</span>
                </div>
              </div>
            )}
            {history.length > 0 && (
              <div className={assistanceStyles.historyStrip}>
                {history.map((item) => (
                  <div key={item.id}>
                    <strong>{item.assistanceType}</strong>
                    <span>{item.referenceNumber}</span>
                    <small>
                      {item.assistanceDate} · {item.status}
                    </small>
                  </div>
                ))}
              </div>
            )}
            <div className={assistanceStyles.submitRow}>
              <span>{documents.length} supporting documents selected</span>
              <button className={styles.primaryButton} type="button" disabled={!canSubmit} onClick={submit}>
                Submit for review
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
