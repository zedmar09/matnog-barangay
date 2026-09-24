"use client";

import { type FormEvent, useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Check, ChevronLeft, ChevronRight, Info, Save, ShieldCheck, UserPlus } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

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

function RequiredMark() {
  return <span style={{ color: "#dc2626", fontWeight: 700 }}> *</span>;
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
        {required && <RequiredMark />}
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

function ShadcnSelectField({
  label,
  value,
  onChange,
  options,
  required = false,
  placeholder = "Select",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <Field label={label} required={required}>
      <Select value={value} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">{placeholder}</SelectItem>
          {options.map((v) => (
            <SelectItem key={v} value={v}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

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
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <h1>{editing ? "Edit Resident" : "Register Resident"}</h1>
            <p>
              {editing
                ? "Update the resident's identity and contact details. The LRN remains permanent."
                : "Create one municipal resident identity record. Required fields are marked with *."}
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link
              className={styles.btnSecondary}
              href={resident ? `/barangay-affairs/residents/${resident.id}` : "/barangay-affairs/residents/masterlist"}
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
                  <p className={styles.sectionHelp}>Enter the resident&#39;s legal name and structured place of birth.</p>
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
                    <Field label="First name" required value={data.firstName} onChange={(v) => set("firstName", v)} placeholder="e.g. Juan" />
                    <Field label="Middle name" value={data.middleName} onChange={(v) => set("middleName", v)} placeholder="e.g. Santos" />
                    <Field label="Last name" required value={data.lastName} onChange={(v) => set("lastName", v)} placeholder="e.g. Dela Cruz" />
                    <ShadcnSelectField
                      label="Suffix"
                      value={data.suffix}
                      onChange={(v) => set("suffix", v)}
                      options={["Jr.", "Sr.", "II", "III", "IV", "V"]}
                      placeholder="None"
                    />
                    <Field label="Nickname / alias" value={data.nickname} onChange={(v) => set("nickname", v)} placeholder="e.g. Jun" />
                    <Field
                      label="Previous / married last name"
                      value={data.previousLastName}
                      onChange={(v) => set("previousLastName", v)}
                      placeholder="e.g. Reyes"
                    />
                    <Field
                      label="Mother's maiden name"
                      value={data.mothersMaidenName}
                      onChange={(v) => set("mothersMaidenName", v)}
                      placeholder="e.g. Garcia"
                    />
                    <ShadcnSelectField
                      label="Gender"
                      required
                      value={data.gender}
                      onChange={(v) => set("gender", v)}
                      options={["Male", "Female"]}
                      placeholder="Select gender"
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
                      placeholder="e.g. Matnog"
                    />
                    <Field label="Birth barangay" value={data.birthBarangay} onChange={(v) => set("birthBarangay", v)} placeholder="e.g. Bolo" />
                    <Field
                      label="Birth municipality / city"
                      value={data.birthMunicipality}
                      onChange={(v) => set("birthMunicipality", v)}
                      placeholder="e.g. Matnog"
                    />
                    <Field label="Birth province" value={data.birthProvince} onChange={(v) => set("birthProvince", v)} placeholder="e.g. Sorsogon" />
                    <Field label="Birth region" value={data.birthRegion} onChange={(v) => set("birthRegion", v)} placeholder="e.g. Bicol Region" />
                    <Field label="Birth country" value={data.birthCountry} onChange={(v) => set("birthCountry", v)} placeholder="e.g. Philippines" />
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <h2 className={styles.sectionTitle}>Civil, citizenship, and contact</h2>
                  <p className={styles.sectionHelp}>Contact fields are optional. Registration can continue without them.</p>
                  <div className={styles.formGrid}>
                    <ShadcnSelectField
                      label="Civil status"
                      required
                      value={data.civilStatus}
                      onChange={(v) => set("civilStatus", v)}
                      options={["Single", "Married", "Widowed", "Separated", "Divorced", "Other"]}
                      placeholder="Select civil status"
                    />
                    <Field
                      label="Primary citizenship"
                      required
                      value={data.primaryCitizenship}
                      onChange={(v) => set("primaryCitizenship", v)}
                      placeholder="e.g. Filipino"
                    />
                    <Field
                      label="Secondary citizenship"
                      value={data.secondaryCitizenship}
                      onChange={(v) => set("secondaryCitizenship", v)}
                      placeholder="e.g. American"
                    />
                    <Field
                      label="Primary mobile number"
                      type="tel"
                      value={data.contact.primaryMobile}
                      onChange={(v) => setContact("primaryMobile", v)}
                      placeholder="e.g. 09171234567"
                    />
                    <Field
                      label="Secondary mobile number"
                      type="tel"
                      value={data.contact.secondaryMobile}
                      onChange={(v) => setContact("secondaryMobile", v)}
                      placeholder="e.g. 09181234567"
                    />
                    <Field
                      label="Landline"
                      type="tel"
                      value={data.contact.landline}
                      onChange={(v) => setContact("landline", v)}
                      placeholder="e.g. (056) 123-4567"
                    />
                    <Field
                      label="Email address"
                      type="email"
                      value={data.contact.email}
                      onChange={(v) => setContact("email", v)}
                      placeholder="e.g. juan@email.com"
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
                    <ShadcnSelectField
                      label="Employment status"
                      value={data.employmentStatus}
                      onChange={(v) => set("employmentStatus", v)}
                      options={["Employed", "Self-employed", "Unemployed", "Student", "Retired", "Not Applicable", "Other"]}
                      placeholder="Select employment status"
                    />
                    <Field label="Occupation" value={data.occupation} onChange={(v) => set("occupation", v)} placeholder="e.g. Farmer" />
                    <Field
                      label="Employer / business name"
                      value={data.employerName}
                      onChange={(v) => set("employerName", v)}
                      placeholder="e.g. LGU Matnog"
                    />
                    <Field
                      label="Workplace / business address"
                      className={styles.span3}
                      value={data.workplaceAddress}
                      onChange={(v) => set("workplaceAddress", v)}
                      placeholder="e.g. Municipal Hall, Matnog, Sorsogon"
                    />
                    <Field label="Region" value={data.address.region} onChange={(v) => setAddress("region", v)} placeholder="e.g. Bicol Region" />
                    <Field label="Province" value={data.address.province} onChange={(v) => setAddress("province", v)} placeholder="e.g. Sorsogon" />
                    <Field
                      label="Municipality / city"
                      value={data.address.municipality}
                      onChange={(v) => setAddress("municipality", v)}
                      placeholder="e.g. Matnog"
                    />
                    <Field label="Barangay" required>
                      <Select
                        value={data.address.barangayId}
                        onValueChange={(v) => setAddress("barangayId", v === "__none__" ? "" : v)}
                      >
                        <SelectTrigger aria-label="Barangay">
                          <SelectValue placeholder="Select a barangay" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select a barangay</SelectItem>
                          {MATNOG_BARANGAYS.map((b) => (
                            <SelectItem key={b.code} value={b.code}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    {(
                      [
                        ["district", "District", "e.g. District 1"],
                        ["purok", "Purok", "e.g. Purok 1"],
                        ["sitio", "Sitio", "e.g. Centro"],
                        ["zone", "Zone", "e.g. Zone 1"],
                        ["subdivision", "Subdivision / village", "e.g. Matnog Village"],
                        ["street", "Street", "e.g. Rizal St."],
                        ["buildingName", "Building name", "e.g. Municipal Bldg."],
                        ["houseUnit", "House / unit number", "e.g. Unit 3"],
                        ["lotNumber", "Lot number", "e.g. Lot 5"],
                        ["blockNumber", "Block number", "e.g. Block 2"],
                        ["phase", "Phase", "e.g. Phase 1"],
                        ["postalCode", "Postal code", "e.g. 4708"],
                        ["landmark", "Landmark / address notes", "e.g. Near municipal hall"],
                      ] as [keyof ResidentAddress, string, string][]
                    ).map(([key, label, ph]) => (
                      <Field
                        key={key}
                        label={label}
                        className={key === "landmark" ? styles.span2 : ""}
                        value={data.address[key]}
                        onChange={(v) => setAddress(key, v)}
                        placeholder={ph}
                      />
                    ))}
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <h2 className={styles.sectionTitle}>Sector indicators, PhilSys, and photo</h2>
                  <p className={styles.sectionHelp}>
                    Stores only a PWD indicator. Detailed sector information belongs in the sectoral registry.
                  </p>
                  <div className={styles.formGrid}>
                    <label className={styles.checkboxField}>
                      <input type="checkbox" checked={data.isPwd} onChange={(e) => set("isPwd", e.target.checked)} />{" "}
                      Resident has a PWD indicator
                    </label>
                    <ShadcnSelectField
                      label="Resident status"
                      value={data.residentStatus}
                      onChange={(v) => set("residentStatus", v as ResidentStatus)}
                      options={["Active", "Inactive", "Transferred Out", "Deceased", "Merged"]}
                      placeholder="Select status"
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
      </div>
    </div>
  );
}
