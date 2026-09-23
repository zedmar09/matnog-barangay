"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  CalendarClock,
  FilePlus2,
  HeartHandshake,
  LockKeyhole,
  Search,
  ShieldAlert,
  ShieldCheck,
  Siren,
  UserCheck,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useVawStore } from "../stores/vaw-store";
import type { IncidentParty } from "../types/blotter";
import type { VawCaseStatus, VawRiskLevel } from "../types/vaw";
import peaceStyles from "./peace-order.module.css";

const vawStatuses: VawCaseStatus[] = [
  "Intake Review",
  "Risk Assessment",
  "BPO Pending",
  "BPO Active",
  "Referred",
  "Monitoring",
  "Closed",
];

function maskName(name: string) {
  return name
    .split(/[ ,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => `${part[0]}.`)
    .join(" ");
}

function riskClass(risk: VawRiskLevel) {
  return risk === "Critical" ? styles.danger : risk === "High" ? styles.warning : styles.info;
}

function partyFromResident(
  id: string,
  residents: ReturnType<typeof useResidentRegistryStore.getState>["residents"],
): IncidentParty {
  const resident = residents.find((item) => item.id === id) ?? residents[0];
  return {
    kind: "Resident",
    residentId: resident.id,
    fullName: formatResidentName(resident),
    contact: resident.contact.primaryMobile,
    address: `${resident.address.street}, Brgy. ${MATNOG_BARANGAYS.find((item) => item.code === resident.address.barangayId)?.name}, Matnog`,
  };
}

export function VawDeskView() {
  const cases = useVawStore((state) => state.cases);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const rows = useMemo(
    () =>
      cases.filter(
        (item) =>
          (selectedBarangay === "all" || item.barangayId === selectedBarangay) &&
          (!status || item.status === status) &&
          (!search.trim() ||
            `${item.caseNumber} ${item.classification} ${item.caseworker}`
              .toLowerCase()
              .includes(search.toLowerCase())),
      ),
    [cases, search, selectedBarangay, status],
  );
  const scoped = cases.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  return (
    <div className={styles.page}>
      <div className={peaceStyles.restrictedBanner}>
        <LockKeyhole size={17} />
        Highest privacy safeguards apply. Names are masked in the work queue and every case view requires a recorded
        purpose.
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A5 Restricted VAW Desk</p>
          <h1>VAW Case Management</h1>
          <p>Confidential intake, safety planning, protection orders, referrals, and follow-up.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/peace-order/vaw/new">
          <FilePlus2 size={15} /> Confidential intake
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <HeartHandshake size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>Restricted cases</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Siren size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.riskLevel === "Critical" && item.status !== "Closed").length}</strong>
            <span>Critical risk</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ShieldCheck size={18} />
          </span>
          <div>
            <strong>
              {scoped.filter((item) => item.protectionOrders.some((order) => order.status === "Active")).length}
            </strong>
            <span>Active BPOs</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CalendarClock size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.status === "Monitoring").length}</strong>
            <span>For monitoring</span>
          </div>
        </div>
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search VAW cases"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search case number, classification, or caseworker"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="VAW case status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All case statuses</option>
            {vawStatuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} restricted cases</strong>
          <span>Identity remains masked until purpose capture</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1080 }}>
            <thead>
              <tr>
                <th>Case</th>
                <th>Barangay</th>
                <th>Classification</th>
                <th>Survivor</th>
                <th>Respondent</th>
                <th>Risk</th>
                <th>Status</th>
                <th>Next follow-up</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td className={styles.mono}>{item.caseNumber}</td>
                  <td>{MATNOG_BARANGAYS.find((barangay) => barangay.code === item.barangayId)?.name}</td>
                  <td>{item.classification}</td>
                  <td>{maskName(item.survivor.fullName)}</td>
                  <td>{maskName(item.respondent.fullName)}</td>
                  <td>
                    <span className={`${styles.badge} ${riskClass(item.riskLevel)}`}>{item.riskLevel}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${item.status === "Closed" ? styles.active : styles.info}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    {item.nextFollowUpAt ? new Date(item.nextFollowUpAt).toLocaleDateString("en-PH") : "Not scheduled"}
                  </td>
                  <td>
                    <Link className={styles.secondaryButton} href={`/barangay-affairs/peace-order/vaw/${item.id}`}>
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

