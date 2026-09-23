"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { ArrowLeft, Check, FileBadge2, Printer, Save, Search, UserRound } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { calculateAge, formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useDocumentStore } from "../stores/document-store";
import type { DocumentTemplateCode, IssuedDocumentStatus } from "../types/document";
import documentStyles from "./document-issuance.module.css";

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

export function DocumentTemplateView({ type }: { type: string }) {
  const templates = useDocumentStore((state) => state.templates);
  const createDocument = useDocumentStore((state) => state.createDocument);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay } = useBarangayScope();
  const template = templates.find((item) => item.code === type);
  const [residentId, setResidentId] = useState("");
  const [residentSearch, setResidentSearch] = useState("");
  const [purpose, setPurpose] = useState(template?.defaultPurpose ?? "");
  const [issueDate, setIssueDate] = useState("2026-09-23");
  const [officialReceipt, setOfficialReceipt] = useState("");
  const [amountPaid, setAmountPaid] = useState(String(template?.fee ?? 0));
  const [punongBarangay, setPunongBarangay] = useState("Hon. Maria L. Santos");
  const [barangaySecretary, setBarangaySecretary] = useState("Ana P. Reyes");
  const [message, setMessage] = useState("");
  const [controlNumber, setControlNumber] = useState("");
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

  if (!template)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <FileBadge2 size={34} />
          <h1>Document template not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/documents">
            Return to document templates
          </Link>
        </div>
      </div>
    );

  const residentName = resident ? formatResidentName(resident) : "SELECT A RESIDENT";
  const barangayName = barangay?.name ?? "________________";
  const address = resident ? fullAddress(resident, barangayName) : "____________________________________________";
  const age = resident ? calculateAge(resident.birthDate) : "__";
  const save = (status: IssuedDocumentStatus) => {
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
      {message && <div className={styles.toast}>{message}</div>}
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A4 Document Template</p>
          <h1>{template.name}</h1>
          <p>Select one A1 resident record to populate the printable certificate.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/documents">
          <ArrowLeft size={15} /> Templates
        </Link>
      </header>
      <div className={documentStyles.editorGrid}>
        <aside className={`${styles.card} ${documentStyles.editorPanel}`}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Document details</p>
              <h2>Populate template</h2>
            </div>
            <span className={`${styles.badge} ${styles.info}`}>{template.shortCode}</span>
          </div>
          <label className={styles.field}>
            <span>Search resident</span>
            <div className={styles.searchBox}>
              <Search size={15} />
              <input
                aria-label="Search resident for document"
                value={residentSearch}
                onChange={(event) => setResidentSearch(event.target.value)}
                placeholder="Name, LRN, or mobile number"
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
            <button className={documentStyles.residentSelected} type="button" onClick={() => setResidentId("")}>
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
              <textarea rows={3} value={purpose} onChange={(event) => setPurpose(event.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Issue date</span>
              <input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
            </label>
            {template.requiresOr ? (
              <>
                <label className={styles.field}>
                  <span>Official receipt number</span>
                  <input
                    value={officialReceipt}
                    onChange={(event) => setOfficialReceipt(event.target.value)}
                    placeholder="OR-000000"
                  />
                </label>
                <label className={styles.field}>
                  <span>Amount paid</span>
                  <input
                    type="number"
                    min="0"
                    value={amountPaid}
                    onChange={(event) => setAmountPaid(event.target.value)}
                  />
                </label>
              </>
            ) : null}
            <label className={styles.field}>
              <span>Punong Barangay</span>
              <input value={punongBarangay} onChange={(event) => setPunongBarangay(event.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Barangay Secretary</span>
              <input value={barangaySecretary} onChange={(event) => setBarangaySecretary(event.target.value)} />
            </label>
          </div>
          <div className={styles.headerButtonGroup}>
            <button className={styles.secondaryButton} type="button" onClick={() => save("Draft")}>
              <Save size={15} /> Save draft
            </button>
            <button className={styles.primaryButton} type="button" onClick={() => save("Pending Review")}>
              <Check size={15} /> Submit for review
            </button>
          </div>
        </aside>
        <main>
          <div className={documentStyles.printActions}>
            <button className={styles.primaryButton} type="button" disabled={!resident} onClick={() => window.print()}>
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
                  Issued this <strong>{formatDate(issueDate)}</strong> at the Barangay Hall of Barangay {barangayName},
                  Matnog, Sorsogon.
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
                <span>Amount: {template.requiresOr ? `₱${Number(amountPaid || 0).toFixed(2)}` : "Free of charge"}</span>
              </footer>
            </article>
          </div>
        </main>
      </div>
    </div>
  );
}
