"use client";

import { type FormEvent, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Check, ChevronLeft, ChevronRight, Home, MapPin, Save, Search, UsersRound } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useHouseholdRegistryStore } from "../stores/household-registry-store";
import type { Household } from "../types/household";
import { formatStructureAddress } from "../utils/household-utils";

const steps = ["Structure & location", "Household members", "Socio-economic", "Review & save"];
const relationshipOptions = ["Spouse", "Child", "Parent", "Sibling", "Grandchild", "Other relative", "Non-relative"];
const incomeOptions = ["Below ₱10,000", "₱10,000–₱19,999", "₱20,000–₱39,999", "₱40,000 and above"];
const livelihoodOptions = [
  "Farming",
  "Fishing",
  "Retail / sari-sari store",
  "Construction",
  "Transport",
  "Government service",
  "Tourism services",
];
const foodOptions = ["Food secure", "Mild concern", "Moderate concern", "Needs immediate assessment"];

function SelectField({
  label,
  value,
  placeholder,
  options,
  onChange,
  required = false,
  help,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: Array<readonly [string, string]>;
  onChange: (value: string) => void;
  required?: boolean;
  help?: string;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the reusable select control is supplied through children.
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
      {help ? <small>{help}</small> : null}
    </label>
  );
}

function ReviewField({ label, value, className = "" }: { label: string; value: string | number; className?: string }) {
  return (
    <div className={`${styles.field} ${className}`}>
      <span>{label}</span>
      <div className={styles.reviewFieldValue}>{value || "—"}</div>
    </div>
  );
}

