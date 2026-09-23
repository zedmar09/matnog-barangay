"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  CalendarClock,
  FilePlus2,
  LockKeyhole,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useBcpcStore } from "../stores/bcpc-store";
import type { BcpcCaseStatus, BcpcClassification, BcpcRiskLevel } from "../types/bcpc";
import type { IncidentParty } from "../types/blotter";
import peaceStyles from "./peace-order.module.css";

const statuses: BcpcCaseStatus[] = [
  "Intake",
  "Assessment",
  "Intervention Plan",
  "Diversion",
  "Referred",
  "Monitoring",
  "Closed",
];
const mask = (name: string) =>
  name
    .split(/[ ,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => `${part[0]}.`)
    .join(" ");
const riskClass = (risk: BcpcRiskLevel) =>
  risk === "Urgent" ? styles.danger : risk === "High" ? styles.warning : styles.info;
const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;

function residentParty(
  id: string,
  residents: ReturnType<typeof useResidentRegistryStore.getState>["residents"],
): IncidentParty {
  const resident = residents.find((item) => item.id === id) ?? residents[0];
  return {
    kind: "Resident",
    residentId: resident.id,
    fullName: formatResidentName(resident),
    contact: resident.contact.primaryMobile,
    address: `${resident.address.street}, Brgy. ${barangayName(resident.address.barangayId)}, Matnog`,
  };
}

export function BcpcDeskView() {
  const cases = useBcpcStore((state) => state.cases);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [classification, setClassification] = useState("");
  const rows = useMemo(
    () =>
      cases.filter(
        (item) =>
          (selectedBarangay === "all" || item.barangayId === selectedBarangay) &&
          (!classification || item.classification === classification) &&
          (!search.trim() ||
            `${item.caseNumber} ${item.status} ${item.caseworker}`.toLowerCase().includes(search.toLowerCase())),
      ),
    [cases, classification, search, selectedBarangay],
  );
  const scoped = cases.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  return (
    <div className={styles.page}>
      <div className={peaceStyles.restrictedBanner}>
        <LockKeyhole size={17} />
        BCPC records use the highest confidentiality class. Child and guardian identities remain masked until authorized
        purpose capture.
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A5 Restricted BCPC</p>
          <h1>Child Protection Cases</h1>
          <p>Child-sensitive assessment, intervention, diversion, referral, and monitoring.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/peace-order/bcpc/new">
          <FilePlus2 size={15} /> Confidential intake
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <UsersRound size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>Restricted cases</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ShieldAlert size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.classification === "Child at Risk").length}</strong>
            <span>Children at risk</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ShieldCheck size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.classification === "Child in Conflict with the Law").length}</strong>
            <span>CICL cases</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CalendarClock size={18} />
          </span>
          <div>
            <strong>
              {scoped.filter((item) => item.conferences.some((conference) => conference.status === "Scheduled")).length}
            </strong>
            <span>Conferences scheduled</span>
          </div>
        </div>
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search BCPC cases"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search case number, status, or caseworker"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="BCPC classification"
            value={classification}
            onChange={(event) => setClassification(event.target.value)}
          >
            <option value="">All classifications</option>
            <option>Child at Risk</option>
            <option>Child in Conflict with the Law</option>
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} confidential cases</strong>
          <span>Identities are masked in this queue</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th>Case</th>
                <th>Barangay</th>
                <th>Classification</th>
                <th>Child</th>
                <th>Guardian</th>
                <th>Age</th>
                <th>Risk</th>
                <th>Status</th>
                <th>Follow-up</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td className={styles.mono}>{item.caseNumber}</td>
                  <td>{barangayName(item.barangayId)}</td>
                  <td>{item.classification}</td>
                  <td>{mask(item.child.fullName)}</td>
                  <td>{mask(item.guardian.fullName)}</td>
                  <td>{item.childAge}</td>
                  <td>
                    <span className={`${styles.badge} ${riskClass(item.riskLevel)}`}>{item.riskLevel}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${item.status === "Closed" ? styles.active : styles.info}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.nextFollowUpAt ? new Date(item.nextFollowUpAt).toLocaleDateString("en-PH") : "Not set"}</td>
                  <td>
                    <Link className={styles.secondaryButton} href={`/barangay-affairs/peace-order/bcpc/${item.id}`}>
                      <LockKeyhole size={14} /> Request access
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function BcpcIntakeView() {
  const residents = useResidentRegistryStore((state) => state.residents);
  const createCase = useBcpcStore((state) => state.createCase);
  const router = useRouter();
  const choices = residents.slice(0, 160);
  const [childId, setChildId] = useState(choices[4].id);
  const [guardianId, setGuardianId] = useState(choices[5].id);
  const [age, setAge] = useState("14");
  const [classification, setClassification] = useState<BcpcClassification>("Child at Risk");
  const [risk, setRisk] = useState<BcpcRiskLevel>("High");
  const [concern, setConcern] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [authority, setAuthority] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    if (!concern.trim() || !assessment.trim() || !plan.trim() || !authority.trim()) {
      setError("Complete the concern, assessment, intervention plan, and consent or authority record.");
      return;
    }
    const child = residentParty(childId, residents);
    const value = createCase({
      barangayId: residents.find((item) => item.id === childId)?.address.barangayId ?? MATNOG_BARANGAYS[0].code,
      child,
      childAge: Number(age) || 0,
      guardian: residentParty(guardianId, residents),
      classification,
      riskLevel: risk,
      presentingConcern: concern,
      assessment,
      interventionPlan: plan,
      consentOrAuthority: authority,
    });
    router.push(`/barangay-affairs/peace-order/bcpc/${value.id}`);
  };
  return (
    <div className={styles.page}>
      {error && <div className={styles.toast}>{error}</div>}
      <div className={peaceStyles.restrictedBanner}>
        <ShieldAlert size={17} />
        Complete this intake privately with child-sensitive language and only the minimum necessary information.
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Highest Confidentiality Intake</p>
          <h1>New BCPC Case</h1>
          <p>Record a protective assessment and the initial intervention or diversion path.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/peace-order/bcpc">
          <ArrowLeft size={15} /> BCPC cases
        </Link>
      </header>
      <div className={styles.detailGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Identity and classification</p>
              <h2>Child and guardian</h2>
            </div>
          </div>
          <div className={styles.filterGrid}>
            <label className={styles.field}>
              <span>Child resident</span>
              <select value={childId} onChange={(event) => setChildId(event.target.value)}>
                {choices.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {formatResidentName(resident)} · {resident.lrn}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Guardian</span>
              <select value={guardianId} onChange={(event) => setGuardianId(event.target.value)}>
                {choices.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {formatResidentName(resident)} · {resident.lrn}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Child age</span>
              <input type="number" min="0" max="17" value={age} onChange={(event) => setAge(event.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Classification</span>
              <select
                value={classification}
                onChange={(event) => setClassification(event.target.value as BcpcClassification)}
              >
                <option>Child at Risk</option>
                <option>Child in Conflict with the Law</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Risk level</span>
              <select value={risk} onChange={(event) => setRisk(event.target.value as BcpcRiskLevel)}>
                <option>Urgent</option>
                <option>High</option>
                <option>Moderate</option>
              </select>
            </label>
          </div>
          <label className={styles.field}>
            <span>Presenting concern</span>
            <textarea rows={5} value={concern} onChange={(event) => setConcern(event.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Initial assessment</span>
            <textarea rows={5} value={assessment} onChange={(event) => setAssessment(event.target.value)} />
          </label>
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Case planning</p>
              <h2>Protection and intervention</h2>
            </div>
          </div>
          <label className={styles.field}>
            <span>Initial intervention or diversion plan</span>
            <textarea rows={8} value={plan} onChange={(event) => setPlan(event.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Consent or legal authority</span>
            <textarea rows={4} value={authority} onChange={(event) => setAuthority(event.target.value)} />
          </label>
          <button className={styles.primaryButton} type="button" onClick={submit}>
            <ShieldCheck size={15} /> Save confidential intake
          </button>
        </aside>
      </div>
    </div>
  );
}

export function BcpcCaseDetailView({ id }: { id: string }) {
  const item = useBcpcStore((state) => state.cases.find((entry) => entry.id === id));
  const logAccess = useBcpcStore((state) => state.logAccess);
  const scheduleConference = useBcpcStore((state) => state.scheduleConference);
  const updateStatus = useBcpcStore((state) => state.updateStatus);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("Direct child protection case management");
  const [conferenceAt, setConferenceAt] = useState("2026-09-30T09:00");
  const [venue, setVenue] = useState("Private BCPC Conference Room");
  const [message, setMessage] = useState("");
  if (!item)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <h1>BCPC case not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/peace-order/bcpc">
            Return to BCPC
          </Link>
        </div>
      </div>
    );
  if (!open)
    return (
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Highest Confidentiality Record</p>
            <h1>{item.caseNumber}</h1>
            <p>Record your authorized purpose before viewing child information.</p>
          </div>
          <Link className={styles.secondaryButton} href="/barangay-affairs/peace-order/bcpc">
            <ArrowLeft size={15} /> BCPC cases
          </Link>
        </header>
        <section className={`${styles.card} ${peaceStyles.accessGate}`}>
          <LockKeyhole size={34} />
          <h2>Authorized purpose required</h2>
          <p>Every access is recorded with the user, purpose, case, and timestamp.</p>
          <label className={styles.field}>
            <span>Reason for access</span>
            <select value={reason} onChange={(event) => setReason(event.target.value)}>
              <option>Direct child protection case management</option>
              <option>Authorized protective assessment</option>
              <option>Case conference preparation</option>
              <option>Authorized social welfare referral</option>
              <option>Supervisory safeguarding review</option>
            </select>
          </label>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => {
              logAccess(item.id, reason);
              setOpen(true);
            }}
          >
            <UserCheck size={15} /> Record purpose and open case
          </button>
        </section>
      </div>
    );
  return (
    <div className={styles.page}>
      {message && <div className={styles.toast}>{message}</div>}
      <div className={peaceStyles.restrictedBanner}>
        <LockKeyhole size={17} />
        Access recorded for: {reason}
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Restricted BCPC Case</p>
          <h1>{item.caseNumber}</h1>
          <p>
            {item.classification} · {barangayName(item.barangayId)}
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/peace-order/bcpc">
          <ArrowLeft size={15} /> BCPC cases
        </Link>
      </header>
      <div className={styles.detailGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Protective case record</p>
              <h2>Assessment and plan</h2>
            </div>
            <span className={`${styles.badge} ${riskClass(item.riskLevel)}`}>{item.riskLevel}</span>
          </div>
          <dl className={styles.dataList}>
            <div className={styles.dataRow}>
              <dt>Child</dt>
              <dd>
                {item.child.fullName} · age {item.childAge}
                <br />
                <small>{item.child.address}</small>
              </dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Guardian</dt>
              <dd>
                {item.guardian.fullName}
                <br />
                <small>{item.guardian.contact}</small>
              </dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Concern</dt>
              <dd>{item.presentingConcern}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Assessment</dt>
              <dd>{item.assessment}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Intervention plan</dt>
              <dd>{item.interventionPlan}</dd>
            </div>
            {item.diversionPlan && (
              <div className={styles.dataRow}>
                <dt>Diversion plan</dt>
                <dd>{item.diversionPlan}</dd>
              </div>
            )}
            <div className={styles.dataRow}>
              <dt>Authority</dt>
              <dd>{item.consentOrAuthority}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Referrals</dt>
              <dd>{item.referrals.join(", ") || "No referral recorded"}</dd>
            </div>
          </dl>
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Case coordination</p>
              <h2>Next action</h2>
            </div>
            <span className={`${styles.badge} ${styles.info}`}>{item.status}</span>
          </div>
          <label className={styles.field}>
            <span>Conference date and time</span>
            <input
              type="datetime-local"
              value={conferenceAt}
              onChange={(event) => setConferenceAt(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span>Private venue</span>
            <input value={venue} onChange={(event) => setVenue(event.target.value)} />
          </label>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => {
              scheduleConference(item.id, new Date(conferenceAt).toISOString(), venue);
              setMessage("Private case conference scheduled.");
            }}
          >
            <CalendarClock size={15} /> Schedule case conference
          </button>
          <label className={styles.field}>
            <span>Case status</span>
            <select
              value={item.status}
              onChange={(event) => {
                updateStatus(
                  item.id,
                  event.target.value as BcpcCaseStatus,
                  "Status updated after authorized child protection review.",
                );
                setMessage("Case status updated.");
              }}
            >
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </aside>
      </div>
      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Authorized conferences</p>
            <h2>Case coordination history</h2>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 820 }}>
            <thead>
              <tr>
                <th>Schedule</th>
                <th>Venue</th>
                <th>Participants</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {item.conferences.length === 0 ? (
                <tr>
                  <td colSpan={5}>No conference scheduled.</td>
                </tr>
              ) : (
                item.conferences.map((conference) => (
                  <tr key={conference.id}>
                    <td>{new Date(conference.scheduledAt).toLocaleString("en-PH")}</td>
                    <td>{conference.venue}</td>
                    <td>{conference.participants.join(", ")}</td>
                    <td>{conference.status}</td>
                    <td>{conference.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Highest confidentiality audit</p>
            <h2>Access and action log</h2>
          </div>
          <span className={`${styles.badge} ${styles.info}`}>{item.auditTrail.length} events</span>
        </div>
        <div className={peaceStyles.caseTimeline}>
          {[...item.auditTrail].reverse().map((event) => (
            <article key={event.id}>
              <strong>{event.action}</strong>
              <p>{event.reason}</p>
              <small>
                {event.actor} · {new Date(event.occurredAt).toLocaleString("en-PH")}
              </small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
