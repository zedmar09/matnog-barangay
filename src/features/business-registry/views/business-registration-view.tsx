"use client";

import { type FormEvent, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { BadgeCheck, Check, ChevronLeft, ChevronRight, MapPin, Save, Search, UserRound } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useHouseholdRegistryStore } from "@/features/household-registry/stores/household-registry-store";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { BUSINESS_TYPES, GROSS_SALES_BRACKETS } from "../data/business-data";
import { useBusinessRegistryStore } from "../stores/business-store";
import type { BusinessOwnership } from "../types/business";
import businessStyles from "./business.module.css";

const steps = ["Owner & barangay", "Business details", "Location & classification", "Review & save"];
const ownerships: BusinessOwnership[] = ["Sole proprietorship", "Partnership", "Corporation", "Cooperative"];
const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;

function SelectField({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: Array<readonly [string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the select trigger is nested through the shared Select component.
    <label className={styles.field}>
      <span>
        {label}
        <b className={styles.requiredMark}> *</b>
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

function ReviewField({ label, value, className = "" }: { label: string; value: string | number; className?: string }) {
  return (
    <div className={`${styles.field} ${className}`}>
      <span>{label}</span>
      <div className={styles.reviewFieldValue}>{value || "—"}</div>
    </div>
  );
}

export function BusinessRegistrationWizard({ businessId }: { businessId?: string }) {
  const router = useRouter();
  const businesses = useBusinessRegistryStore((state) => state.businesses);
  const registerBusiness = useBusinessRegistryStore((state) => state.registerBusiness);
  const updateBusiness = useBusinessRegistryStore((state) => state.updateBusiness);
  const residents = useResidentRegistryStore((state) => state.residents);
  const structures = useHouseholdRegistryStore((state) => state.structures);
  const { selectedBarangay } = useBarangayScope();
  const existing = businessId ? businesses.find((item) => item.id === businessId) : undefined;
  const defaultBarangay =
    existing?.barangayId ?? (selectedBarangay === "all" ? MATNOG_BARANGAYS[0].code : selectedBarangay);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [barangayId, setBarangayId] = useState(defaultBarangay);
  const [ownerResidentId, setOwnerResidentId] = useState(existing?.ownerResidentId ?? "");
  const [businessName, setBusinessName] = useState(existing?.businessName ?? "");
  const [tradeName, setTradeName] = useState(existing?.tradeName ?? "");
  const [businessType, setBusinessType] = useState(existing?.businessType ?? "");
  const [ownership, setOwnership] = useState<BusinessOwnership | "">(existing?.ownership ?? "");
  const [contactNumber, setContactNumber] = useState(existing?.contactNumber ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [structureId, setStructureId] = useState(existing?.structureId ?? "");
  const [grossSalesBracket, setGrossSalesBracket] = useState(existing?.grossSalesBracket ?? "");
  const [employeeCount, setEmployeeCount] = useState(String(existing?.employeeCount ?? 1));

  const candidates = residents
    .filter((item) => item.address.barangayId === barangayId && item.residentStatus === "Active")
    .filter(
      (item) =>
        !search.trim() || `${item.lrn} ${formatResidentName(item)}`.toLowerCase().includes(search.toLowerCase()),
    )
    .slice(0, 12);
  const owner = residents.find((item) => item.id === ownerResidentId);
  const availableStructures = structures.filter((item) => item.barangayId === barangayId);
  const structure = structures.find((item) => item.id === structureId);

  const validate = (current: number) => {
    if (current === 0 && !ownerResidentId) return "Select the registered resident owner before continuing.";
    if (current === 1 && (!businessName.trim() || !businessType || !ownership || !contactNumber.trim()))
      return "Complete all required business details before continuing.";
    if (current === 2 && (!structureId || !grossSalesBracket || !employeeCount || Number(employeeCount) < 1))
      return "Select a registered structure and complete the business classification.";
    return "";
  };
  const next = () => {
    const message = validate(step);
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
      const message = validate(index);
      if (message) {
        setError(message);
        setStep(index);
        return;
      }
    }
    if (!ownerResidentId || !structureId || !ownership) return;
    const input = {
      businessName: businessName.trim(),
      tradeName: tradeName.trim(),
      businessType,
      ownership,
      ownerResidentId,
      structureId,
      barangayId,
      contactNumber: contactNumber.trim(),
      email: email.trim(),
      grossSalesBracket,
      employeeCount: Number(employeeCount),
    };
    const saved = businessId ? updateBusiness(businessId, input) : registerBusiness(input);
    if (saved) router.push(`/barangay-affairs/businesses/${saved.id}`);
  };

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${businessStyles.businessHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>{businessId ? "Update Business" : "Register Business"}</h1>
            <p>
              {businessId
                ? "Review and update the connected owner, location, and business classification."
                : "Create a connected registry record for the owner, establishment, structure, and operating classification."}
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link
              className={styles.btnSecondary}
              href={
                businessId ? `/barangay-affairs/businesses/${businessId}` : "/barangay-affairs/businesses/masterlist"
              }
            >
              <ChevronLeft size={16} /> Cancel
            </Link>
          </div>
        </div>
      </section>
      <div className={styles.body}>
        <div className={styles.formCentered}>
          {error && <div className={`${styles.toast} ${styles.error}`}>{error}</div>}
          <form className={`${styles.card} ${styles.formCard}`} onSubmit={submit} noValidate>
            <div className={`${styles.stepper} ${styles.stepperFour}`}>
              {steps.map((label, index) => (
                <button
                  type="button"
                  key={label}
                  className={`${styles.step} ${index === step ? styles.stepActive : ""} ${index < step ? styles.stepDone : ""}`}
                  onClick={() => (index <= step ? setStep(index) : index === step + 1 ? next() : undefined)}
                >
                  <span className={styles.stepNumber}>{index < step ? <Check size={12} /> : index + 1}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <div className={styles.formBody}>
              {step === 0 && (
                <>
                  <h2 className={styles.sectionTitle}>Select owner and barangay</h2>
                  <p className={styles.sectionHelp}>
                    Choose the barangay first, then search the permanent resident registry for the business owner.
                  </p>
                  <div className={styles.formGrid}>
                    <SelectField
                      label="Barangay"
                      value={barangayId}
                      placeholder="Select barangay"
                      options={MATNOG_BARANGAYS.map((item) => [item.code, item.name])}
                      onChange={(value) => {
                        setBarangayId(value);
                        setOwnerResidentId("");
                        setStructureId("");
                      }}
                    />
                    <label className={styles.searchBox}>
                      <Search size={15} />
                      <input
                        aria-label="Search resident owner"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search owner by name or LRN"
                      />
                    </label>
                  </div>
                  <div className={styles.residentPicker}>
                    {candidates.map((item) => {
                      const selected = item.id === ownerResidentId;
                      return (
                        <button
                          type="button"
                          key={item.id}
                          className={`${styles.residentPick} ${selected ? styles.residentPicked : ""}`}
                          onClick={() => {
                            setOwnerResidentId(item.id);
                            setContactNumber(item.contact.primaryMobile);
                            setError("");
                          }}
                        >
                          <span className={styles.pickCheck}>{selected ? <Check size={13} /> : null}</span>
                          <span>
                            <strong>{formatResidentName(item)}</strong>
                            <small>
                              {item.lrn} ·{" "}
                              {item.address.street ||
                                item.address.purok ||
                                `Brgy. ${barangayName(item.address.barangayId)}`}
                            </small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className={`${styles.lrnBox} ${businessStyles.wizardSummary}`}>
                    <UserRound size={21} />
                    <div>
                      <strong>{owner ? formatResidentName(owner) : "No owner selected"}</strong>
                      <small>
                        {owner
                          ? `${owner.lrn} · Brgy. ${barangayName(owner.address.barangayId)}`
                          : "Select an active resident from the registry."}
                      </small>
                    </div>
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <h2 className={styles.sectionTitle}>Business details</h2>
                  <p className={styles.sectionHelp}>
                    Record the establishment name, activity, ownership, and contact information.
                  </p>
                  <div className={styles.formGrid}>
                    <label className={styles.field}>
                      <span>
                        Registered business name<b className={styles.requiredMark}> *</b>
                      </span>
                      <input
                        value={businessName}
                        onChange={(event) => setBusinessName(event.target.value)}
                        placeholder="e.g. Matnog Coastal Trading"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Trade name</span>
                      <input
                        value={tradeName}
                        onChange={(event) => setTradeName(event.target.value)}
                        placeholder="Name displayed to customers"
                      />
                    </label>
                    <SelectField
                      label="Business activity"
                      value={businessType}
                      placeholder="Select business activity"
                      options={BUSINESS_TYPES.map((item) => [item, item])}
                      onChange={setBusinessType}
                    />
                    <SelectField
                      label="Ownership"
                      value={ownership}
                      placeholder="Select ownership type"
                      options={ownerships.map((item) => [item, item])}
                      onChange={(value) => setOwnership(value as BusinessOwnership)}
                    />
                    <label className={styles.field}>
                      <span>
                        Contact number<b className={styles.requiredMark}> *</b>
                      </span>
                      <input
                        value={contactNumber}
                        onChange={(event) => setContactNumber(event.target.value)}
                        placeholder="09XX XXX XXXX"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Email address</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="business@example.ph"
                      />
                    </label>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <h2 className={styles.sectionTitle}>Location and classification</h2>
                  <p className={styles.sectionHelp}>
                    Link the business to a registered structure and record its operating size.
                  </p>
                  <div className={styles.formGrid}>
                    <SelectField
                      label="Registered structure"
                      value={structureId}
                      placeholder="Select business structure"
                      options={availableStructures.map((item) => [
                        item.id,
                        `${item.structureCode} · ${item.houseNumber} ${item.street || item.purok || item.sitio}`,
                      ])}
                      onChange={setStructureId}
                    />
                    <SelectField
                      label="Gross sales bracket"
                      value={grossSalesBracket}
                      placeholder="Select gross sales bracket"
                      options={GROSS_SALES_BRACKETS.map((item) => [item, item])}
                      onChange={setGrossSalesBracket}
                    />
                    <label className={styles.field}>
                      <span>
                        Number of employees<b className={styles.requiredMark}> *</b>
                      </span>
                      <input
                        min="1"
                        type="number"
                        value={employeeCount}
                        onChange={(event) => setEmployeeCount(event.target.value)}
                        placeholder="e.g. 5"
                      />
                    </label>
                  </div>
                  <div className={`${styles.lrnBox} ${businessStyles.wizardSummary}`}>
                    <MapPin size={21} />
                    <div>
                      <strong>{structure?.structureCode ?? "No structure selected"}</strong>
                      <small>
                        {structure
                          ? `${structure.houseNumber} ${structure.street || structure.purok || structure.sitio} · ${structure.latitude.toFixed(5)}, ${structure.longitude.toFixed(5)}`
                          : `${availableStructures.length} registered structures available in Brgy. ${barangayName(barangayId)}.`}
                      </small>
                    </div>
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <h2 className={styles.sectionTitle}>Review and save</h2>
                  <p className={styles.sectionHelp}>
                    Confirm the owner, establishment, structure, and classification before saving the registry record.
                  </p>
                  <div className={styles.formGrid}>
                    <ReviewField label="Registered owner" value={owner ? formatResidentName(owner) : "Required"} />
                    <ReviewField label="LRN" value={owner?.lrn ?? "Required"} />
                    <ReviewField label="Barangay" value={barangayName(barangayId)} />
                    <ReviewField label="Business name" value={businessName} />
                    <ReviewField label="Trade name" value={tradeName || "None"} />
                    <ReviewField label="Business activity" value={businessType} />
                    <ReviewField label="Ownership" value={ownership} />
                    <ReviewField label="Contact number" value={contactNumber} />
                    <ReviewField label="Email address" value={email || "None"} />
                    <ReviewField label="Structure" value={structure?.structureCode ?? "Required"} />
                    <ReviewField label="Gross sales bracket" value={grossSalesBracket} />
                    <ReviewField label="Employees" value={employeeCount} />
                  </div>
                  <div className={`${styles.lrnBox} ${businessStyles.wizardSummary}`}>
                    <BadgeCheck size={21} />
                    <div>
                      <strong>Ready to save</strong>
                      <small>
                        Fee assessment and clearance processing begin after the business registry record is saved.
                      </small>
                    </div>
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
                <button type="button" className={styles.primaryButton} onClick={next}>
                  Continue <ChevronRight size={14} />
                </button>
              ) : (
                <button type="submit" className={styles.primaryButton}>
                  <Save size={14} /> {businessId ? "Save changes" : "Register business"}
                </button>
              )}
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
}
