"use client";

import { type FormEvent, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Check, ChevronLeft, ChevronRight, MapPin, Save } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useHouseholdRegistryStore } from "../stores/household-registry-store";
import type { HouseholdStructureInput } from "../types/household";

const steps = ["Address and location", "GPS coordinates", "Dwelling and utilities", "Review and save"];
const materials = ["Concrete", "Mixed concrete and wood", "Wood", "Light materials"];
const tenures = ["Owned", "Rented", "Rent-free with consent", "Informal occupancy"];
const waterSources = ["Level III connection", "Community faucet", "Deep well", "Spring / protected source"];
const toiletFacilities = ["Water-sealed private", "Water-sealed shared", "Pit latrine", "None reported"];
const powerSources = ["Electric cooperative", "Solar", "Generator", "No regular connection"];
const wasteMethods = ["Barangay collection", "Municipal collection", "Composting", "Community disposal point"];
const internetOptions = ["Fixed broadband", "Mobile data", "Community access", "None"];

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
    // biome-ignore lint/a11y/noLabelWithoutControl: the reusable select control is supplied through children.
    <label className={styles.field}>
      <span>
        {label}
        {required ? <b className={styles.requiredMark}> *</b> : null}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
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

export function StructureFormView({
  id,
  returnTo,
  initialBarangayId,
}: {
  id?: string;
  returnTo?: string;
  initialBarangayId?: string;
}) {
  const editing = Boolean(id);
  const current = useHouseholdRegistryStore((state) =>
    id ? state.structures.find((item) => item.id === id) : undefined,
  );
  const addStructure = useHouseholdRegistryStore((state) => state.addStructure);
  const updateStructure = useHouseholdRegistryStore((state) => state.updateStructure);
  const { selectedBarangay } = useBarangayScope();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<HouseholdStructureInput>(
    current
      ? {
          barangayId: current.barangayId,
          purok: current.purok,
          sitio: current.sitio,
          zone: current.zone,
          street: current.street,
          houseNumber: current.houseNumber,
          latitude: current.latitude,
          longitude: current.longitude,
          dwelling: { ...current.dwelling },
        }
      : {
          barangayId: initialBarangayId ?? (selectedBarangay === "all" ? "" : selectedBarangay),
          purok: "",
          sitio: "",
          zone: "",
          street: "",
          houseNumber: "",
          latitude: 12.585,
          longitude: 124.081,
          dwelling: {
            constructionMaterial: "",
            tenure: "",
            waterSource: "",
            toiletFacility: "",
            powerSource: "",
            wasteDisposal: "",
            internetAccess: "",
          },
        },
  );
  const [error, setError] = useState("");
  const set = <K extends keyof HouseholdStructureInput>(key: K, value: HouseholdStructureInput[K]) =>
    setData((currentData) => ({ ...currentData, [key]: value }));
  const setDwelling = (key: keyof HouseholdStructureInput["dwelling"], value: string) =>
    setData((currentData) => ({ ...currentData, dwelling: { ...currentData.dwelling, [key]: value } }));
  const barangayName = MATNOG_BARANGAYS.find((barangay) => barangay.code === data.barangayId)?.name ?? "—";
  const formattedAddress = [
    data.houseNumber && `House ${data.houseNumber}`,
    data.street,
    data.zone,
    data.purok,
    data.sitio,
  ]
    .filter(Boolean)
    .join(", ");
  const cancelHref = id ? `/barangay-affairs/structures/${id}` : (returnTo ?? "/barangay-affairs/structures");

  const validateStep = (currentStep: number) => {
    if (currentStep === 0 && (!data.barangayId || !data.purok || !data.street || !data.houseNumber))
      return "Complete the required address fields before continuing.";
    if (currentStep === 1) {
      if (!data.latitude || !data.longitude) return "Enter the latitude and longitude before continuing.";
      if (data.latitude < 12.4 || data.latitude > 12.9 || data.longitude < 123.8 || data.longitude > 124.4)
        return "GPS coordinates must fall within the expected Matnog area for this prototype.";
    }
    if (currentStep === 2 && Object.values(data.dwelling).some((value) => !value))
      return "Complete every dwelling and utility field before continuing.";
    return "";
  };

  const continueStep = () => {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setStep((currentStep) => Math.min(steps.length - 1, currentStep + 1));
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
    const structure = id ? updateStructure(id, data) : addStructure(data);
    if (structure) {
      router.push(
        returnTo && !id
          ? `${returnTo}?structureId=${encodeURIComponent(structure.id)}`
          : `/barangay-affairs/structures/${structure.id}?saved=1`,
      );
    }
  };

  if (id && !current)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <MapPin size={34} />
          <h1>Structure not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/structures">
            Return to inventory
          </Link>
        </div>
      </div>
    );

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${styles.householdHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>{editing ? "Edit Structure" : "Register Structure"}</h1>
            <p>
              {editing
                ? "Update the structure's address, GPS coordinates, and dwelling information."
                : "Create one normalized record for a physical dwelling. Required fields are marked with *."}
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnSecondary} href={cancelHref}>
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
                  <h2 className={styles.sectionTitle}>Address and location</h2>
                  <p className={styles.sectionHelp}>
                    Record the normalized municipal address that households will use when linking to this structure.
                  </p>
                  <div className={styles.formGrid}>
                    <SelectField
                      label="Barangay"
                      required
                      value={data.barangayId}
                      placeholder="Select barangay"
                      options={MATNOG_BARANGAYS.map((barangay) => [barangay.code, barangay.name])}
                      onChange={(value) => set("barangayId", value)}
                    />
                    <label className={styles.field}>
                      <span>
                        Purok <b className={styles.requiredMark}>*</b>
                      </span>
                      <input
                        value={data.purok}
                        placeholder="e.g. Purok 2"
                        onChange={(event) => set("purok", event.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Sitio</span>
                      <input
                        value={data.sitio}
                        placeholder="e.g. Proper"
                        onChange={(event) => set("sitio", event.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Zone</span>
                      <input
                        value={data.zone}
                        placeholder="e.g. Zone 1"
                        onChange={(event) => set("zone", event.target.value)}
                      />
                    </label>
                    <label className={`${styles.field} ${styles.span2}`}>
                      <span>
                        Street / road <b className={styles.requiredMark}>*</b>
                      </span>
                      <input
                        value={data.street}
                        placeholder="e.g. Rizal Street"
                        onChange={(event) => set("street", event.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>
                        House number <b className={styles.requiredMark}>*</b>
                      </span>
                      <input
                        value={data.houseNumber}
                        placeholder="e.g. 24"
                        onChange={(event) => set("houseNumber", event.target.value)}
                      />
                    </label>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <h2 className={styles.sectionTitle}>GPS coordinates</h2>
                  <p className={styles.sectionHelp}>
                    Confirm one geographic point for the physical dwelling within the expected Matnog area.
                  </p>
                  <div className={styles.gpsEntry}>
                    <div className={styles.formGrid}>
                      <label className={styles.field}>
                        <span>
                          Latitude <b className={styles.requiredMark}>*</b>
                        </span>
                        <input
                          type="number"
                          step="0.000001"
                          value={data.latitude}
                          placeholder="e.g. 12.585000"
                          onChange={(event) => set("latitude", Number(event.target.value))}
                        />
                      </label>
                      <label className={styles.field}>
                        <span>
                          Longitude <b className={styles.requiredMark}>*</b>
                        </span>
                        <input
                          type="number"
                          step="0.000001"
                          value={data.longitude}
                          placeholder="e.g. 124.081000"
                          onChange={(event) => set("longitude", Number(event.target.value))}
                        />
                      </label>
                    </div>
                    <div className={styles.coordinatePreview}>
                      <MapPin size={22} />
                      <div>
                        <strong>Structure coordinate</strong>
                        <span>
                          {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className={styles.sectionTitle}>Dwelling and utilities</h2>
                  <p className={styles.sectionHelp}>
                    Record the structure's construction, occupancy arrangement, and access to basic services.
                  </p>
                  <div className={styles.formGrid}>
                    <SelectField
                      label="Construction material"
                      required
                      value={data.dwelling.constructionMaterial}
                      placeholder="Select material"
                      options={materials.map((value) => [value, value])}
                      onChange={(value) => setDwelling("constructionMaterial", value)}
                    />
                    <SelectField
                      label="Housing arrangement"
                      required
                      value={data.dwelling.tenure}
                      placeholder="Select arrangement"
                      options={tenures.map((value) => [value, value])}
                      onChange={(value) => setDwelling("tenure", value)}
                    />
                    <SelectField
                      label="Water source"
                      required
                      value={data.dwelling.waterSource}
                      placeholder="Select water source"
                      options={waterSources.map((value) => [value, value])}
                      onChange={(value) => setDwelling("waterSource", value)}
                    />
                    <SelectField
                      label="Toilet facility"
                      required
                      value={data.dwelling.toiletFacility}
                      placeholder="Select facility"
                      options={toiletFacilities.map((value) => [value, value])}
                      onChange={(value) => setDwelling("toiletFacility", value)}
                    />
                    <SelectField
                      label="Power source"
                      required
                      value={data.dwelling.powerSource}
                      placeholder="Select power source"
                      options={powerSources.map((value) => [value, value])}
                      onChange={(value) => setDwelling("powerSource", value)}
                    />
                    <SelectField
                      label="Waste disposal"
                      required
                      value={data.dwelling.wasteDisposal}
                      placeholder="Select method"
                      options={wasteMethods.map((value) => [value, value])}
                      onChange={(value) => setDwelling("wasteDisposal", value)}
                    />
                    <SelectField
                      label="Internet access"
                      required
                      value={data.dwelling.internetAccess}
                      placeholder="Select access"
                      options={internetOptions.map((value) => [value, value])}
                      onChange={(value) => setDwelling("internetAccess", value)}
                    />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className={styles.sectionTitle}>Review and save</h2>
                  <p className={styles.sectionHelp}>
                    Confirm the address, coordinates, and dwelling profile before saving.
                  </p>
                  <div className={styles.formGrid}>
                    <ReviewField label="Barangay" value={barangayName} />
                    <ReviewField label="Purok" value={data.purok || "—"} />
                    <ReviewField label="Sitio" value={data.sitio || "—"} />
                    <ReviewField label="Zone" value={data.zone || "—"} />
                    <ReviewField label="Street / road" value={data.street || "—"} />
                    <ReviewField label="House number" value={data.houseNumber || "—"} />
                    <ReviewField label="Normalized address" value={formattedAddress || "—"} className={styles.span3} />
                    <ReviewField label="Latitude" value={data.latitude.toFixed(6)} />
                    <ReviewField label="Longitude" value={data.longitude.toFixed(6)} />
                    <ReviewField label="Construction material" value={data.dwelling.constructionMaterial || "—"} />
                    <ReviewField label="Housing arrangement" value={data.dwelling.tenure || "—"} />
                    <ReviewField label="Water source" value={data.dwelling.waterSource || "—"} />
                    <ReviewField label="Toilet facility" value={data.dwelling.toiletFacility || "—"} />
                    <ReviewField label="Power source" value={data.dwelling.powerSource || "—"} />
                    <ReviewField label="Waste disposal" value={data.dwelling.wasteDisposal || "—"} />
                    <ReviewField label="Internet access" value={data.dwelling.internetAccess || "—"} />
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
                  setStep((currentStep) => Math.max(0, currentStep - 1));
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
                  <Save size={14} /> {editing ? "Save changes" : "Register structure"}
                </button>
              )}
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
}
