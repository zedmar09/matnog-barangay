"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileCheck2,
  History,
  RefreshCcw,
  Search,
  ShieldAlert,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useBusinessRegistryStore } from "../stores/business-store";
import type { BusinessRecord } from "../types/business";
import businessStyles from "./business.module.css";

const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);

const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;

const dateLabel = (value: string) =>
  value
    ? new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "short", day: "numeric" }).format(
        new Date(`${value}T00:00:00`),
      )
    : "Not set";

const daysFromToday = (value: string) => {
  const target = new Date(`${value}T00:00:00`).getTime();
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`).getTime();
  return Math.ceil((target - today) / 86_400_000);
};

function renewalStage(item: BusinessRecord) {
  if (item.status === "Active") return { label: "Upcoming", tone: businessStyles.infoPill };
  if (item.assessedFee <= 0) return { label: "For assessment", tone: businessStyles.warningPill };
  if (item.amountPaid < item.assessedFee) return { label: "Payment due", tone: businessStyles.warningPill };
  return { label: "Ready for clearance", tone: businessStyles.successPill };
}

export function BusinessRenewalsView() {
  const businesses = useBusinessRegistryStore((state) => state.businesses);
  const startRenewal = useBusinessRegistryStore((state) => state.startRenewal);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"In progress" | "Upcoming" | "All">("In progress");
  const [notice, setNotice] = useState("");

  const residentMap = useMemo(() => new Map(residents.map((item) => [item.id, formatResidentName(item)])), [residents]);
  const scoped = businesses.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const inProgress = scoped.filter((item) => item.status === "For renewal");
  const upcoming = scoped.filter(
    (item) =>
      item.status === "Active" &&
      item.clearanceStatus === "Valid" &&
      Boolean(item.clearanceValidUntil) &&
      daysFromToday(item.clearanceValidUntil) <= 120,
  );
  const queue = view === "In progress" ? inProgress : view === "Upcoming" ? upcoming : [...inProgress, ...upcoming];
  const filtered = queue.filter((item) =>
    `${item.businessName} ${item.businessNumber}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const initial = filtered[0];
  const [selectedId, setSelectedId] = useState(initial?.id ?? "");
  const selected = businesses.find((item) => item.id === selectedId) ?? initial;
  const ready = inProgress.filter((item) => item.assessedFee > 0 && item.amountPaid >= item.assessedFee).length;
  const awaitingPayment = inProgress.filter(
    (item) => item.assessedFee > item.amountPaid && item.assessedFee > 0,
  ).length;

  const openCycle = () => {
    if (!selected) return;
    setSelectedId(selected.id);
    const result = startRenewal(selected.id);
    if (!result) return;
    setNotice(`${result.businessNumber} was opened for renewal and sent to fee assessment.`);
  };

  const nextAction = selected
    ? selected.status === "Active"
      ? { href: "", label: "Start renewal cycle", icon: <RefreshCcw size={14} /> }
      : selected.assessedFee <= 0
        ? {
            href: "/barangay-affairs/businesses/assessment",
            label: "Continue to assessment",
            icon: <ArrowRight size={14} />,
          }
        : selected.amountPaid < selected.assessedFee
          ? {
              href: "/barangay-affairs/businesses/collections",
              label: "Continue to collection",
              icon: <ArrowRight size={14} />,
            }
          : {
              href: "/barangay-affairs/businesses/clearances",
              label: "Issue renewed clearance",
              icon: <ArrowRight size={14} />,
            }
    : null;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A9 Business Registry</p>
          <h1>Business Renewals</h1>
          <p>Track the annual renewal cycle from reassessment through renewed clearance for {selectedBarangayName}.</p>
        </div>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <RefreshCcw size={18} />
          </span>
          <div>
            <strong>{inProgress.length}</strong>
            <span>Renewals in progress</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CalendarClock size={18} />
          </span>
          <div>
            <strong>{upcoming.length}</strong>
            <span>Due within 120 days</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Banknote size={18} />
          </span>
          <div>
            <strong>{awaitingPayment}</strong>
            <span>Awaiting payment</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <BadgeCheck size={18} />
          </span>
          <div>
            <strong>{ready}</strong>
            <span>Ready for clearance</span>
          </div>
        </div>
      </div>

      {notice ? (
        <div className={businessStyles.successNotice}>
          <CheckCircle2 size={16} />
          <span>{notice}</span>
          <Link href="/barangay-affairs/businesses/assessment">
            Open assessment <ArrowRight size={13} />
          </Link>
        </div>
      ) : null}

      <div className={businessStyles.renewalWorkspace}>
        <section className={styles.card}>
          <div className={businessStyles.renewalToolbar}>
            <div className={styles.searchBox}>
              <Search size={15} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search renewals" />
            </div>
            <div className={businessStyles.segmentedControl}>
              {(["In progress", "Upcoming", "All"] as const).map((item) => (
                <button
                  type="button"
                  key={item}
                  className={view === item ? businessStyles.segmentActive : ""}
                  onClick={() => {
                    setView(item);
                    setSelectedId("");
                    setNotice("");
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.resultsMeta}>
            <span>
              <strong>{filtered.length}</strong> renewal records
            </span>
            <span>{view}</span>
          </div>
          <div className={businessStyles.renewalList}>
            {filtered.slice(0, 80).map((item) => {
              const stage = renewalStage(item);
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
                    <RefreshCcw size={15} />
                  </span>
                  <div>
                    <strong>{item.businessName}</strong>
                    <small>
                      {item.businessNumber} · {barangayName(item.barangayId)}
                    </small>
                  </div>
                  <span className={stage.tone}>{stage.label}</span>
                  <span className={businessStyles.renewalDate}>
                    <b>{dateLabel(item.renewalDueDate)}</b>
                    <small>Renewal due</small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.card}>
          <div className={businessStyles.panelHeading}>
            <History size={18} />
            <div>
              <strong>Renewal workspace</strong>
              <small>Complete each step using the connected A9 workflows</small>
            </div>
          </div>
          {selected ? (
            <>
              <div className={businessStyles.renewalProfile}>
                <div>
                  <span>Business</span>
                  <strong>{selected.businessName}</strong>
                  <small>
                    {selected.businessNumber} · {selected.businessType}
                  </small>
                </div>
                <div>
                  <span>Registered owner</span>
                  <strong>{residentMap.get(selected.ownerResidentId) ?? "Resident record"}</strong>
                  <small>{barangayName(selected.barangayId)}</small>
                </div>
                <div>
                  <span>Previous clearance</span>
                  <strong>{selected.clearanceNumber || "No prior clearance"}</strong>
                  <small>Valid until {dateLabel(selected.clearanceValidUntil)}</small>
                </div>
              </div>

              <div className={businessStyles.renewalTimeline}>
                <div className={selected.status === "For renewal" ? businessStyles.stepDone : ""}>
                  <span>1</span>
                  <div>
                    <strong>Renewal opened</strong>
                    <small>{selected.status === "For renewal" ? "Cycle is active" : "Awaiting start"}</small>
                  </div>
                </div>
                <div
                  className={
                    selected.status === "For renewal" && selected.assessedFee > 0 ? businessStyles.stepDone : ""
                  }
                >
                  <span>2</span>
                  <div>
                    <strong>Fee assessment</strong>
                    <small>
                      {selected.status === "Active"
                        ? "Starts after opening"
                        : selected.assessedFee
                          ? money(selected.assessedFee)
                          : "Required"}
                    </small>
                  </div>
                </div>
                <div
                  className={
                    selected.status === "For renewal" &&
                    selected.assessedFee > 0 &&
                    selected.amountPaid >= selected.assessedFee
                      ? businessStyles.stepDone
                      : ""
                  }
                >
                  <span>3</span>
                  <div>
                    <strong>Payment</strong>
                    <small>
                      {selected.status === "Active"
                        ? "Starts after assessment"
                        : selected.assessedFee > 0 && selected.amountPaid >= selected.assessedFee
                          ? "Paid in full"
                          : `${money(selected.amountPaid)} received`}
                    </small>
                  </div>
                </div>
                <div
                  className={
                    selected.status === "Active" && selected.clearanceValidUntil > "2026-12-31"
                      ? businessStyles.stepDone
                      : ""
                  }
                >
                  <span>4</span>
                  <div>
                    <strong>Renewed clearance</strong>
                    <small>
                      {selected.status === "Active" && selected.clearanceValidUntil > "2026-12-31"
                        ? "Renewal completed"
                        : "Pending issuance"}
                    </small>
                  </div>
                </div>
              </div>

              <div className={businessStyles.renewalDetails}>
                <dl>
                  <div>
                    <dt>Renewal due</dt>
                    <dd>{dateLabel(selected.renewalDueDate)}</dd>
                  </div>
                  <div>
                    <dt>Gross sales bracket</dt>
                    <dd>{selected.grossSalesBracket}</dd>
                  </div>
                  <div>
                    <dt>BPLS permit</dt>
                    <dd>{selected.bplsPermitNumber || "Pending municipal reference"}</dd>
                  </div>
                  <div>
                    <dt>BPLS status</dt>
                    <dd>{selected.bplsSyncStatus}</dd>
                  </div>
                </dl>
              </div>

              <div className={businessStyles.renewalFooter}>
                <div>
                  <CalendarClock size={16} />
                  <span>
                    <strong>{renewalStage(selected).label}</strong>
                    <small>The next action follows the shared A9 transaction flow.</small>
                  </span>
                </div>
                {nextAction?.href ? (
                  <Link className={styles.primaryButton} href={nextAction.href}>
                    {nextAction.icon} {nextAction.label}
                  </Link>
                ) : (
                  <button className={styles.primaryButton} type="button" onClick={openCycle}>
                    {nextAction?.icon} {nextAction?.label}
                  </button>
                )}
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export function LapsedBusinessesView() {
  const businesses = useBusinessRegistryStore((state) => state.businesses);
  const startRenewal = useBusinessRegistryStore((state) => state.startRenewal);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  const residentMap = useMemo(() => new Map(residents.map((item) => [item.id, formatResidentName(item)])), [residents]);
  const scoped = businesses.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const lapsed = scoped.filter((item) => item.status === "Lapsed");
  const filtered = lapsed.filter((item) =>
    `${item.businessName} ${item.businessNumber}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const initial = filtered[0];
  const [selectedId, setSelectedId] = useState(initial?.id ?? "");
  const selected = businesses.find((item) => item.id === selectedId) ?? initial;
  const overdue90 = lapsed.filter((item) => daysFromToday(item.renewalDueDate) < -90).length;
  const withBpls = lapsed.filter((item) => Boolean(item.bplsPermitNumber)).length;

  const recover = () => {
    if (!selected) return;
    setSelectedId(selected.id);
    const result = startRenewal(selected.id);
    if (!result) return;
    setNotice(`${result.businessNumber} was recovered and moved to the renewal assessment queue.`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A9 Business Registry</p>
          <h1>Lapsed Businesses</h1>
          <p>Review overdue renewal records and return eligible businesses to compliance for {selectedBarangayName}.</p>
        </div>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ShieldAlert size={18} />
          </span>
          <div>
            <strong>{lapsed.length}</strong>
            <span>Lapsed businesses</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Clock3 size={18} />
          </span>
          <div>
            <strong>{overdue90}</strong>
            <span>Overdue beyond 90 days</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <FileCheck2 size={18} />
          </span>
          <div>
            <strong>{withBpls}</strong>
            <span>With BPLS reference</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <AlertTriangle size={18} />
          </span>
          <div>
            <strong>{lapsed.length - withBpls}</strong>
            <span>Municipal review needed</span>
          </div>
        </div>
      </div>

      {notice ? (
        <div className={businessStyles.successNotice}>
          <CheckCircle2 size={16} />
          <span>{notice}</span>
          <Link href="/barangay-affairs/businesses/assessment">
            Open assessment <ArrowRight size={13} />
          </Link>
        </div>
      ) : null}

      <div className={businessStyles.renewalWorkspace}>
        <section className={styles.card}>
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search lapsed records"
              />
            </div>
          </div>
          <div className={styles.resultsMeta}>
            <span>
              <strong>{filtered.length}</strong> lapsed records
            </span>
            <span>Action required</span>
          </div>
          <div className={businessStyles.lapsedList}>
            {filtered.slice(0, 80).map((item) => {
              const daysOverdue = Math.abs(Math.min(0, daysFromToday(item.renewalDueDate)));
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
                  <span className={businessStyles.lapsedIcon}>
                    <CircleAlert size={15} />
                  </span>
                  <div>
                    <strong>{item.businessName}</strong>
                    <small>
                      {item.businessNumber} · {barangayName(item.barangayId)}
                    </small>
                  </div>
                  <span className={businessStyles.dangerPill}>Lapsed</span>
                  <span className={businessStyles.renewalDate}>
                    <b>{daysOverdue} days</b>
                    <small>Overdue</small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.card}>
          <div className={businessStyles.panelHeading}>
            <ShieldAlert size={18} />
            <div>
              <strong>Lapsed record review</strong>
              <small>Confirm the record before returning it to renewal processing</small>
            </div>
          </div>
          {selected ? (
            <>
              <div
                className={selected.status === "Lapsed" ? businessStyles.lapsedBanner : businessStyles.recoveredBanner}
              >
                {selected.status === "Lapsed" ? <CircleAlert size={19} /> : <CheckCircle2 size={19} />}
                <div>
                  <strong>
                    {selected.status === "Lapsed"
                      ? `Renewal deadline passed on ${dateLabel(selected.renewalDueDate)}`
                      : "Renewal recovery opened successfully"}
                  </strong>
                  <span>
                    {selected.status === "Lapsed"
                      ? `The previous barangay clearance expired on ${dateLabel(selected.clearanceValidUntil)}. Issuance is blocked until the renewal transaction is completed.`
                      : "The business is now in the renewal queue. Continue to fee reassessment, collection, and renewed clearance issuance."}
                  </span>
                </div>
              </div>

              <div className={businessStyles.renewalProfile}>
                <div>
                  <span>Business</span>
                  <strong>{selected.businessName}</strong>
                  <small>{selected.businessNumber}</small>
                </div>
                <div>
                  <span>Registered owner</span>
                  <strong>{residentMap.get(selected.ownerResidentId) ?? "Resident record"}</strong>
                  <small>{selected.contactNumber}</small>
                </div>
                <div>
                  <span>Location</span>
                  <strong>Brgy. {barangayName(selected.barangayId)}</strong>
                  <small>{selected.businessType}</small>
                </div>
              </div>

              <div className={businessStyles.lapsedChecklist}>
                <article>
                  <span className={businessStyles.checkAlert}>
                    <AlertTriangle size={15} />
                  </span>
                  <div>
                    <strong>Clearance expired</strong>
                    <small>{selected.clearanceNumber || "No controlled clearance recorded"}</small>
                  </div>
                  <b>{dateLabel(selected.clearanceValidUntil)}</b>
                </article>
                <article>
                  <span>
                    <FileCheck2 size={15} />
                  </span>
                  <div>
                    <strong>BPLS linkage</strong>
                    <small>{selected.bplsPermitNumber || "No municipal permit reference"}</small>
                  </div>
                  <b>{selected.bplsSyncStatus}</b>
                </article>
                <article>
                  <span>
                    <RefreshCcw size={15} />
                  </span>
                  <div>
                    <strong>Recovery path</strong>
                    <small>Reassessment, payment, then renewed barangay clearance</small>
                  </div>
                  <b>3 steps</b>
                </article>
              </div>

              <div className={businessStyles.renewalFooter}>
                <div>
                  <ShieldAlert size={16} />
                  <span>
                    <strong>Restore only after confirming continued operation</strong>
                    <small>The action creates a new renewal transaction and keeps the prior clearance reference.</small>
                  </span>
                </div>
                {selected.status === "Lapsed" ? (
                  <button className={styles.primaryButton} type="button" onClick={recover}>
                    <RefreshCcw size={14} /> Move to renewal queue
                  </button>
                ) : (
                  <Link className={styles.primaryButton} href="/barangay-affairs/businesses/assessment">
                    Continue to assessment <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
