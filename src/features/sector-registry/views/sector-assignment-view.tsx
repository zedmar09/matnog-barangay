"use client";

import { type FormEvent, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Building2, Check, ChevronLeft, ChevronRight, ClipboardCheck, Save, Search, UserCheck } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { calculateAge, formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import dashboardStyles from "@/features/resident-registry/views/resident-dashboard.module.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useSectorRegistryStore } from "../stores/sector-registry-store";
import type { SectorCode } from "../types/sector";

const steps = ["Select resident", "Sector classification", "Validity & documents", "Review & submit"];

function ReviewField({ label, value, className = "" }: { label: string; value: string | number; className?: string }) {
  return (
    <div className={`${styles.field} ${className}`}>
      <span>{label}</span>
      <div className={styles.reviewFieldValue}>{value || "—"}</div>
    </div>
  );
}

export function SectorAssignmentView({
  initialResidentId = "",
  initialSector = "",
}: {
  initialResidentId?: string;
  initialSector?: string;
}) {
  const residents = useResidentRegistryStore((state) => state.residents);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const memberships = useSectorRegistryStore((state) => state.memberships);
  const addMembership = useSectorRegistryStore((state) => state.addMembership);
  const { selectedBarangay } = useBarangayScope();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [residentId, setResidentId] = useState(initialResidentId);
  const [sectorCode, setSectorCode] = useState<SectorCode | "">(initialSector as SectorCode | "");
  const [start, setStart] = useState("2026-09-24");
  const [end, setEnd] = useState("2029-09-23");
  const [documents, setDocuments] = useState("Barangay certification\nSupporting eligibility document");
  const [remarks, setRemarks] = useState("New sector classification for barangay review.");
  const [error, setError] = useState("");

  const selectedResident = residents.find((resident) => resident.id === residentId);
  const eligibleResidents = useMemo(
    () =>
      residents.filter(
        (resident) =>
          resident.residentStatus === "Active" &&
          (selectedBarangay === "all" || resident.address.barangayId === selectedBarangay),
      ),
    [residents, selectedBarangay],
  );
  const results = eligibleResidents
    .filter(
      (resident) =>
        !query.trim() ||
        `${resident.lrn} ${formatResidentName(resident)} ${resident.contact.primaryMobile}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .slice(0, 12);
  const existingMemberships = memberships.filter(
    (membership) => membership.residentId === residentId && membership.status !== "Inactive",
  );
  const existingCodes = existingMemberships.map((membership) => membership.sectorCode);
  const selectedDefinition = definitions.find((definition) => definition.code === sectorCode);
  const barangayName = selectedResident
    ? (MATNOG_BARANGAYS.find((barangay) => barangay.code === selectedResident.address.barangayId)?.name ?? "—")
    : "—";
  const documentList = documents
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);

  const selectResident = (id: string) => {
    setResidentId(id);
    setQuery("");
    const assigned = memberships
      .filter((membership) => membership.residentId === id && membership.status !== "Inactive")
      .map((membership) => membership.sectorCode);
    if (sectorCode !== "" && assigned.includes(sectorCode)) setSectorCode("");
    setError("");
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 0 && !selectedResident) return "Select an active resident before continuing.";
    if (currentStep === 1 && !sectorCode) return "Select a sector classification before continuing.";
    if (currentStep === 1 && sectorCode !== "" && existingCodes.includes(sectorCode))
      return "This resident already has a current membership in the selected sector.";
    if (currentStep === 2 && !start) return "Enter the validity start date before continuing.";
    if (currentStep === 2 && end && end < start) return "Validity end must be later than the validity start date.";
    if (currentStep === 2 && documentList.length === 0)
      return "Enter at least one supporting document before continuing.";
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
    if (!selectedResident || !sectorCode) return;
    const membership = addMembership({
      residentId: selectedResident.id,
      sectorCode,
      validityStart: start,
      validityEnd: end,
      supportingDocuments: documentList,
      remarks,
    });
    if (!membership) {
      setError("This resident already has a current membership in the selected sector.");
      setStep(1);
      return;
    }
    router.push(`/barangay-affairs/sectors/residents/${selectedResident.id}?created=1`);
  };

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${dashboardStyles.sectorHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>Assign Sector Classification</h1>
            <p>Link an existing resident to a sector classification. Required fields are marked with *.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnSecondary} href="/barangay-affairs/sectors/masterlist">
              <ChevronLeft size={16} /> Cancel
            </Link>
          </div>
        </div>
      </section>

      <main className={styles.body}>
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
                  <h2 className={styles.sectionTitle}>Select resident</h2>
                  <p className={styles.sectionHelp}>
                    Search the permanent Resident Registry and select the person receiving the sector classification.
                  </p>
                  <label className={styles.searchBox}>
                    <Search size={15} />
                    <input
                      aria-label="Search resident for sector assignment"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search active resident by name, LRN, or mobile number"
                    />
                  </label>
                  <div className={styles.residentPicker}>
                    {results.length ? (
                      results.map((resident) => (
                        <button
                          type="button"
                          key={resident.id}
                          className={`${styles.residentPick} ${residentId === resident.id ? styles.residentPicked : ""}`}
                          onClick={() => selectResident(resident.id)}
                        >
                          <span className={styles.pickCheck}>
                            {residentId === resident.id ? <Check size={13} /> : null}
                          </span>
                          <span>
                            <strong>{formatResidentName(resident)}</strong>
                            <small>{resident.lrn}</small>
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className={styles.muted}>No active residents match this search and barangay scope.</p>
                    )}
                  </div>
                  {selectedResident ? (
                    <div className={`${styles.lrnBox} ${styles.structureSelection}`}>
                      <UserCheck size={21} />
                      <div>
                        <strong>{formatResidentName(selectedResident)}</strong>
                        <small>
                          {selectedResident.lrn} · {barangayName} · Age {calculateAge(selectedResident.birthDate)} ·
                          {` `}
                          {selectedResident.contact.primaryMobile || "No mobile recorded"}
                        </small>
                      </div>
                    </div>
                  ) : null}
                  {selectedResident && existingMemberships.length ? (
                    <div className={styles.selectedMembers}>
                      <h3>Existing classifications</h3>
                      <div className={styles.sectorBadges}>
                        {existingMemberships.map((membership) => {
                          const definition = definitions.find((item) => item.code === membership.sectorCode);
                          return (
                            <span
                              key={membership.id}
                              style={{ borderColor: definition?.color, color: definition?.color }}
                            >
                              {definition?.shortName} · {membership.status}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              {step === 1 && (
                <>
                  <h2 className={styles.sectionTitle}>Sector classification</h2>
                  <p className={styles.sectionHelp}>
                    Choose the classification that applies to{" "}
                    {selectedResident ? formatResidentName(selectedResident) : "the resident"}. Existing current
                    classifications cannot be selected again.
                  </p>
                  <div className={styles.formGrid}>
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: shadcn select is nested in this label. */}
                    <label className={`${styles.field} ${styles.span2}`}>
                      <span>
                        Sector classification<span className={styles.requiredMark}> *</span>
                      </span>
                      <Select
                        value={sectorCode || "__none__"}
                        onValueChange={(value) => setSectorCode(value === "__none__" ? "" : (value as SectorCode))}
                      >
                        <SelectTrigger aria-label="Sector classification">
                          <SelectValue placeholder="Select sector classification" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select sector classification</SelectItem>
                          {definitions.map((definition) => (
                            <SelectItem
                              key={definition.code}
                              value={definition.code}
                              disabled={existingCodes.includes(definition.code)}
                            >
                              {definition.name}
                              {existingCodes.includes(definition.code) ? " · Already assigned" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </label>
                  </div>
                  {selectedDefinition ? (
                    <div className={`${styles.lrnBox} ${styles.structureSelection}`}>
                      <Building2 size={21} />
                      <div>
                        <strong>{selectedDefinition.name}</strong>
                        <small>{selectedDefinition.description}</small>
                        <small>Issuing office: {selectedDefinition.issuingOffice}</small>
                      </div>
                    </div>
                  ) : (
                    <div className={`${styles.lrnBox} ${styles.structureSelection}`}>
                      <ClipboardCheck size={21} />
                      <div>
                        <strong>No classification selected</strong>
                        <small>Select the applicable sector before continuing.</small>
                      </div>
                    </div>
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className={styles.sectionTitle}>Validity and supporting documents</h2>
                  <p className={styles.sectionHelp}>
                    Record the classification period and the documents used to establish eligibility.
                  </p>
                  <div className={styles.formGrid}>
                    <label className={styles.field}>
                      <span>
                        Validity start<span className={styles.requiredMark}> *</span>
                      </span>
                      <input
                        type="date"
                        value={start}
                        placeholder="Select validity start"
                        onChange={(event) => setStart(event.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Validity end</span>
                      <input
                        type="date"
                        value={end}
                        placeholder="Select validity end"
                        onChange={(event) => setEnd(event.target.value)}
                      />
                      <small>Leave empty for a classification without a fixed expiry.</small>
                    </label>
                    <label className={`${styles.field} ${styles.span3}`}>
                      <span>
                        Supporting documents<span className={styles.requiredMark}> *</span>
                      </span>
                      <textarea
                        value={documents}
                        placeholder="e.g. Barangay certification\nMedical certificate"
                        onChange={(event) => setDocuments(event.target.value)}
                      />
                      <small>Enter one supporting document per line.</small>
                    </label>
                    <label className={`${styles.field} ${styles.span3}`}>
                      <span>Eligibility notes and remarks</span>
                      <textarea
                        value={remarks}
                        placeholder="Describe the eligibility basis or staff review notes"
                        onChange={(event) => setRemarks(event.target.value)}
                      />
                    </label>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className={styles.sectionTitle}>Review and submit</h2>
                  <p className={styles.sectionHelp}>
                    Confirm the resident, classification, validity, and supporting records before submitting for review.
                  </p>
                  <div className={styles.formGrid}>
                    <ReviewField
                      label="Resident"
                      value={selectedResident ? formatResidentName(selectedResident) : "Required"}
                    />
                    <ReviewField label="Local Resident Number" value={selectedResident?.lrn ?? "Required"} />
                    <ReviewField label="Barangay" value={barangayName} />
                    <ReviewField label="Sector classification" value={selectedDefinition?.name ?? "Required"} />
                    <ReviewField label="Issuing office" value={selectedDefinition?.issuingOffice ?? "Required"} />
                    <ReviewField label="Validity start" value={start || "Required"} />
                    <ReviewField label="Validity end" value={end || "No fixed expiry"} />
                    <ReviewField
                      label={`Supporting documents (${documentList.length})`}
                      value={documentList.join(", ") || "Required"}
                      className={styles.span3}
                    />
                    <ReviewField
                      label="Eligibility notes and remarks"
                      value={remarks || "No additional remarks"}
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
                  <Save size={14} /> Submit for Review
                </button>
              )}
            </footer>
          </form>
        </div>
      </main>
    </div>
  );
}
