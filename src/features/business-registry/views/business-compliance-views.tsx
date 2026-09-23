"use client";

import { useMemo, useState } from "react";

import {
  BadgeCheck,
  Banknote,
  Building2,
  Calculator,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  Printer,
  ReceiptText,
  Search,
  ShieldCheck,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { GROSS_SALES_BRACKETS } from "../data/business-data";
import { useBusinessRegistryStore } from "../stores/business-store";
import type { BusinessRecord } from "../types/business";
import businessStyles from "./business.module.css";

const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);

function feeBreakdown(business: BusinessRecord) {
  const bracketIndex = Math.max(0, GROSS_SALES_BRACKETS.indexOf(business.grossSalesBracket));
  const baseFee = 200 + bracketIndex * 150;
  const clearanceFee = 100;
  const inspectionFee = ["Food Service", "Tourism and Accommodation", "Manufacturing"].includes(business.businessType)
    ? 150
    : 0;
  const employmentSurcharge = business.employeeCount > 10 ? 100 : 0;
  return {
    baseFee,
    clearanceFee,
    inspectionFee,
    employmentSurcharge,
    total: baseFee + clearanceFee + inspectionFee + employmentSurcharge,
  };
}

function RecordBadge({ status }: { status: string }) {
  const badgeClass = status === "Valid" ? styles.active : status === "Expired" ? styles.danger : styles.warning;
  return <span className={`${styles.badge} ${badgeClass}`}>{status}</span>;
}

