"use client";

import { type FormEvent, useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Check, ChevronLeft, ChevronRight, Info, Save, ShieldCheck } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
import type { Resident, ResidentAddress, ResidentContact, ResidentInput, ResidentStatus } from "../types/resident";
import { calculateAge, formatResidentAddress, formatResidentName, isSenior } from "../utils/resident-utils";

type Props = { resident?: Resident };
const steps = ["Identity & birth", "Civil & contact", "Work & address", "Indicators & photo", "Review & save"];
const emptyAddress: ResidentAddress = {
  region: "Bicol Region",
  province: "Sorsogon",
  municipality: "Matnog",
  barangayId: "",
  district: "",
  purok: "",
  sitio: "",
  zone: "",
  subdivision: "",
  street: "",
  buildingName: "",
  houseUnit: "",
  lotNumber: "",
  blockNumber: "",
  phase: "",
  postalCode: "4708",
  landmark: "",
};
const emptyContact: ResidentContact = { primaryMobile: "", secondaryMobile: "", landline: "", email: "" };

function makeInitial(resident: Resident | undefined, scope: string): ResidentInput {
  return resident
    ? {
        firstName: resident.firstName,
        middleName: resident.middleName,
        lastName: resident.lastName,
        suffix: resident.suffix,
        nickname: resident.nickname,
        previousLastName: resident.previousLastName,
        mothersMaidenName: resident.mothersMaidenName,
        birthDate: resident.birthDate,
        birthLocality: resident.birthLocality,
        birthBarangay: resident.birthBarangay,
        birthMunicipality: resident.birthMunicipality,
        birthProvince: resident.birthProvince,
        birthRegion: resident.birthRegion,
        birthCountry: resident.birthCountry,
        gender: resident.gender,
        civilStatus: resident.civilStatus,
        primaryCitizenship: resident.primaryCitizenship,
        secondaryCitizenship: resident.secondaryCitizenship,
        employmentStatus: resident.employmentStatus,
        occupation: resident.occupation,
        employerName: resident.employerName,
        workplaceAddress: resident.workplaceAddress,
        address: { ...resident.address },
        contact: { ...resident.contact },
        isPwd: resident.isPwd,
        residentStatus: resident.residentStatus,
        photoUrl: resident.photoUrl,
        philsysReference: resident.philsysStatus === "Not Provided" ? "" : "REFERENCE-ON-FILE",
      }
    : {
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
        nickname: "",
        previousLastName: "",
        mothersMaidenName: "",
        birthDate: "",
        birthLocality: "",
        birthBarangay: "",
        birthMunicipality: "Matnog",
        birthProvince: "Sorsogon",
        birthRegion: "Bicol Region",
        birthCountry: "Philippines",
        gender: "",
        civilStatus: "",
        primaryCitizenship: "Filipino",
        secondaryCitizenship: "",
        employmentStatus: "",
        occupation: "",
        employerName: "",
        workplaceAddress: "",
        address: { ...emptyAddress, barangayId: scope === "all" ? "" : scope },
        contact: { ...emptyContact },
        isPwd: false,
        residentStatus: "Active",
        photoUrl: "",
        philsysReference: "",
      };
}
function Field({
  label,
  required,
  value,
  onChange,
  type = "text",
  placeholder,
  children,
  help,
  className = "",
}: {
  label: string;
  required?: boolean;
  value?: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  children?: React.ReactNode;
  help?: string;
  className?: string;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the reusable control is supplied directly or through children.
    <label className={`${styles.field} ${className}`}>
      <span>
        {label}
        {required && " *"}
      </span>
      {children ?? (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          required={required}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )}{" "}
      {help && <small>{help}</small>}
    </label>
  );
}
const SelectField = ({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
}) => (
  <Field label={label} required={required}>
    <select value={value} required={required} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select</option>
      {options.map((v) => (
        <option key={v}>{v}</option>
      ))}
    </select>
  </Field>
);

