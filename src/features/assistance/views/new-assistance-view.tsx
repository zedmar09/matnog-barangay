"use client";

import { type FormEvent, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Save,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useHouseholdRegistryStore } from "@/features/household-registry/stores/household-registry-store";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { ASSISTANCE_TYPES } from "../data/assistance-data";
import { useAssistanceStore } from "../stores/assistance-store";
import type { AssistanceType } from "../types/assistance";
import assistanceStyles from "./assistance.module.css";

const steps = ["Select beneficiary", "Assistance details", "Requirements & eligibility", "Review & submit"];
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

function SelectField({
  label,
  value,
  placeholder,
  options,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: Array<readonly [string, string]>;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: select control is supplied through children.
    <label className={styles.field}>
      <span>
        {label}
        {required ? <b className={styles.requiredMark}> *</b> : null}
      </span>
      <Select value={value || "__none__"} onValueChange={(next) => onChange(next === "__none__" ? "" : next)}>
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">{placeholder}</SelectItem>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function ReviewField({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`${styles.field} ${className}`}>
      <span>{label}</span>
      <div className={styles.reviewFieldValue}>{value || "—"}</div>
    </div>
  );
}

const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);

export function NewAssistanceView() {
  const router = useRouter();
  const residents = useResidentRegistryStore((state) => state.residents);
  const households = useHouseholdRegistryStore((state) => state.households);
  const records = useAssistanceStore((state) => state.records);
  const checkEligibility = useAssistanceStore((state) => state.checkEligibility);
  const addAssistance = useAssistanceStore((state) => state.addAssistance);
  const { selectedBarangay } = useBarangayScope();
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedResidentId, setSelectedResidentId] = useState("");
  const [assistanceType, setAssistanceType] = useState<AssistanceType | "">("");
  const [amount, setAmount] = useState("");
  const [assistanceDate, setAssistanceDate] = useState("2026-09-23");
  const [fundSource, setFundSource] = useState("");
  const [releasingOffice, setReleasingOffice] = useState("");
  const [purpose, setPurpose] = useState("");
  const [documents, setDocuments] = useState<string[]>(["Valid ID", "Request form"]);
  const [error, setError] = useState("");

  const candidates = residents
    .filter(
      (resident) =>
        resident.residentStatus === "Active" &&
        (selectedBarangay === "all" || resident.address.barangayId === selectedBarangay),
    )
    .filter((resident) => {
      const query = search.trim().toLowerCase();
      return !query || `${resident.lrn} ${formatResidentName(resident)}`.toLowerCase().includes(query);
    })
    .slice(0, 12);
  const resident = residents.find((item) => item.id === selectedResidentId);
  const household = households.find((item) => item.members.some((member) => member.residentId === selectedResidentId));
  const eligibility = useMemo(
    () =>
      resident && household && assistanceType
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
    .slice(0, 4);

  const validateStep = (currentStep: number) => {
    if (currentStep === 0 && (!resident || !household))
      return "Select an active resident with a registered household before continuing.";
    if (
      currentStep === 1 &&
      (!assistanceType ||
        !amount ||
        Number(amount) <= 0 ||
        !assistanceDate ||
        !fundSource ||
        !releasingOffice ||
        !purpose.trim())
    )
      return "Complete all required assistance details before continuing.";
    if (currentStep === 2 && !documents.length) return "Select at least one supporting document.";
    if (currentStep === 2 && !eligibility?.eligible)
      return eligibility?.message ?? "Complete the assistance details to run the eligibility check.";
    return "";
  };
  const continueStep = () => {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setStep((current) => Math.min(steps.length - 1, current + 1));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    for (let index = 0; index < steps.length - 1; index += 1) {
      const message = validateStep(index);
      if (message) {
        setError(message);
        setStep(index);
        return;
      }
    }
    if (!resident || !household || !assistanceType) return;
    const result = addAssistance({
      residentId: resident.id,
      householdId: household.id,
      barangayId: resident.address.barangayId,
      assistanceType,
      amount: Number(amount),
      assistanceDate,
      fundSource,
      releasingOffice,
      purpose: purpose.trim(),
      supportingDocuments: documents,
    });
    if (!result.record) {
      setError(result.eligibility.message);
      setStep(2);
      return;
    }
    router.push(`/barangay-affairs/assistance/ledger?created=${result.record.id}`);
  };

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${styles.assistanceHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>New Assistance</h1>
            <p>Create a connected assistance request with beneficiary, household, funding, and eligibility details.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnSecondary} href="/barangay-affairs/assistance/ledger">
              <ChevronLeft size={16} /> Cancel
            </Link>
          </div>
        </div>
      </section>
      <div className={styles.body}>
        <div className={styles.formCentered}>
          {error ? <div className={`${styles.toast} ${styles.error}`}>{error}</div> : null}
          <form className={`${styles.card} ${styles.formCard}`} onSubmit={submit} noValidate>
            <div className={`${styles.stepper} ${styles.stepperFour}`}>
              {steps.map((label, index) => (
                <button
                  type="button"
                  key={label}
                  className={`${styles.step} ${index === step ? styles.stepActive : ""} ${index < step ? styles.stepDone : ""}`}
                  onClick={() => (index <= step ? setStep(index) : index === step + 1 ? continueStep() : undefined)}
                >
                  <span className={styles.stepNumber}>{index < step ? <Check size={12} /> : index + 1}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <div className={styles.formBody}>
              {step === 0 && (
                <>
                  <h2 className={styles.sectionTitle}>Select beneficiary</h2>
                  <p className={styles.sectionHelp}>
                    Search the permanent resident registry. The linked household is included automatically.
                  </p>
                  <label className={styles.searchBox}>
                    <Search size={15} />
                    <input
                      aria-label="Search resident for assistance"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search resident by name or LRN"
                    />
                  </label>
                  <div className={styles.residentPicker}>
                    {candidates.map((item) => {
                      const linkedHousehold = households.find((entry) =>
                        entry.members.some((member) => member.residentId === item.id),
                      );
                      const selected = item.id === selectedResidentId;
                      return (
                        <button
                          type="button"
                          key={item.id}
                          className={`${styles.residentPick} ${selected ? styles.residentPicked : ""}`}
                          onClick={() => {
                            setSelectedResidentId(item.id);
                            setError("");
                          }}
                        >
                          <span className={styles.pickCheck}>{selected ? <Check size={13} /> : null}</span>
                          <span>
                            <strong>{formatResidentName(item)}</strong>
                            <small>
                              {item.lrn} · {linkedHousehold?.householdNumber ?? "No registered household"}
                            </small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className={`${styles.lrnBox} ${assistanceStyles.beneficiarySummary}`}>
                    <UserRound size={21} />
                    <div>
                      <strong>{resident ? formatResidentName(resident) : "No beneficiary selected"}</strong>
                      <small>
                        {resident
                          ? `${resident.lrn} · ${household?.householdNumber ?? "No registered household"} · Brgy. ${barangayName(resident.address.barangayId)}`
                          : "Select an active resident with a registered household."}
                      </small>
                    </div>
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <h2 className={styles.sectionTitle}>Assistance details</h2>
                  <p className={styles.sectionHelp}>
                    Record the requested benefit, amount, date, funding source, releasing office, and case purpose.
                  </p>
                  <div className={styles.formGrid}>
                    <SelectField
                      label="Assistance type"
                      required
                      value={assistanceType}
                      placeholder="Select assistance type"
                      options={ASSISTANCE_TYPES.map((item) => [item, item])}
                      onChange={(value) => setAssistanceType(value as AssistanceType | "")}
                    />
                    <label className={styles.field}>
                      <span>
                        Requested amount<b className={styles.requiredMark}> *</b>
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        placeholder="Enter amount in pesos"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>
                        Assistance date<b className={styles.requiredMark}> *</b>
                      </span>
                      <input
                        type="date"
                        value={assistanceDate}
                        onChange={(event) => setAssistanceDate(event.target.value)}
                        placeholder="Select assistance date"
                      />
                    </label>
                    <SelectField
                      label="Fund source"
                      required
                      value={fundSource}
                      placeholder="Select fund source"
                      options={fundSources.map((item) => [item, item])}
                      onChange={setFundSource}
                    />
                    <SelectField
                      label="Releasing office"
                      required
                      value={releasingOffice}
                      placeholder="Select releasing office"
                      options={offices.map((item) => [item, item])}
                      onChange={setReleasingOffice}
                    />
                    <label className={`${styles.field} ${styles.span3}`}>
                      <span>
                        Purpose / case note<b className={styles.requiredMark}> *</b>
                      </span>
                      <textarea
                        rows={4}
                        value={purpose}
                        onChange={(event) => setPurpose(event.target.value)}
                        placeholder="Describe the need, circumstances, and intended use of the assistance"
                      />
                    </label>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <h2 className={styles.sectionTitle}>Requirements and eligibility</h2>
                  <p className={styles.sectionHelp}>
                    Confirm the available documents and review the municipal duplicate and cooling-period check.
                  </p>
                  <div className={assistanceStyles.wizardRequirements}>
                    <section className={assistanceStyles.wizardPanel}>
                      <div className={assistanceStyles.panelHeading}>
                        <span>
                          <FileCheck2 size={17} />
                        </span>
                        <div>
                          <strong>Supporting documents</strong>
                          <small>Select at least one document</small>
                        </div>
                      </div>
                      <div className={assistanceStyles.documentChecklist}>
                        {documentOptions.map((item) => (
                          <label key={item}>
                            <Checkbox
                              aria-label={item}
                              checked={documents.includes(item)}
                              onCheckedChange={(checked) =>
                                setDocuments((current) =>
                                  checked ? [...current, item] : current.filter((entry) => entry !== item),
                                )
                              }
                            />
                            <span>{item}</span>
                          </label>
                        ))}
                      </div>
                    </section>
                    <section className={assistanceStyles.wizardPanel}>
                      <div className={assistanceStyles.panelHeading}>
                        <span>
                          <ShieldCheck size={17} />
                        </span>
                        <div>
                          <strong>Eligibility result</strong>
                          <small>Resident and household records checked municipality-wide</small>
                        </div>
                      </div>
                      {eligibility?.eligible ? (
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
                            <strong>Requires review</strong>
                            <span>{eligibility?.message ?? "Complete the preceding steps to run the check."}</span>
                          </div>
                        </div>
                      )}
                      {history.length ? (
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
                      ) : null}
                    </section>
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <h2 className={styles.sectionTitle}>Review and submit</h2>
                  <p className={styles.sectionHelp}>
                    Confirm the beneficiary, household, funding, and requirements before creating the request.
                  </p>
                  <div className={styles.formGrid}>
                    <ReviewField label="Beneficiary" value={resident ? formatResidentName(resident) : "Required"} />
                    <ReviewField label="LRN" value={resident?.lrn ?? "Required"} />
                    <ReviewField label="Household" value={household?.householdNumber ?? "Required"} />
                    <ReviewField
                      label="Barangay"
                      value={resident ? barangayName(resident.address.barangayId) : "Required"}
                    />
                    <ReviewField label="Assistance type" value={assistanceType || "Required"} />
                    <ReviewField label="Requested amount" value={amount ? money(Number(amount)) : "Required"} />
                    <ReviewField label="Assistance date" value={assistanceDate || "Required"} />
                    <ReviewField label="Fund source" value={fundSource || "Required"} />
                    <ReviewField label="Releasing office" value={releasingOffice || "Required"} />
                    <ReviewField label="Purpose / case note" value={purpose || "Required"} className={styles.span3} />
                    <ReviewField
                      label={`Supporting documents (${documents.length})`}
                      value={documents.join(", ") || "Required"}
                      className={styles.span3}
                    />
                    <ReviewField
                      label="Eligibility"
                      value={eligibility?.eligible ? "Eligible for submission" : "Requires review"}
                      className={styles.span3}
                    />
                  </div>
                </>
              )}
            </div>
            <footer className={styles.formFooter}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={step === 0}
                onClick={() => {
                  setError("");
                  setStep((current) => Math.max(0, current - 1));
                }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              {step < steps.length - 1 ? (
                <button key="continue" type="button" className={styles.primaryButton} onClick={continueStep}>
                  Continue <ChevronRight size={14} />
                </button>
              ) : (
                <button key="submit" type="submit" className={styles.primaryButton}>
                  <Save size={14} /> Submit for review
                </button>
              )}
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
}