export function BusinessAssessmentView() {
  const businesses = useBusinessRegistryStore((state) => state.businesses);
  const assessBusiness = useBusinessRegistryStore((state) => state.assessBusiness);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [query, setQuery] = useState("");
  const scoped = businesses.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const searchable = scoped.filter((item) =>
    `${item.businessName} ${item.businessNumber}`.toLowerCase().includes(query.toLowerCase()),
  );
  const initial = searchable.find((item) => item.assessedFee === 0) ?? searchable[0];
  const [selectedId, setSelectedId] = useState(initial?.id ?? "");
  const [notice, setNotice] = useState("");
  const selected = businesses.find((item) => item.id === selectedId) ?? initial;
  const residentMap = useMemo(() => new Map(residents.map((item) => [item.id, formatResidentName(item)])), [residents]);
  const breakdown = selected ? feeBreakdown(selected) : null;
  const unassessed = scoped.filter((item) => item.assessedFee === 0).length;

  const saveAssessment = () => {
    if (!selected || !breakdown) return;
    assessBusiness(selected.id, breakdown.total);
    setNotice(`${selected.businessNumber} was assessed at ${money(breakdown.total)} and moved to the payment queue.`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A9 Business Registry</p>
          <h1>Fee Assessment</h1>
          <p>Calculate barangay business fees using the approved schedule for {selectedBarangayName}.</p>
        </div>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Calculator size={18} />
          </span>
          <div>
            <strong>{unassessed}</strong>
            <span>Awaiting assessment</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ReceiptText size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.assessedFee > 0).length}</strong>
            <span>Assessed records</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Banknote size={18} />
          </span>
          <div>
            <strong>{money(scoped.reduce((sum, item) => sum + item.assessedFee, 0))}</strong>
            <span>Total assessed fees</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CheckCircle2 size={18} />
          </span>
          <div>
            <strong>
              {scoped.filter((item) => item.assessedFee > 0 && item.amountPaid >= item.assessedFee).length}
            </strong>
            <span>Fully paid assessments</span>
          </div>
        </div>
      </div>
      {notice ? (
        <div className={businessStyles.successNotice}>
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      ) : null}
      <div className={businessStyles.complianceWorkspace}>
        <section className={styles.card}>
          <div className={businessStyles.panelHeading}>
            <Search size={18} />
            <div>
              <strong>Select a business</strong>
              <small>Choose a record to calculate or review its assessment</small>
            </div>
          </div>
          <div className={businessStyles.recordSearch}>
            <Search size={14} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search business or registry number"
            />
          </div>
          <div className={businessStyles.assessmentList}>
            {searchable.slice(0, 80).map((item) => (
              <button
                type="button"
                key={item.id}
                className={selected?.id === item.id ? businessStyles.selectedRecord : ""}
                onClick={() => {
                  setSelectedId(item.id);
                  setNotice("");
                }}
              >
                <span className={businessStyles.businessIcon}>
                  <Building2 size={15} />
                </span>
                <div>
                  <strong>{item.businessName}</strong>
                  <small>
                    {item.businessNumber} · {barangayName(item.barangayId)}
                  </small>
                </div>
                <b>{item.assessedFee ? money(item.assessedFee) : "Unassessed"}</b>
              </button>
            ))}
          </div>
        </section>
        <section className={styles.card}>
          <div className={businessStyles.panelHeading}>
            <Calculator size={18} />
            <div>
              <strong>Assessment worksheet</strong>
              <small>Fee schedule applies consistently across all 40 barangays</small>
            </div>
          </div>
          {selected && breakdown ? (
            <>
              <div className={businessStyles.assessmentHeader}>
                <div>
                  <span>Business record</span>
                  <strong>{selected.businessName}</strong>
                  <small>
                    {selected.businessNumber} · {selected.businessType}
                  </small>
                </div>
                <div>
                  <span>Registered owner</span>
                  <strong>{residentMap.get(selected.ownerResidentId) ?? "Resident record"}</strong>
                  <small>
                    {barangayName(selected.barangayId)} · {selected.grossSalesBracket}
                  </small>
                </div>
              </div>
              <div className={businessStyles.feeLines}>
                <div>
                  <span>Barangay business fee</span>
                  <small>Based on declared gross sales bracket</small>
                  <strong>{money(breakdown.baseFee)}</strong>
                </div>
                <div>
                  <span>Clearance processing fee</span>
                  <small>Standard issuance and record control</small>
                  <strong>{money(breakdown.clearanceFee)}</strong>
                </div>
                <div>
                  <span>Inspection fee</span>
                  <small>Applied to regulated business activities</small>
                  <strong>{money(breakdown.inspectionFee)}</strong>
                </div>
                <div>
                  <span>Employment surcharge</span>
                  <small>Applied when staffing exceeds 10 employees</small>
                  <strong>{money(breakdown.employmentSurcharge)}</strong>
                </div>
              </div>
              <div className={businessStyles.assessmentTotal}>
                <span>
                  <b>Total assessment</b>
                  <small>Valid for the current clearance transaction</small>
                </span>
                <strong>{money(breakdown.total)}</strong>
              </div>
              <div className={businessStyles.assessmentNotes}>
                <ShieldCheck size={16} />
                <p>
                  The calculation uses the selected sales bracket, activity class, and employee count. Changes to the
                  business record require reassessment.
                </p>
              </div>
              <footer className={businessStyles.formFooter}>
                <div>
                  <ReceiptText size={16} />
                  <span>
                    <strong>
                      {selected.assessedFee
                        ? `Currently assessed: ${money(selected.assessedFee)}`
                        : "No saved assessment"}
                    </strong>
                    <small>Saving places this record in the collection queue.</small>
                  </span>
                </div>
                <button className={styles.primaryButton} type="button" onClick={saveAssessment}>
                  <Calculator size={14} /> {selected.assessedFee ? "Reassess fee" : "Save assessment"}
                </button>
              </footer>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export function BusinessClearanceView() {
  const businesses = useBusinessRegistryStore((state) => state.businesses);
  const issueClearance = useBusinessRegistryStore((state) => state.issueClearance);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [query, setQuery] = useState("");
  const scoped = businesses.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const queue = scoped.filter((item) => item.clearanceStatus !== "Valid" && item.status !== "Closed");
  const filtered = queue.filter((item) =>
    `${item.businessName} ${item.businessNumber}`.toLowerCase().includes(query.toLowerCase()),
  );
  const initial = filtered.find((item) => item.assessedFee > 0 && item.amountPaid >= item.assessedFee) ?? filtered[0];
  const [selectedId, setSelectedId] = useState(initial?.id ?? "");
  const [notice, setNotice] = useState("");
  const selected = businesses.find((item) => item.id === selectedId) ?? initial;
  const residentMap = useMemo(() => new Map(residents.map((item) => [item.id, formatResidentName(item)])), [residents]);
  const ready = queue.filter((item) => item.assessedFee > 0 && item.amountPaid >= item.assessedFee).length;

  const issue = () => {
    if (!selected) return;
    const result = issueClearance(selected.id);
    if (result) setNotice(`${result.clearanceNumber} was issued and queued for BPLS synchronization.`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A9 Business Registry</p>
          <h1>Barangay Business Clearances</h1>
          <p>Review payment readiness and issue controlled clearances for {selectedBarangayName}.</p>
        </div>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <FileCheck2 size={18} />
          </span>
          <div>
            <strong>{queue.length}</strong>
            <span>Clearance queue</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CheckCircle2 size={18} />
          </span>
          <div>
            <strong>{ready}</strong>
            <span>Ready for issuance</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <BadgeCheck size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.clearanceStatus === "Valid").length}</strong>
            <span>Valid clearances</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CircleAlert size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.clearanceStatus === "Expired").length}</strong>
            <span>Expired clearances</span>
          </div>
        </div>
      </div>
      {notice ? (
        <div className={businessStyles.successNotice}>
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      ) : null}
      <div className={businessStyles.clearanceGrid}>
        <section className={styles.card}>
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search clearance queue"
              />
            </div>
          </div>
          <div className={styles.resultsMeta}>
            <span>
              <strong>{filtered.length}</strong> records awaiting action
            </span>
            <span>{ready} payment-cleared</span>
          </div>
          <div className={businessStyles.clearanceList}>
            {filtered.slice(0, 80).map((item) => {
              const isReady = item.assessedFee > 0 && item.amountPaid >= item.assessedFee;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={selected?.id === item.id ? businessStyles.selectedRecord : ""}
                  onClick={() => {
                    setSelectedId(item.id);
                    setNotice("");
                  }}
                >
                  <span className={businessStyles.businessIcon}>
                    <FileCheck2 size={15} />
                  </span>
                  <div>
                    <strong>{item.businessName}</strong>
                    <small>
                      {item.businessNumber} · {barangayName(item.barangayId)}
                    </small>
                  </div>
                  <RecordBadge status={item.clearanceStatus} />
                  <b className={isReady ? businessStyles.readyText : businessStyles.holdText}>
                    {isReady
                      ? "Ready"
                      : item.assessedFee
                        ? `${money(item.assessedFee - item.amountPaid)} due`
                        : "Needs assessment"}
                  </b>
                </button>
              );
            })}
          </div>
        </section>
        <section className={styles.card}>
          <div className={businessStyles.panelHeading}>
            <FileCheck2 size={18} />
            <div>
              <strong>Clearance review</strong>
              <small>Preview the controlled document before issuance</small>
            </div>
          </div>
          {selected ? (
            <>
              <div className={businessStyles.readinessStrip}>
                <div className={selected.assessedFee > 0 ? businessStyles.checkDone : ""}>
                  <Calculator size={14} />
                  <span>
                    Assessment<b>{selected.assessedFee ? money(selected.assessedFee) : "Required"}</b>
                  </span>
                </div>
                <div
                  className={
                    selected.amountPaid >= selected.assessedFee && selected.assessedFee > 0
                      ? businessStyles.checkDone
                      : ""
                  }
                >
                  <Banknote size={14} />
                  <span>
                    Payment
                    <b>
                      {selected.amountPaid >= selected.assessedFee && selected.assessedFee > 0
                        ? "Paid in full"
                        : `${money(selected.amountPaid)} paid`}
                    </b>
                  </span>
                </div>
                <div>
                  <ShieldCheck size={14} />
                  <span>
                    BPLS handoff<b>After issuance</b>
                  </span>
                </div>
              </div>
              <div className={businessStyles.clearancePaper}>
                <header>
                  <span>Republic of the Philippines</span>
                  <strong>BARANGAY {barangayName(selected.barangayId).toUpperCase()}</strong>
                  <small>Municipality of Matnog, Province of Sorsogon</small>
                </header>
                <div className={businessStyles.documentTitle}>BARANGAY BUSINESS CLEARANCE</div>
                <p>
                  This certifies that the business described below is registered within this barangay and has complied
                  with the requirements recorded for the current transaction.
                </p>
                <dl>
                  <div>
                    <dt>Business name</dt>
                    <dd>{selected.businessName}</dd>
                  </div>
                  <div>
                    <dt>Registered owner</dt>
                    <dd>{residentMap.get(selected.ownerResidentId) ?? "Resident record"}</dd>
                  </div>
                  <div>
                    <dt>Business activity</dt>
                    <dd>{selected.businessType}</dd>
                  </div>
                  <div>
                    <dt>Registry number</dt>
                    <dd>{selected.businessNumber}</dd>
                  </div>
                  <div>
                    <dt>Clearance number</dt>
                    <dd>{selected.clearanceNumber || "Assigned upon issuance"}</dd>
                  </div>
                </dl>
                <footer>
                  <div>
                    <span>Barangay Captain</span>
                    <small>Authorized signatory</small>
                  </div>
                  <div className={businessStyles.qrPlaceholder}>
                    QR<small>Verification</small>
                  </div>
                </footer>
              </div>
              <div className={businessStyles.issueFooter}>
                <button className={styles.secondaryButton} type="button">
                  <Printer size={14} /> Print preview
                </button>
                <button
                  className={styles.primaryButton}
                  type="button"
                  disabled={
                    selected.clearanceStatus === "Valid" ||
                    selected.assessedFee <= 0 ||
                    selected.amountPaid < selected.assessedFee
                  }
                  onClick={issue}
                >
                  <BadgeCheck size={14} />
                  {selected.clearanceStatus === "Valid" ? "Clearance issued" : "Issue clearance"}
                </button>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