export function VawIntakeView() {
  const residents = useResidentRegistryStore((state) => state.residents);
  const createCase = useVawStore((state) => state.createCase);
  const router = useRouter();
  const choices = residents.slice(0, 120);
  const [survivorId, setSurvivorId] = useState(choices[0].id);
  const [respondentId, setRespondentId] = useState(choices[8].id);
  const [classification, setClassification] = useState<
    "Physical" | "Psychological" | "Economic" | "Sexual" | "Threat or Harassment"
  >("Psychological");
  const [riskLevel, setRiskLevel] = useState<VawRiskLevel>("High");
  const [incidentAt, setIncidentAt] = useState("2026-09-23T09:00");
  const [location, setLocation] = useState("");
  const [childrenAffected, setChildrenAffected] = useState("0");
  const [narrative, setNarrative] = useState("");
  const [safetyPlan, setSafetyPlan] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const submit = () => {
    if (!location.trim() || !narrative.trim() || !safetyPlan.trim() || !consent) {
      setError("Complete the incident information, safety plan, and consent confirmation.");
      return;
    }
    const survivor = partyFromResident(survivorId, residents);
    const value = createCase({
      barangayId: residents.find((item) => item.id === survivorId)?.address.barangayId ?? MATNOG_BARANGAYS[0].code,
      survivor,
      respondent: partyFromResident(respondentId, residents),
      classification,
      incidentAt: new Date(incidentAt).toISOString(),
      location,
      riskLevel,
      childrenAffected: Number(childrenAffected) || 0,
      narrative,
      safetyPlan,
      consentRecorded: consent,
    });
    router.push(`/barangay-affairs/peace-order/vaw/${value.id}`);
  };
  return (
    <div className={styles.page}>
      {error && <div className={styles.toast}>{error}</div>}
      <div className={peaceStyles.restrictedBanner}>
        <ShieldAlert size={17} />
        Complete this intake in a private setting. Save only information needed for protection and referral.
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Restricted VAW Intake</p>
          <h1>Confidential Case Intake</h1>
          <p>Record immediate risks, requested assistance, and the agreed safety plan.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/peace-order/vaw">
          <ArrowLeft size={15} /> VAW Desk
        </Link>
      </header>
      <div className={styles.detailGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>People and incident</p>
              <h2>Intake record</h2>
            </div>
          </div>
          <div className={styles.filterGrid}>
            <label className={styles.field}>
              <span>Survivor</span>
              <select value={survivorId} onChange={(event) => setSurvivorId(event.target.value)}>
                {choices.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {formatResidentName(resident)} · {resident.lrn}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Respondent</span>
              <select value={respondentId} onChange={(event) => setRespondentId(event.target.value)}>
                {choices.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {formatResidentName(resident)} · {resident.lrn}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Classification</span>
              <select
                value={classification}
                onChange={(event) => setClassification(event.target.value as typeof classification)}
              >
                {["Physical", "Psychological", "Economic", "Sexual", "Threat or Harassment"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Risk level</span>
              <select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value as VawRiskLevel)}>
                <option>Critical</option>
                <option>High</option>
                <option>Moderate</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Incident date and time</span>
              <input type="datetime-local" value={incidentAt} onChange={(event) => setIncidentAt(event.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Location</span>
              <input value={location} onChange={(event) => setLocation(event.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Children affected</span>
              <input
                type="number"
                min="0"
                value={childrenAffected}
                onChange={(event) => setChildrenAffected(event.target.value)}
              />
            </label>
          </div>
          <label className={styles.field}>
            <span>Survivor account and requested assistance</span>
            <textarea rows={6} value={narrative} onChange={(event) => setNarrative(event.target.value)} />
          </label>
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Immediate protection</p>
              <h2>Safety plan</h2>
            </div>
          </div>
          <label className={styles.field}>
            <span>Agreed safety steps</span>
            <textarea rows={8} value={safetyPlan} onChange={(event) => setSafetyPlan(event.target.value)} />
          </label>
          <label className={styles.checkboxField}>
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>Consent or applicable lawful basis has been recorded for this restricted intake.</span>
          </label>
          <button className={styles.primaryButton} type="button" onClick={submit}>
            <ShieldCheck size={15} /> Save confidential intake
          </button>
        </aside>
      </div>
    </div>
  );
}

export function VawCaseDetailView({ id }: { id: string }) {
  const item = useVawStore((state) => state.cases.find((entry) => entry.id === id));
  const logAccess = useVawStore((state) => state.logAccess);
  const issueBpo = useVawStore((state) => state.issueBpo);
  const markServed = useVawStore((state) => state.markBpoServed);
  const updateStatus = useVawStore((state) => state.updateStatus);
  const [accessGranted, setAccessGranted] = useState(false);
  const [reason, setReason] = useState("Provide direct survivor assistance");
  const [conditions, setConditions] = useState(
    "No contact, intimidation, harassment, or approach within the safety distance recorded in the order.",
  );
  const [message, setMessage] = useState("");
  if (!item)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <h1>Restricted case not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/peace-order/vaw">
            Return to VAW Desk
          </Link>
        </div>
      </div>
    );
  if (!accessGranted)
    return (
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Restricted VAW Record</p>
            <h1>{item.caseNumber}</h1>
            <p>Record your purpose before the case body is displayed.</p>
          </div>
          <Link className={styles.secondaryButton} href="/barangay-affairs/peace-order/vaw">
            <ArrowLeft size={15} /> VAW Desk
          </Link>
        </header>
        <section className={`${styles.card} ${peaceStyles.accessGate}`}>
          <LockKeyhole size={34} />
          <h2>Purpose capture required</h2>
          <p>Your identity, reason, time, and this record will be written to the immutable access log.</p>
          <label className={styles.field}>
            <span>Reason for access</span>
            <select value={reason} onChange={(event) => setReason(event.target.value)}>
              <option>Provide direct survivor assistance</option>
              <option>Protection order processing</option>
              <option>Authorized case referral</option>
              <option>Scheduled case monitoring</option>
              <option>Supervisory case review</option>
            </select>
          </label>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => {
              logAccess(item.id, reason);
              setAccessGranted(true);
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
          <p className={styles.eyebrow}>Restricted VAW Case</p>
          <h1>{item.caseNumber}</h1>
          <p>
            {item.classification} · {MATNOG_BARANGAYS.find((barangay) => barangay.code === item.barangayId)?.name}
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/peace-order/vaw">
          <ArrowLeft size={15} /> VAW Desk
        </Link>
      </header>
      <div className={styles.detailGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Confidential record</p>
              <h2>Survivor and risk assessment</h2>
            </div>
            <span className={`${styles.badge} ${riskClass(item.riskLevel)}`}>{item.riskLevel} risk</span>
          </div>
          <dl className={styles.dataList}>
            <div className={styles.dataRow}>
              <dt>Survivor</dt>
              <dd>
                {item.survivor.fullName}
                <br />
                <small>
                  {item.survivor.contact} · {item.survivor.address}
                </small>
              </dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Respondent</dt>
              <dd>
                {item.respondent.fullName}
                <br />
                <small>{item.respondent.address}</small>
              </dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Incident</dt>
              <dd>
                {new Date(item.incidentAt).toLocaleString("en-PH")} · {item.location}
              </dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Account</dt>
              <dd>{item.narrative}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Safety plan</dt>
              <dd>{item.safetyPlan}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Caseworker</dt>
              <dd>{item.caseworker}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Referrals</dt>
              <dd>{item.referrals.join(", ") || "No external referral recorded"}</dd>
            </div>
          </dl>
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Protection</p>
              <h2>Case controls</h2>
            </div>
            <span className={`${styles.badge} ${styles.info}`}>{item.status}</span>
          </div>
          {item.protectionOrders.length === 0 ? (
            <>
              <label className={styles.field}>
                <span>BPO conditions</span>
                <textarea rows={6} value={conditions} onChange={(event) => setConditions(event.target.value)} />
              </label>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => {
                  issueBpo(item.id, conditions);
                  setMessage("Barangay Protection Order issued.");
                }}
              >
                <ShieldCheck size={15} /> Issue BPO
              </button>
            </>
          ) : (
            item.protectionOrders.map((order) => (
              <div className={peaceStyles.partySelected} key={order.id}>
                <strong>{order.number}</strong>
                <small>
                  {order.status} · expires {new Date(order.expiresAt).toLocaleDateString("en-PH")}
                </small>
                <small>{order.conditions}</small>
                {!order.servedAt && (
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={() => {
                      markServed(item.id, order.id);
                      setMessage("Protection order service recorded.");
                    }}
                  >
                    Mark as served
                  </button>
                )}
                {order.servedAt && <small>Served {new Date(order.servedAt).toLocaleString("en-PH")}</small>}
              </div>
            ))
          )}
          <label className={styles.field}>
            <span>Case status</span>
            <select
              value={item.status}
              onChange={(event) => {
                updateStatus(
                  item.id,
                  event.target.value as VawCaseStatus,
                  "Status updated after authorized case review.",
                );
                setMessage("Case status updated.");
              }}
            >
              {vawStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </aside>
      </div>
      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Restricted audit</p>
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
