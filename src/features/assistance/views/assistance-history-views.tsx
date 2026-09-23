"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  BadgeAlert,
  CheckCircle2,
  Clock3,
  House,
  Search,
  ShieldAlert,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useHouseholdRegistryStore } from "@/features/household-registry/stores/household-registry-store";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useAssistanceStore } from "../stores/assistance-store";
import type { AssistanceRecord } from "../types/assistance";
import assistanceStyles from "./assistance.module.css";

const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
const date = (value: string) => (value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("en-PH") : "—");

function HistoryTimeline({ records }: { records: AssistanceRecord[] }) {
  return (
    <div className={assistanceStyles.historyTimeline}>
      {records.length ? (
        records.map((item) => (
          <article key={item.id}>
            <span
              className={item.status === "Released" ? assistanceStyles.timelineDone : assistanceStyles.timelinePending}
            >
              {item.status === "Released" ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
            </span>
            <div>
              <div>
                <strong>{item.assistanceType}</strong>
                <span>{item.referenceNumber}</span>
              </div>
              <p>{item.purpose}</p>
              <small>
                {date(item.assistanceDate)} · {item.releasingOffice} · {item.fundSource}
              </small>
            </div>
            <div>
              <strong>{money(item.amount)}</strong>
              <span
                className={`${styles.badge} ${item.status === "Released" ? styles.active : item.status === "Held" ? styles.danger : styles.warning}`}
              >
                {item.status}
              </span>
            </div>
          </article>
        ))
      ) : (
        <div className={styles.empty}>
          <h3>No assistance history</h3>
          <p>No transactions are attached to this record.</p>
        </div>
      )}
    </div>
  );
}

export function ResidentAssistanceHistoryView() {
  const records = useAssistanceStore((state) => state.records);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const residentIds = new Set(records.map((item) => item.residentId));
  const candidates = residents
    .filter((item) => residentIds.has(item.id))
    .filter((item) => selectedBarangay === "all" || item.address.barangayId === selectedBarangay)
    .filter(
      (item) =>
        !search.trim() || `${item.lrn} ${formatResidentName(item)}`.toLowerCase().includes(search.toLowerCase()),
    );
  const selected = residents.find((item) => item.id === selectedId) ?? candidates[0];
  const history = records.filter((item) => item.residentId === selected?.id);
  const released = history.filter((item) => item.status === "Released");
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A7 Beneficiary Read-Across</p>
          <h1>Resident Assistance History</h1>
          <p>Every assistance transaction from barangay and municipal offices against one permanent resident record.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/assistance/new">
          New assistance
        </Link>
      </header>
      <div className={assistanceStyles.historyWorkspace}>
        <section className={styles.card}>
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                aria-label="Search resident assistance history"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search resident or LRN"
              />
            </label>
          </div>
          <div className={styles.resultsMeta}>
            <strong>{candidates.length} residents</strong>
            <span>Residents with assistance records</span>
          </div>
          <div className={assistanceStyles.entityList}>
            {candidates.slice(0, 80).map((item) => {
              const residentRecords = records.filter((record) => record.residentId === item.id);
              return (
                <button
                  type="button"
                  key={item.id}
                  className={item.id === selected?.id ? assistanceStyles.entitySelected : assistanceStyles.entityRow}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span>
                    <UserRound size={16} />
                  </span>
                  <div>
                    <strong>{formatResidentName(item)}</strong>
                    <small>
                      {item.lrn} · Brgy. {barangayName(item.address.barangayId)}
                    </small>
                  </div>
                  <div>
                    <strong>{residentRecords.length}</strong>
                    <small>
                      {money(
                        residentRecords
                          .filter((record) => record.status === "Released")
                          .reduce((sum, record) => sum + record.amount, 0),
                      )}
                    </small>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
        <section className={styles.card}>
          {selected && (
            <>
              <div className={assistanceStyles.historyHero}>
                <span>
                  <UserRound size={22} />
                </span>
                <div>
                  <small>RESIDENT BENEFICIARY</small>
                  <h2>{formatResidentName(selected)}</h2>
                  <p>
                    {selected.lrn} · Brgy. {barangayName(selected.address.barangayId)}
                  </p>
                </div>
                <Link className={styles.secondaryButton} href={`/barangay-affairs/residents/${selected.id}`}>
                  Resident profile
                </Link>
              </div>
              <div className={assistanceStyles.historyMetrics}>
                <div>
                  <strong>{history.length}</strong>
                  <span>Total records</span>
                </div>
                <div>
                  <strong>{money(released.reduce((sum, item) => sum + item.amount, 0))}</strong>
                  <span>Released value</span>
                </div>
                <div>
                  <strong>{new Set(released.map((item) => item.releasingOffice)).size}</strong>
                  <span>Releasing offices</span>
                </div>
                <div>
                  <strong>{history.filter((item) => item.status === "Held").length}</strong>
                  <span>Active holds</span>
                </div>
              </div>
              <HistoryTimeline records={history} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export function HouseholdAssistanceHistoryView() {
  const records = useAssistanceStore((state) => state.records);
  const households = useHouseholdRegistryStore((state) => state.households);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const householdIds = new Set(records.map((item) => item.householdId).filter(Boolean));
  const candidates = households
    .filter((item) => householdIds.has(item.id))
    .filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay)
    .filter((item) => !search.trim() || item.householdNumber.toLowerCase().includes(search.toLowerCase()));
  const selected = households.find((item) => item.id === selectedId) ?? candidates[0];
  const history = records.filter((item) => item.householdId === selected?.id);
  const head = residents.find((item) => item.id === selected?.headResidentId);
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A7 Household Safeguard</p>
          <h1>Household Assistance History</h1>
          <p>Combined assistance activity for all members of one A2 household.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/assistance/alerts">
          Cooling-off alerts
        </Link>
      </header>
      <div className={assistanceStyles.historyWorkspace}>
        <section className={styles.card}>
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                aria-label="Search household assistance history"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search household number"
              />
            </label>
          </div>
          <div className={styles.resultsMeta}>
            <strong>{candidates.length} households</strong>
            <span>Households with assistance records</span>
          </div>
          <div className={assistanceStyles.entityList}>
            {candidates.slice(0, 80).map((item) => {
              const householdRecords = records.filter((record) => record.householdId === item.id);
              const householdHead = residents.find((resident) => resident.id === item.headResidentId);
              return (
                <button
                  type="button"
                  key={item.id}
                  className={item.id === selected?.id ? assistanceStyles.entitySelected : assistanceStyles.entityRow}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span>
                    <House size={16} />
                  </span>
                  <div>
                    <strong>{item.householdNumber}</strong>
                    <small>
                      {householdHead ? formatResidentName(householdHead) : "Household head"} · {item.members.length}{" "}
                      members
                    </small>
                  </div>
                  <div>
                    <strong>{householdRecords.length}</strong>
                    <small>
                      {money(
                        householdRecords
                          .filter((record) => record.status === "Released")
                          .reduce((sum, record) => sum + record.amount, 0),
                      )}
                    </small>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
        <section className={styles.card}>
          {selected && (
            <>
              <div className={assistanceStyles.historyHero}>
                <span>
                  <UsersRound size={22} />
                </span>
                <div>
                  <small>HOUSEHOLD BENEFICIARY</small>
                  <h2>{selected.householdNumber}</h2>
                  <p>
                    {head ? formatResidentName(head) : "Household head"} · Brgy. {barangayName(selected.barangayId)}
                  </p>
                </div>
                <Link className={styles.secondaryButton} href={`/barangay-affairs/households/${selected.id}`}>
                  Household profile
                </Link>
              </div>
              <div className={assistanceStyles.householdMembers}>
                {selected.members.map((member) => {
                  const resident = residents.find((item) => item.id === member.residentId);
                  const count = records.filter((item) => item.residentId === member.residentId).length;
                  return (
                    <div key={member.residentId}>
                      <span>
                        <UserRound size={14} />
                      </span>
                      <strong>{resident ? formatResidentName(resident) : member.residentId}</strong>
                      <small>
                        {member.relationshipToHead} · {count} records
                      </small>
                    </div>
                  );
                })}
              </div>
              <HistoryTimeline records={history} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export function AssistanceAlertsView() {
  const records = useAssistanceStore((state) => state.records);
  const residents = useResidentRegistryStore((state) => state.residents);
  const review = useAssistanceStore((state) => state.reviewDuplicate);
  const { selectedBarangay } = useBarangayScope();
  const [selectedId, setSelectedId] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const alerts = useMemo(
    () =>
      records.filter(
        (item) => item.duplicateFlag && (selectedBarangay === "all" || item.barangayId === selectedBarangay),
      ),
    [records, selectedBarangay],
  );
  const selected = records.find((item) => item.id === selectedId) ?? alerts[0];
  const matched = records.find((item) => item.id === selected?.matchedRecordId);
  const residentName = (id?: string) => {
    const resident = residents.find((item) => item.id === id);
    return resident ? formatResidentName(resident) : "Resident record";
  };
  const decide = (outcome: "Cleared" | "Confirmed") => {
    if (!selected) return;
    review(selected.id, outcome, note);
    setMessage(
      outcome === "Cleared"
        ? `${selected.referenceNumber} cleared and returned to pending review.`
        : `${selected.referenceNumber} confirmed as a duplicate and retained on hold.`,
    );
    setSelectedId("");
    setNote("");
  };
  return (
    <div className={styles.page}>
      {message && (
        <div className={assistanceStyles.successNotice}>
          <CheckCircle2 size={18} /> {message}
        </div>
      )}
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A7 Duplicate Control</p>
          <h1>Duplicate & Cooling-Off Alerts</h1>
          <p>Compare possible cross-office duplicates before clearing or confirming a hold.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/assistance/ledger">
          Assistance ledger
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <BadgeAlert size={18} />
          </span>
          <div>
            <strong>{alerts.length}</strong>
            <span>Pending alert reviews</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CheckCircle2 size={18} />
          </span>
          <div>
            <strong>{records.filter((item) => item.alertResolution === "Cleared").length}</strong>
            <span>Alerts cleared</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ShieldAlert size={18} />
          </span>
          <div>
            <strong>{records.filter((item) => item.alertResolution === "Confirmed").length}</strong>
            <span>Duplicates confirmed</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Clock3 size={18} />
          </span>
          <div>
            <strong>{records.filter((item) => item.status === "Pending Review").length}</strong>
            <span>Pending normal review</span>
          </div>
        </div>
      </div>
      <div className={assistanceStyles.alertWorkspace}>
        <section className={styles.card}>
          <div className={styles.resultsMeta}>
            <strong>{alerts.length} flagged records</strong>
            <span>Municipality-wide queue</span>
          </div>
          <div className={assistanceStyles.alertList}>
            {alerts.map((item) => (
              <button
                type="button"
                key={item.id}
                className={item.id === selected?.id ? assistanceStyles.alertSelected : assistanceStyles.alertRow}
                onClick={() => {
                  setSelectedId(item.id);
                  setNote("");
                }}
              >
                <span>
                  <BadgeAlert size={17} />
                </span>
                <div>
                  <strong>
                    {item.referenceNumber} · {item.assistanceType}
                  </strong>
                  <small>
                    {residentName(item.residentId)} · {barangayName(item.barangayId)}
                  </small>
                  <p>{item.holdReason}</p>
                </div>
                <strong>{money(item.amount)}</strong>
              </button>
            ))}
          </div>
        </section>
        <section className={styles.card}>
          {selected && matched ? (
            <>
              <div className={assistanceStyles.panelHeading}>
                <span>
                  <ShieldAlert size={17} />
                </span>
                <div>
                  <strong>Alert comparison</strong>
                  <small>Potential duplicate and matched prior release</small>
                </div>
              </div>
              <div className={assistanceStyles.comparisonGrid}>
                {[
                  ["FLAGGED REQUEST", selected],
                  ["MATCHED RELEASE", matched],
                ].map(([label, value]) => {
                  const record = value as AssistanceRecord;
                  return (
                    <article key={label as string}>
                      <small>{label as string}</small>
                      <h2>{record.referenceNumber}</h2>
                      <dl>
                        <div>
                          <dt>Resident</dt>
                          <dd>{residentName(record.residentId)}</dd>
                        </div>
                        <div>
                          <dt>Household</dt>
                          <dd>{record.householdId}</dd>
                        </div>
                        <div>
                          <dt>Type</dt>
                          <dd>{record.assistanceType}</dd>
                        </div>
                        <div>
                          <dt>Amount</dt>
                          <dd>{money(record.amount)}</dd>
                        </div>
                        <div>
                          <dt>Date</dt>
                          <dd>{date(record.assistanceDate)}</dd>
                        </div>
                        <div>
                          <dt>Office</dt>
                          <dd>{record.releasingOffice}</dd>
                        </div>
                      </dl>
                    </article>
                  );
                })}
              </div>
              <div className={assistanceStyles.matchReasons}>
                <strong>Why this was flagged</strong>
                <span>Same resident and household</span>
                <span>Same assistance type</span>
                <span>
                  Inside the{" "}
                  {Math.round(
                    (new Date(`${matched.coolingEndsAt}T00:00:00`).getTime() -
                      new Date(`${matched.assistanceDate}T00:00:00`).getTime()) /
                      86_400_000,
                  )}
                  -day cooling period
                </span>
                <span>Different releasing transaction</span>
              </div>
              <div className={assistanceStyles.reviewBox}>
                <label className={styles.field}>
                  <span>Review note</span>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Record the evidence and reason for the decision"
                  />
                </label>
                <div>
                  <button className={styles.secondaryButton} type="button" onClick={() => decide("Cleared")}>
                    <CheckCircle2 size={14} /> Clear alert
                  </button>
                  <button className={styles.dangerButton} type="button" onClick={() => decide("Confirmed")}>
                    <XCircle size={14} /> Confirm duplicate
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.empty}>
              <CheckCircle2 size={30} />
              <h3>No pending duplicate alerts</h3>
              <p>The current queue is clear.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