export function ResidentFormView({ resident }: Props) {
  const editing = Boolean(resident);
  const router = useRouter();
  const { selectedBarangay } = useBarangayScope();
  const add = useResidentRegistryStore((s) => s.addResident);
  const update = useResidentRegistryStore((s) => s.updateResident);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ResidentInput>(() => makeInitial(resident, selectedBarangay));
  const [error, setError] = useState("");
  const age = calculateAge(data.birthDate);
  const barangay = MATNOG_BARANGAYS.find((b) => b.code === data.address.barangayId)?.name;
  const set = <K extends keyof ResidentInput>(key: K, value: ResidentInput[K]) =>
    setData((current) => ({ ...current, [key]: value }));
  const setAddress = <K extends keyof ResidentAddress>(key: K, value: ResidentAddress[K]) =>
    setData((current) => ({ ...current, address: { ...current.address, [key]: value } }));
  const setContact = <K extends keyof ResidentContact>(key: K, value: ResidentContact[K]) =>
    setData((current) => ({ ...current, contact: { ...current.contact, [key]: value } }));
  const validation = useMemo(() => {
    const missing: string[] = [];
    if (!data.firstName.trim()) missing.push("first name");
    if (!data.lastName.trim()) missing.push("last name");
    if (!data.birthDate) missing.push("birth date");
    if (!data.gender) missing.push("gender");
    if (!data.civilStatus) missing.push("civil status");
    if (!data.primaryCitizenship.trim()) missing.push("primary citizenship");
    if (!data.address.barangayId || data.address.barangayId === "all") missing.push("barangay");
    return missing;
  }, [data]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (validation.length) {
      setError(`Complete the required fields: ${validation.join(", ")}.`);
      setStep(
        validation.some((v) => ["first name", "last name", "birth date", "gender"].includes(v))
          ? 0
          : validation.some((v) => ["civil status", "primary citizenship"].includes(v))
            ? 1
            : 2,
      );
      return;
    }
    const saved = resident ? update(resident.id, data) : add(data);
    if (saved) router.push(`/barangay-affairs/residents/${saved.id}?saved=1`);
  };
  const photo = (file?: File) => {
    if (!file) return;
    if (file.size > 1_500_000) {
      setError("Choose a photo smaller than 1.5 MB for this session demo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("photoUrl", String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className={`${styles.page} ${styles.formShell}`}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A1 Resident Registry</p>
          <h1>{editing ? "Edit resident" : "Register resident"}</h1>
          <p>
            {editing
              ? "Update the resident’s identity and contact details. The LRN remains permanent."
              : "Create one municipal resident identity record. Required fields are marked with *."}
          </p>
        </div>
        <Link
          className={styles.secondaryButton}
          href={resident ? `/barangay-affairs/residents/${resident.id}` : "/barangay-affairs/residents/masterlist"}
        >
          <ChevronLeft size={15} /> Cancel
        </Link>
      </header>
      {error && <div className={`${styles.toast} ${styles.error}`}>{error}</div>}
      <form className={`${styles.card} ${styles.formCard}`} onSubmit={submit} noValidate>
        <div className={styles.stepper}>
          {steps.map((label, index) => (
            <button
              type="button"
              key={label}
              className={`${styles.step} ${index === step ? styles.stepActive : ""} ${index < step ? styles.stepDone : ""}`}
              onClick={() => setStep(index)}
            >
              <span className={styles.stepNumber}>{index < step ? <Check size={12} /> : index + 1}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className={styles.formBody}>
          {step === 0 && (
            <>
              <h2 className={styles.sectionTitle}>Personal and birth information</h2>
              <p className={styles.sectionHelp}>Enter the resident’s legal name and structured place of birth.</p>
              <div className={styles.formGrid}>
                {editing && (
                  <div className={`${styles.lrnBox} ${styles.span3}`}>
                    <ShieldCheck size={20} />
                    <div>
                      <strong>{resident?.lrn}</strong>
                      <small>Permanent Local Resident Number · read-only</small>
                    </div>
                  </div>
                )}
                {!editing && (
                  <div className={`${styles.lrnBox} ${styles.span3}`}>
                    <Info size={20} />
                    <div>
                      <strong>Local Resident Number</strong>
                      <small>Automatically generated upon registration</small>
                    </div>
                  </div>
                )}
                <Field label="First name" required value={data.firstName} onChange={(v) => set("firstName", v)} />
                <Field label="Middle name" value={data.middleName} onChange={(v) => set("middleName", v)} />
                <Field label="Last name" required value={data.lastName} onChange={(v) => set("lastName", v)} />
                <SelectField
                  label="Suffix"
                  value={data.suffix}
                  onChange={(v) => set("suffix", v)}
                  options={["Jr.", "Sr.", "II", "III", "IV", "V"]}
                />
                <Field label="Nickname / alias" value={data.nickname} onChange={(v) => set("nickname", v)} />
                <Field
                  label="Previous / married last name"
                  value={data.previousLastName}
                  onChange={(v) => set("previousLastName", v)}
                />
                <Field
                  label="Mother’s maiden name"
                  value={data.mothersMaidenName}
                  onChange={(v) => set("mothersMaidenName", v)}
                />
                <SelectField
                  label="Gender"
                  required
                  value={data.gender}
                  onChange={(v) => set("gender", v)}
                  options={["Male", "Female"]}
                />
                <Field
                  label="Birth date"
                  required
                  type="date"
                  value={data.birthDate}
                  onChange={(v) => set("birthDate", v)}
                />
                <div className={styles.derivedBox}>
                  <div>
                    <strong>{data.birthDate ? `${age} years old` : "Age calculated from birth date"}</strong>
                    <small>
                      {data.birthDate
                        ? isSenior(data.birthDate)
                          ? "Senior citizen"
                          : "Not a senior citizen"
                        : "Age is never entered manually"}
                    </small>
                  </div>
                </div>
                <Field
                  label="Birth place / locality"
                  value={data.birthLocality}
                  onChange={(v) => set("birthLocality", v)}
                />
                <Field label="Birth barangay" value={data.birthBarangay} onChange={(v) => set("birthBarangay", v)} />
                <Field
                  label="Birth municipality / city"
                  value={data.birthMunicipality}
                  onChange={(v) => set("birthMunicipality", v)}
                />
                <Field label="Birth province" value={data.birthProvince} onChange={(v) => set("birthProvince", v)} />
                <Field label="Birth region" value={data.birthRegion} onChange={(v) => set("birthRegion", v)} />
                <Field label="Birth country" value={data.birthCountry} onChange={(v) => set("birthCountry", v)} />
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h2 className={styles.sectionTitle}>Civil, citizenship, and contact</h2>
              <p className={styles.sectionHelp}>Contact fields are optional. Registration can continue without them.</p>
              <div className={styles.formGrid}>
                <SelectField
                  label="Civil status"
                  required
                  value={data.civilStatus}
                  onChange={(v) => set("civilStatus", v)}
                  options={["Single", "Married", "Widowed", "Separated", "Divorced", "Other"]}
                />
                <Field
                  label="Primary citizenship"
                  required
                  value={data.primaryCitizenship}
                  onChange={(v) => set("primaryCitizenship", v)}
                />
                <Field
                  label="Secondary citizenship"
                  value={data.secondaryCitizenship}
                  onChange={(v) => set("secondaryCitizenship", v)}
                />
                <Field
                  label="Primary mobile number"
                  type="tel"
                  value={data.contact.primaryMobile}
                  onChange={(v) => setContact("primaryMobile", v)}
                />
                <Field
                  label="Secondary mobile number"
                  type="tel"
                  value={data.contact.secondaryMobile}
                  onChange={(v) => setContact("secondaryMobile", v)}
                />
                <Field
                  label="Landline"
                  type="tel"
                  value={data.contact.landline}
                  onChange={(v) => setContact("landline", v)}
                />
                <Field
                  label="Email address"
                  type="email"
                  value={data.contact.email}
                  onChange={(v) => setContact("email", v)}
                />
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className={styles.sectionTitle}>Occupation and current address</h2>
              <p className={styles.sectionHelp}>
                Barangay is required. Detailed address fields remain optional where unavailable.
              </p>
              <div className={styles.formGrid}>
                <SelectField
                  label="Employment status"
                  value={data.employmentStatus}
                  onChange={(v) => set("employmentStatus", v)}
                  options={["Employed", "Self-employed", "Unemployed", "Student", "Retired", "Not Applicable", "Other"]}
                />
                <Field label="Occupation" value={data.occupation} onChange={(v) => set("occupation", v)} />
                <Field
                  label="Employer / business name"
                  value={data.employerName}
                  onChange={(v) => set("employerName", v)}
                />
                <Field
                  label="Workplace / business address"
                  className={styles.span3}
                  value={data.workplaceAddress}
                  onChange={(v) => set("workplaceAddress", v)}
                />
                <Field label="Region" value={data.address.region} onChange={(v) => setAddress("region", v)} />
                <Field label="Province" value={data.address.province} onChange={(v) => setAddress("province", v)} />
                <Field
                  label="Municipality / city"
                  value={data.address.municipality}
                  onChange={(v) => setAddress("municipality", v)}
                />
                <Field label="Barangay" required>
                  <select
                    value={data.address.barangayId}
                    required
                    onChange={(e) => setAddress("barangayId", e.target.value)}
                  >
                    <option value="">Select an actual barangay</option>
                    {MATNOG_BARANGAYS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </Field>
                {(
                  [
                    ["district", "District"],
                    ["purok", "Purok"],
                    ["sitio", "Sitio"],
                    ["zone", "Zone"],
                    ["subdivision", "Subdivision / village"],
                    ["street", "Street"],
                    ["buildingName", "Building name"],
                    ["houseUnit", "House / unit number"],
                    ["lotNumber", "Lot number"],
                    ["blockNumber", "Block number"],
                    ["phase", "Phase"],
                    ["postalCode", "Postal code"],
                    ["landmark", "Landmark / address notes"],
                  ] as [keyof ResidentAddress, string][]
                ).map(([key, label]) => (
                  <Field
                    key={key}
                    label={label}
                    className={key === "landmark" ? styles.span2 : ""}
                    value={data.address[key]}
                    onChange={(v) => setAddress(key, v)}
                  />
                ))}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className={styles.sectionTitle}>Sector indicators, PhilSys, and photo</h2>
              <p className={styles.sectionHelp}>
                A1 stores only a PWD indicator. Detailed sector information belongs in the sectoral registry.
              </p>
              <div className={styles.formGrid}>
                <label className={styles.checkboxField}>
                  <input type="checkbox" checked={data.isPwd} onChange={(e) => set("isPwd", e.target.checked)} />{" "}
                  Resident has a PWD indicator
                </label>
                <SelectField
                  label="Resident status"
                  value={data.residentStatus}
                  onChange={(v) => set("residentStatus", v as ResidentStatus)}
                  options={["Active", "Inactive", "Transferred Out", "Deceased", "Merged"]}
                />
                <Field
                  label="PhilSys reference"
                  value={data.philsysReference}
                  onChange={(v) => set("philsysReference", v)}
                  help="Optional. Resident registration can proceed without a PhilSys reference."
                  placeholder="Fictional development reference only"
                />
                <Field label="Resident photo" help="Optional, session-only preview. Maximum 1.5 MB.">
                  <input type="file" accept="image/*" onChange={(e) => photo(e.target.files?.[0])} />
                </Field>
                {data.photoUrl && (
                  <div className={styles.avatarLg}>
                    <Image src={data.photoUrl} alt="Resident preview" width={76} height={76} unoptimized />
                  </div>
                )}
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <h2 className={styles.sectionTitle}>Review and save</h2>
              <p className={styles.sectionHelp}>
                Confirm the identity record before saving it to this browser session.
              </p>
              <div className={styles.reviewGrid}>
                <section className={styles.reviewCard}>
                  <h3>Identity</h3>
                  <dl className={styles.dataList}>
                    <div className={styles.dataRow}>
                      <dt>Name</dt>
                      <dd>{formatResidentName(data as Resident) || "—"}</dd>
                    </div>
                    <div className={styles.dataRow}>
                      <dt>Birth date / age</dt>
                      <dd>{data.birthDate ? `${data.birthDate} · ${age} years old` : "—"}</dd>
                    </div>
                    <div className={styles.dataRow}>
                      <dt>Gender</dt>
                      <dd>{data.gender || "—"}</dd>
                    </div>
                    <div className={styles.dataRow}>
                      <dt>Civil status</dt>
                      <dd>{data.civilStatus || "—"}</dd>
                    </div>
                    <div className={styles.dataRow}>
                      <dt>Citizenship</dt>
                      <dd>{data.primaryCitizenship || "—"}</dd>
                    </div>
                  </dl>
                </section>
                <section className={styles.reviewCard}>
                  <h3>Residence</h3>
                  <dl className={styles.dataList}>
                    <div className={styles.dataRow}>
                      <dt>Barangay</dt>
                      <dd>{barangay || "Required"}</dd>
                    </div>
                    <div className={styles.dataRow}>
                      <dt>Address</dt>
                      <dd>{formatResidentAddress(data.address) || "—"}</dd>
                    </div>
                    <div className={styles.dataRow}>
                      <dt>Mobile</dt>
                      <dd>{data.contact.primaryMobile || "—"}</dd>
                    </div>
                    <div className={styles.dataRow}>
                      <dt>Occupation</dt>
                      <dd>{data.occupation || "—"}</dd>
                    </div>
                    <div className={styles.dataRow}>
                      <dt>PhilSys</dt>
                      <dd>{data.philsysReference ? "On File" : "Not Provided"}</dd>
                    </div>
                  </dl>
                </section>
              </div>
              {validation.length > 0 && (
                <p className={styles.error}>Required before saving: {validation.join(", ")}.</p>
              )}
            </>
          )}
        </div>
        <footer className={styles.formFooter}>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ChevronLeft size={14} /> Previous
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            >
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button type="submit" className={styles.primaryButton}>
              <Save size={14} /> {editing ? "Save changes" : "Register resident"}
            </button>
          )}
        </footer>
      </form>
    </div>
  );
}
