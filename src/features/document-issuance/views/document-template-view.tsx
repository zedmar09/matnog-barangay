"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  FileBadge2,
  Printer,
  Save,
  Search,
  UserRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { calculateAge, formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import dashboardStyles from "@/features/resident-registry/views/resident-dashboard.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useDocumentStore } from "../stores/document-store";
import type { DocumentTemplateCode, IssuedDocumentStatus } from "../types/document";
import documentStyles from "./document-issuance.module.css";

const steps = ["Select document type", "Populate template"];

function fullAddress(
  resident: ReturnType<typeof useResidentRegistryStore.getState>["residents"][number],
  barangayName: string,
) {
  return [
    resident.address.houseUnit,
    resident.address.street,
    resident.address.sitio,
    resident.address.purok,
    `Barangay ${barangayName}`,
    "Matnog, Sorsogon",
  ]
    .filter(Boolean)
    .join(", ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "long" }).format(new Date(`${value}T12:00:00+08:00`));
}

export function DocumentTemplateView({ type = "" }: { type?: string }) {
  const templates = useDocumentStore((state) => state.templates);
  const createDocument = useDocumentStore((state) => state.createDocument);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay } = useBarangayScope();
  const initialTemplate = templates.find((item) => item.code === type);
  const [step, setStep] = useState(0);
  const [templateCode, setTemplateCode] = useState<DocumentTemplateCode | "">(initialTemplate?.code ?? "");
  const [residentId, setResidentId] = useState("");
  const [residentSearch, setResidentSearch] = useState("");
  const [purpose, setPurpose] = useState(initialTemplate?.defaultPurpose ?? "");
  const [issueDate, setIssueDate] = useState("2026-09-23");
  const [officialReceipt, setOfficialReceipt] = useState("");
  const [amountPaid, setAmountPaid] = useState(String(initialTemplate?.fee ?? 0));
  const [punongBarangay, setPunongBarangay] = useState("Hon. Maria L. Santos");
  const [barangaySecretary, setBarangaySecretary] = useState("Ana P. Reyes");
  const [message, setMessage] = useState("");
  const [controlNumber, setControlNumber] = useState("");
  const template = templates.find((item) => item.code === templateCode);
  const resident = residents.find((item) => item.id === residentId);
  const barangay = MATNOG_BARANGAYS.find((item) => item.code === resident?.address.barangayId);
  const matches = useMemo(
    () =>
      residentSearch.trim().length < 2
        ? []
        : residents
            .filter(
              (item) =>
                item.residentStatus === "Active" &&
                (selectedBarangay === "all" || item.address.barangayId === selectedBarangay) &&
                `${formatResidentName(item)} ${item.lrn} ${item.contact.primaryMobile}`
                  .toLowerCase()
                  .includes(residentSearch.toLowerCase()),
            )
            .slice(0, 8),
    [residentSearch, residents, selectedBarangay],
  );

  const selectTemplate = (code: DocumentTemplateCode) => {
    const selected = templates.find((item) => item.code === code);
    if (!selected) return;
    setTemplateCode(code);
    setPurpose(selected.defaultPurpose);
    setAmountPaid(String(selected.fee));
    setOfficialReceipt("");
    setMessage("");
  };

  const continueStep = () => {
    if (!template) {
      setMessage("Select a document type before continuing.");
      return;
    }
    setMessage("");
    setStep(1);
  };

  const residentName = resident ? formatResidentName(resident) : "SELECT A RESIDENT";
  const barangayName = barangay?.name ?? "________________";
  const address = resident ? fullAddress(resident, barangayName) : "____________________________________________";
  const age = resident ? calculateAge(resident.birthDate) : "__";

  const save = (status: IssuedDocumentStatus) => {
    if (!template) {
      setMessage("Select a document type before saving this request.");
      setStep(0);
      return;
    }
    if (!resident) {
      setMessage("Select a resident before saving this document.");
      return;
    }
    const value = createDocument({
      templateCode: template.code as DocumentTemplateCode,
      residentId: resident.id,
      barangayId: resident.address.barangayId,
      purpose,
      issueDate,
      officialReceipt,
      amountPaid: Number(amountPaid) || 0,
      punongBarangay,
      barangaySecretary,
      status,
    });
    setControlNumber(value.controlNumber);
    setMessage(`${value.controlNumber} saved as ${status}.`);
  };

  const body = (() => {
    if (!template) return null;
    const commonIssue = (
      <p>
        This certification is issued upon the request of the above-named resident for{" "}
        <strong>{purpose || "the stated lawful purpose"}</strong>.
      </p>
    );
    if (template.code === "residency")
      return (
        <>
          <p>
            This is to certify that <strong>{residentName}</strong>, {age} years of age, is a bona fide resident of{" "}
            <strong>{address}</strong> and is known to be residing within Barangay {barangayName}, Municipality of
            Matnog, Province of Sorsogon.
          </p>
          {commonIssue}
        </>
      );
    if (template.code === "indigency")
      return (
        <>
          <p>
            This is to certify that <strong>{residentName}</strong>, {age} years of age, and a resident of{" "}
            <strong>{address}</strong>, belongs to an indigent family in this barangay based on available community
            records and assessment.
          </p>
          {commonIssue}
        </>
      );
    if (template.code === "good-moral")
      return (
        <>
          <p>
            This is to certify that <strong>{residentName}</strong>, {age} years of age, and a resident of{" "}
            <strong>{address}</strong>, is known in this community as a person of good moral character and standing.
          </p>
          {commonIssue}
        </>
      );
    if (template.code === "first-time-jobseeker")
      return (
        <>
          <p>
            This is to certify that <strong>{residentName}</strong>, {age} years of age, is a resident of{" "}
            <strong>{address}</strong> and has been identified as a qualified first-time jobseeker requesting this
            certification for employment documentary requirements.
          </p>
          {commonIssue}
        </>
      );
    if (template.code === "no-pending-case")
      return (
        <>
          <p>
            This is to certify that <strong>{residentName}</strong>, {age} years of age, and a resident of{" "}
            <strong>{address}</strong>, has no pending case recorded before the Lupong Tagapamayapa of Barangay{" "}
            {barangayName} as of the date of issuance.
          </p>
          {commonIssue}
        </>
      );
    return (
      <>
        <p>
          This is to certify that <strong>{residentName}</strong>, {age} years of age, and a resident of{" "}
          <strong>{address}</strong>, is known to this office and has no derogatory record filed in this barangay as of
          the date of issuance.
        </p>
        {commonIssue}
      </>
    );
  })();

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${dashboardStyles.documentHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>New Document Request</h1>
            <p>Select a document type, choose a resident, and prepare the populated barangay document.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnSecondary} href="/barangay-affairs/documents/requests">
              <ArrowLeft size={16} /> Cancel
            </Link>
          </div>
        </div>
      </section>

      <main className={styles.body}>
        <div className={documentStyles.documentWizardShell}>
          {message ? (
            <div className={`${styles.toast} ${message.includes("saved as") ? "" : styles.error}`}>{message}</div>
          ) : null}
          <section className={`${styles.card} ${styles.formCard}`}>
            <div className={`${styles.stepper} ${documentStyles.stepperTwo}`}>
              {steps.map((label, index) => (
                <button
                  type="button"
                  key={label}
                  className={`${styles.step} ${index === step ? styles.stepActive : ""} ${index < step ? styles.stepDone : ""}`}
                  onClick={() => (index === 0 ? setStep(0) : continueStep())}
                >
                  <span className={styles.stepNumber}>{index < step ? <Check size={12} /> : index + 1}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className={styles.formBody}>
              {step === 0 && (
                <>
                  <h2 className={styles.sectionTitle}>Select document type</h2>
                  <p className={styles.sectionHelp}>
                    Choose the certificate or clearance requested by the resident. Fees and receipt requirements are
                    shown on each option.
                  </p>
                  <div className={documentStyles.wizardTemplateGrid}>
                    {templates.map((item) => (
                      <button
                        className={`${documentStyles.templateCard} ${documentStyles.templateChoice} ${templateCode === item.code ? documentStyles.templateChoiceSelected : ""}`}
                        type="button"
                        key={item.code}
                        onClick={() => selectTemplate(item.code)}
                      >
                        <div className={documentStyles.templateTop}>
                          <span className={documentStyles.templateIcon}>
                            <FileBadge2 size={21} />
                          </span>
                          <span className={documentStyles.templateCode}>{item.shortCode}</span>
                        </div>
                        <h2>{item.name}</h2>
                        <p>{item.description}</p>
                        <span className={documentStyles.templateFee}>
                          {item.requiresOr
                            ? `₱${item.fee.toLocaleString()} · Official receipt required`
                            : "No fee required"}
                        </span>
                        <span className={documentStyles.openTemplate}>
                          {templateCode === item.code ? <Check size={14} /> : null}
                          {templateCode === item.code ? "Selected" : "Select document"}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 1 && template && (
                <>
                  <div className={documentStyles.populateHeading}>
                    <div>
                      <h2 className={styles.sectionTitle}>Populate template</h2>
                      <p className={styles.sectionHelp}>
                        Select a resident and complete the request details. The printable document updates
                        automatically.
                      </p>
                    </div>
                    <span className={`${styles.badge} ${styles.info}`}>
                      {template.shortCode} · {template.name}
                    </span>
                  </div>
                  <div className={documentStyles.editorGrid}>
                    <aside className={documentStyles.editorPanel}>
                      <label className={styles.field}>
                        <span>Search resident</span>
                        <div className={`${styles.searchBox} ${documentStyles.residentSearch}`}>
                          <Search size={15} />
                          <input
                            aria-label="Search resident for document"
                            value={residentSearch}
                            onChange={(event) => setResidentSearch(event.target.value)}
                            placeholder="Search by name, LRN, or mobile number"
                          />
                        </div>
                      </label>
                      {matches.length > 0 && !resident ? (
                        <div className={documentStyles.residentResults}>
                          {matches.map((item) => (
                            <button
                              className={documentStyles.residentResult}
                              type="button"
                              key={item.id}
                              onClick={() => {
                                setResidentId(item.id);
                                setResidentSearch("");
                                setMessage("");
                              }}
                            >
                              <span>
                                <strong>{formatResidentName(item)}</strong>
                                <small>
                                  {item.lrn} · Brgy.{" "}
                                  {MATNOG_BARANGAYS.find((record) => record.code === item.address.barangayId)?.name}
                                </small>
                              </span>
                              <UserRound size={16} />
                            </button>
                          ))}
                        </div>
                      ) : null}
                      {resident ? (
                        <button
                          className={documentStyles.residentSelected}
                          type="button"
                          onClick={() => setResidentId("")}
                        >
                          <span>
                            <strong>{formatResidentName(resident)}</strong>
                            <small>
                              {resident.lrn} · Brgy. {barangayName}
                            </small>
                          </span>
                          <small>Change</small>
                        </button>
                      ) : null}
                      <div className={documentStyles.formStack}>
                        <label className={styles.field}>
                          <span>Purpose</span>
                          <textarea
                            rows={3}
                            value={purpose}
                            onChange={(event) => setPurpose(event.target.value)}
                            placeholder="Enter the purpose of this document request"
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Issue date</span>
                          <input
                            type="date"
                            value={issueDate}
                            onChange={(event) => setIssueDate(event.target.value)}
                            placeholder="Select issue date"
                          />
                        </label>
                        {template.requiresOr ? (
                          <>
                            <label className={styles.field}>
                              <span>Official receipt number</span>
                              <input
                                value={officialReceipt}
                                onChange={(event) => setOfficialReceipt(event.target.value)}
                                placeholder="e.g. OR-000000"
                              />
                            </label>
                            <label className={styles.field}>
                              <span>Amount paid</span>
                              <input
                                type="number"
                                min="0"
                                value={amountPaid}
                                onChange={(event) => setAmountPaid(event.target.value)}
                                placeholder="Enter amount paid"
                              />
                            </label>
                          </>
                        ) : null}
                        <label className={styles.field}>
                          <span>Punong Barangay</span>
                          <input
                            value={punongBarangay}
                            onChange={(event) => setPunongBarangay(event.target.value)}
                            placeholder="Enter the Punong Barangay name"
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Barangay Secretary</span>
                          <input
                            value={barangaySecretary}
                            onChange={(event) => setBarangaySecretary(event.target.value)}
                            placeholder="Enter the Barangay Secretary name"
                          />
                        </label>
                      </div>
                    </aside>
                    <div>
                      <div className={documentStyles.printActions}>
                        <button
                          className={styles.primaryButton}
                          type="button"
                          disabled={!resident}
                          onClick={() => window.print()}
                        >
                          <Printer size={15} /> Print / Save as PDF
                        </button>
                      </div>
                      <div className={documentStyles.paperWrap}>
                        <article className={documentStyles.paper} data-barangay-document-sheet>
                          <header className={documentStyles.letterhead}>
                            <div className={documentStyles.seal}>
                              MATNOG
                              <br />
                              LGU
                            </div>
                            <div>
                              <span>Republic of the Philippines</span>
                              <strong>Province of Sorsogon</strong>
                              <strong>Municipality of Matnog</strong>
                              <strong>Barangay {barangayName}</strong>
                              <strong className={documentStyles.officeTitle}>Office of the Punong Barangay</strong>
                            </div>
                            <div className={documentStyles.seal}>
                              BARANGAY
                              <br />
                              SEAL
                            </div>
                          </header>
                          <h1 className={documentStyles.documentTitle}>{template.name.toUpperCase()}</h1>
                          <section className={documentStyles.documentBody}>
                            <p>TO WHOM IT MAY CONCERN:</p>
                            {body}
                            <p>
                              Issued this <strong>{formatDate(issueDate)}</strong> at the Barangay Hall of Barangay{" "}
                              {barangayName}, Matnog, Sorsogon.
                            </p>
                          </section>
                          <section className={documentStyles.signatureBlock}>
                            <div>
                              <span>Prepared by:</span>
                              <div className={documentStyles.signature}>
                                <strong>{barangaySecretary}</strong>
                                <span>Barangay Secretary</span>
                              </div>
                            </div>
                            <div>
                              <span>Approved by:</span>
                              <div className={documentStyles.signature}>
                                <strong>{punongBarangay}</strong>
                                <span>Punong Barangay</span>
                              </div>
                            </div>
                          </section>
                          <footer className={documentStyles.documentFooter}>
                            <span>Resident LRN: {resident?.lrn ?? "—"}</span>
                            <span>Control No.: {controlNumber || "Generated upon save"}</span>
                            <span>O.R. No.: {officialReceipt || (template.requiresOr ? "—" : "No fee")}</span>
                            <span>
                              Amount:{" "}
                              {template.requiresOr ? `₱${Number(amountPaid || 0).toFixed(2)}` : "Free of charge"}
                            </span>
                          </footer>
                        </article>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <footer className={styles.formFooter}>
              {step === 0 ? (
                <Link className={styles.secondaryButton} href="/barangay-affairs/documents/requests">
                  <ChevronLeft size={14} /> Back to requests
                </Link>
              ) : (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    setMessage("");
                    setStep(0);
                  }}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
              )}
              {step === 0 ? (
                <button type="button" className={styles.primaryButton} onClick={continueStep}>
                  Continue <ChevronRight size={14} />
                </button>
              ) : (
                <div className={documentStyles.wizardActions}>
                  <button className={styles.secondaryButton} type="button" onClick={() => save("Draft")}>
                    <Save size={15} /> Save draft
                  </button>
                  <button className={styles.primaryButton} type="button" onClick={() => save("Pending Review")}>
                    <Check size={15} /> Submit for review
                  </button>
                </div>
              )}
            </footer>
          </section>
        </div>
      </main>
    </div>
  );
}