export function HouseholdRegisterView({
  household,
  initialStructureId = "",
}: {
  household?: Household;
  initialStructureId?: string;
}) {
  const editing = Boolean(household);
  const residents = useResidentRegistryStore((state) => state.residents);
  const households = useHouseholdRegistryStore((state) => state.households);
  const structures = useHouseholdRegistryStore((state) => state.structures);
  const addHousehold = useHouseholdRegistryStore((state) => state.addHousehold);
  const updateHousehold = useHouseholdRegistryStore((state) => state.updateHousehold);
  const { selectedBarangay } = useBarangayScope();
  const router = useRouter();
  const returnedStructure = structures.find((structure) => structure.id === initialStructureId);
  const [step, setStep] = useState(0);
  const [barangayId, setBarangayId] = useState(
    household?.barangayId ?? returnedStructure?.barangayId ?? (selectedBarangay === "all" ? "" : selectedBarangay),
  );
  const [structureId, setStructureId] = useState(household?.structureId ?? returnedStructure?.id ?? "");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(
    household?.members.filter((member) => !member.leftAt).map((member) => member.residentId) ?? [],
  );
  const [headId, setHeadId] = useState(household?.headResidentId ?? "");
  const [relationships, setRelationships] = useState<Record<string, string>>(() =>
    Object.fromEntries(household?.members.map((member) => [member.residentId, member.relationshipToHead]) ?? []),
  );
  const [income, setIncome] = useState(household?.monthlyIncomeBracket ?? "");
  const [livelihood, setLivelihood] = useState(household?.primaryLivelihood ?? "");
  const [foodSecurity, setFoodSecurity] = useState(household?.foodSecurity ?? "");
  const [error, setError] = useState("");

  const assigned = useMemo(
    () =>
      new Set(
        households.flatMap((item) =>
          item.id === household?.id
            ? []
            : item.members.filter((member) => !member.leftAt).map((member) => member.residentId),
        ),
      ),
    [households, household?.id],
  );
  const eligible = useMemo(
    () =>
      residents.filter(
        (resident) =>
          resident.residentStatus === "Active" &&
          resident.address.barangayId === barangayId &&
          !assigned.has(resident.id),
      ),
    [assigned, barangayId, residents],
  );
  const results = eligible
    .filter(
      (resident) =>
        !query.trim() ||
        `${resident.lrn} ${formatResidentName(resident)}`.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .slice(0, 12);
  const selectedResidents = selected
    .map((id) => residents.find((resident) => resident.id === id))
    .filter((resident): resident is NonNullable<typeof resident> => Boolean(resident));
  const selectedHead = selectedResidents.find((resident) => resident.id === headId);
  const availableStructures = structures.filter((structure) => structure.barangayId === barangayId);
  const selectedStructure = structures.find((structure) => structure.id === structureId);
  const barangayName = MATNOG_BARANGAYS.find((barangay) => barangay.code === barangayId)?.name ?? "—";
  const returnPath = household
    ? `/barangay-affairs/households/${household.id}/edit`
    : "/barangay-affairs/households/register";

  const toggle = (residentId: string) => {
    setSelected((current) =>
      current.includes(residentId) ? current.filter((id) => id !== residentId) : [...current, residentId],
    );
    if (selected.includes(residentId)) {
      if (headId === residentId) setHeadId("");
    } else if (!headId) setHeadId(residentId);
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 0 && (!barangayId || !structureId))
      return "Select a barangay and an existing structure before continuing.";
    if (currentStep === 1 && (!selected.length || !headId || !selected.includes(headId)))
      return "Select at least one resident and assign the household head.";
    if (currentStep === 2 && (!income || !livelihood || !foodSecurity))
      return "Complete the income, livelihood, and food-security fields.";
    return "";
  };

  const continueStep = () => {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    if (step === 0 && selected.length === 0 && eligible.length > 0) {
      const sampleMembers = eligible.slice(0, 3);
      setSelected(sampleMembers.map((resident) => resident.id));
      setHeadId(sampleMembers[0].id);
      setRelationships(
        Object.fromEntries(
          sampleMembers.slice(1).map((resident, index) => [resident.id, index === 0 ? "Spouse" : "Child"]),
        ),
      );
    }
    setError("");
    setStep((current) => Math.min(steps.length - 1, current + 1));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    for (let index = 0; index < 3; index += 1) {
      const message = validateStep(index);
      if (message) {
        setError(message);
        setStep(index);
        return;
      }
    }
    const input = {
      barangayId,
      structureId,
      headResidentId: headId,
      members: selected.map((residentId) => {
        const current = household?.members.find((member) => member.residentId === residentId);
        return {
          residentId,
          relationshipToHead: residentId === headId ? "Head" : relationships[residentId] || "Other relative",
          joinedAt: current?.joinedAt ?? new Date().toISOString().slice(0, 10),
          leftAt: current?.leftAt ?? "",
          temporarilyAbsent: current?.temporarilyAbsent ?? false,
          absenceReason: current?.absenceReason ?? "",
        };
      }),
      monthlyIncomeBracket: income,
      primaryLivelihood: livelihood,
      foodSecurity,
    };
    const saved = household ? updateHousehold(household.id, input) : addHousehold(input);
    if (saved) router.push(`/barangay-affairs/households/${saved.id}?${household ? "updated" : "created"}=1`);
  };

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${styles.householdHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>{editing ? "Edit Household" : "Register Household"}</h1>
            <p>
              {editing
                ? "Update the household's structure, membership, and socio-economic information."
                : "Create a household under a registered physical structure. Required fields are marked with *."}
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link
              className={styles.btnSecondary}
              href={
                household ? `/barangay-affairs/households/${household.id}` : "/barangay-affairs/households/masterlist"
              }
            >
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
                  <h2 className={styles.sectionTitle}>Structure and location</h2>
                  <p className={styles.sectionHelp}>
                    Every household must belong to one registered structure. Multiple households may share the same
                    structure.
                  </p>
                  <div className={styles.formGrid}>
                    <SelectField
                      label="Barangay"
                      required
                      value={barangayId}
                      placeholder="Select barangay"
                      options={MATNOG_BARANGAYS.map((barangay) => [barangay.code, barangay.name])}
                      onChange={(value) => {
                        setBarangayId(value);
                        setStructureId("");
                        setSelected([]);
                        setHeadId("");
                      }}
                    />
                    <div className={`${styles.field} ${styles.span2}`}>
                      <div className={styles.fieldLabelRow}>
                        <span>
                          Existing structure<span className={styles.requiredMark}> *</span>
                        </span>
                        <Link
                          className={styles.inlineCreateLink}
                          href={`/barangay-affairs/structures/new?returnTo=${encodeURIComponent(returnPath)}&barangayId=${encodeURIComponent(barangayId)}`}
                        >
                          Register New Structure
                        </Link>
                      </div>
                      <Select
                        value={structureId || "__none__"}
                        onValueChange={(value) => setStructureId(value === "__none__" ? "" : value)}
                      >
                        <SelectTrigger aria-label="Existing structure">
                          <SelectValue
                            placeholder={barangayId ? "Select registered structure" : "Select a barangay first"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            {barangayId ? "Select registered structure" : "Select a barangay first"}
                          </SelectItem>
                          {availableStructures.map((structure) => (
                            <SelectItem key={structure.id} value={structure.id}>
                              {structure.structureCode} · {formatStructureAddress(structure)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {selectedStructure ? (
                    <div className={`${styles.lrnBox} ${styles.structureSelection}`}>
                      <MapPin size={21} />
                      <div>
                        <strong>{selectedStructure.structureCode}</strong>
                        <small>
                          {formatStructureAddress(selectedStructure)} · Brgy. {barangayName}
                        </small>
                      </div>
                    </div>
                  ) : (
                    <div className={`${styles.lrnBox} ${styles.structureSelection}`}>
                      <Home size={21} />
                      <div>
                        <strong>No structure selected</strong>
                        <small>Select an existing structure or register a new one before continuing.</small>
                      </div>
                    </div>
                  )}
                </>
              )}

              {step === 1 && (
                <>
                  <h2 className={styles.sectionTitle}>Household members</h2>
                  <p className={styles.sectionHelp}>
                    Select active residents from Brgy. {barangayName}, then identify the household head and each
                    relationship.
                  </p>
                  <label className={styles.searchBox}>
                    <Search size={15} />
                    <input
                      aria-label="Search eligible residents"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search eligible residents by name or LRN"
                    />
                  </label>
                  <div className={styles.residentPicker}>
                    {results.length ? (
                      results.map((resident) => (
                        <button
                          type="button"
                          key={resident.id}
                          className={`${styles.residentPick} ${selected.includes(resident.id) ? styles.residentPicked : ""}`}
                          onClick={() => toggle(resident.id)}
                        >
                          <span className={styles.pickCheck}>
                            {selected.includes(resident.id) ? <Check size={13} /> : null}
                          </span>
                          <span>
                            <strong>{formatResidentName(resident)}</strong>
                            <small>{resident.lrn}</small>
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className={styles.muted}>No eligible residents match this barangay and search.</p>
                    )}
                  </div>
                  {selectedResidents.length ? (
                    <div className={styles.selectedMembers}>
                      <h3>
                        <UsersRound size={16} /> Selected members
                      </h3>
                      {selectedResidents.map((resident) => (
                        <div key={resident.id}>
                          <label className={styles.radioLabel}>
                            <input
                              type="radio"
                              name="head"
                              checked={headId === resident.id}
                              onChange={() => setHeadId(resident.id)}
                            />
                            <span>
                              <strong>{formatResidentName(resident)}</strong>
                              <small>{resident.lrn}</small>
                            </span>
                          </label>
                          {headId !== resident.id ? (
                            <Select
                              value={relationships[resident.id] || "Other relative"}
                              onValueChange={(value) =>
                                setRelationships((current) => ({ ...current, [resident.id]: value }))
                              }
                            >
                              <SelectTrigger aria-label={`Relationship for ${formatResidentName(resident)}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {relationshipOptions.map((value) => (
                                  <SelectItem key={value} value={value}>
                                    {value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className={`${styles.badge} ${styles.active}`}>Household head</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className={styles.sectionTitle}>Socio-economic profile</h2>
                  <p className={styles.sectionHelp}>
                    Record the household's current income range, primary source of livelihood, and food-security
                    condition.
                  </p>
                  <div className={styles.formGrid}>
                    <SelectField
                      label="Monthly income bracket"
                      required
                      value={income}
                      placeholder="Select bracket"
                      options={incomeOptions.map((value) => [value, value])}
                      onChange={setIncome}
                    />
                    <SelectField
                      label="Primary livelihood"
                      required
                      value={livelihood}
                      placeholder="Select livelihood"
                      options={livelihoodOptions.map((value) => [value, value])}
                      onChange={setLivelihood}
                    />
                    <SelectField
                      label="Food security"
                      required
                      value={foodSecurity}
                      placeholder="Select condition"
                      options={foodOptions.map((value) => [value, value])}
                      onChange={setFoodSecurity}
                    />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className={styles.sectionTitle}>Review and save</h2>
                  <p className={styles.sectionHelp}>
                    Confirm the household and structure relationship before saving the record.
                  </p>
                  <div className={styles.formGrid}>
                    <ReviewField label="Barangay" value={barangayName} />
                    <ReviewField label="Structure" value={selectedStructure?.structureCode ?? "Required"} />
                    <ReviewField
                      label="Household head"
                      value={selectedHead ? formatResidentName(selectedHead) : "Required"}
                    />
                    <ReviewField
                      label="Structure address"
                      value={selectedStructure ? formatStructureAddress(selectedStructure) : "Required"}
                      className={styles.span3}
                    />
                    <ReviewField
                      label={`Household members (${selectedResidents.length})`}
                      value={selectedResidents.map(formatResidentName).join(", ") || "Required"}
                      className={styles.span3}
                    />
                    <ReviewField label="Monthly income bracket" value={income || "Required"} />
                    <ReviewField label="Primary livelihood" value={livelihood || "Required"} />
                    <ReviewField label="Food security" value={foodSecurity || "Required"} />
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
                  <Save size={14} /> {editing ? "Save changes" : "Register household"}
                </button>
              )}
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
}
