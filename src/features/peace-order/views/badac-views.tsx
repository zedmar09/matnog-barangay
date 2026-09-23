"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  CalendarClock,
  FilePlus2,
  HandHeart,
  LockKeyhole,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useBadacStore } from "../stores/badac-store";
import type { BadacPriority, BadacRecordType, BadacStatus } from "../types/badac";
import type { IncidentParty } from "../types/blotter";
import peaceStyles from "./peace-order.module.css";

const statuses: BadacStatus[] = [
  "Restricted Intake",
  "Validation Review",
  "Intervention",
  "Agency Referral",
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
const priorityClass = (priority: BadacPriority) =>
  priority === "Urgent" ? styles.danger : priority === "High" ? styles.warning : styles.info;
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

export function BadacDeskView() {
  const records = useBadacStore((state) => state.records);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const rows = useMemo(
    () =>
      records.filter(
        (item) =>
          (selectedBarangay === "all" || item.barangayId === selectedBarangay) &&
          (!type || item.recordType === type) &&
          (!search.trim() ||
            `${item.recordNumber} ${item.status} ${item.assignedOfficer}`.toLowerCase().includes(search.toLowerCase())),
      ),
    [records, search, selectedBarangay, type],
  );
  const scoped = records.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  return (
    <div className={styles.page}>
      <div className={peaceStyles.restrictedBanner}>
        <LockKeyhole size={17} />
        BADAC records are separately restricted. Subject identities are masked and every read requires an explicit
        recorded reason.
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A5 Restricted BADAC</p>
          <h1>BADAC Case Management</h1>
          <p>Authorized validation, intervention support, agency referral, and monitoring.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/peace-order/badac/new">
          <FilePlus2 size={15} /> Restricted intake
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <LockKeyhole size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>Restricted records</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ShieldAlert size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.priority === "Urgent" && item.status !== "Closed").length}</strong>
            <span>Urgent review</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <HandHeart size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.status === "Intervention").length}</strong>
            <span>In intervention</span>
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
              aria-label="Search BADAC records"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search record number, status, or officer"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="BADAC record type"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="">All record types</option>
            <option>Community Report</option>
            <option>Voluntary Referral</option>
            <option>Intervention Client</option>
            <option>Agency Endorsement</option>
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} restricted records</strong>
          <span>Every record read is logged</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1080 }}>
            <thead>
              <tr>
                <th>Record</th>
                <th>Barangay</th>
                <th>Type</th>
                <th>Subject</th>
                <th>Source class</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Next review</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td className={styles.mono}>{item.recordNumber}</td>
                  <td>{barangayName(item.barangayId)}</td>
                  <td>{item.recordType}</td>
                  <td>{mask(item.subject.fullName)}</td>
                  <td>{item.sourceClass}</td>
                  <td>
                    <span className={`${styles.badge} ${priorityClass(item.priority)}`}>{item.priority}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${item.status === "Closed" ? styles.active : styles.info}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.nextReviewAt ? new Date(item.nextReviewAt).toLocaleDateString("en-PH") : "Not set"}</td>
                  <td>
                    <Link className={styles.secondaryButton} href={`/barangay-affairs/peace-order/badac/${item.id}`}>
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

export function BadacIntakeView() {
  const residents = useResidentRegistryStore((state) => state.residents);
  const createRecord = useBadacStore((state) => state.createRecord);
  const router = useRouter();
  const choices = residents.slice(0, 180);
  const [subjectId, setSubjectId] = useState(choices[6].id);
  const [recordType, setRecordType] = useState<BadacRecordType>("Community Report");
  const [priority, setPriority] = useState<BadacPriority>("High");
  const [sourceClass, setSourceClass] = useState<
    "Confidential Community Source" | "Self-Referral" | "Authorized Agency"
  >("Confidential Community Source");
  const [summary, setSummary] = useState("");
  const [validation, setValidation] = useState("");
  const [plan, setPlan] = useState("");
  const [basis, setBasis] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    if (!summary.trim() || !validation.trim() || !plan.trim() || !basis.trim()) {
      setError("Complete the concern, validation note, action plan, and lawful basis.");
      return;
    }
    const subject = residentParty(subjectId, residents);
    const value = createRecord({
      barangayId: residents.find((item) => item.id === subjectId)?.address.barangayId ?? MATNOG_BARANGAYS[0].code,
      subject,
      recordType,
      priority,
      sourceClass,
      concernSummary: summary,
      validationNotes: validation,
      interventionPlan: plan,
      lawfulBasis: basis,
    });
    router.push(`/barangay-affairs/peace-order/badac/${value.id}`);
  };
  return (
    <div className={styles.page}>
      {error && <div className={styles.toast}>{error}</div>}
      <div className={peaceStyles.restrictedBanner}>
        <ShieldAlert size={17} />
        Record only information needed for authorized validation, support, referral, and monitoring.
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Restricted BADAC Intake</p>
          <h1>New BADAC Record</h1>
          <p>Create a separately permissioned record with documented lawful basis.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/peace-order/badac">
          <ArrowLeft size={15} /> BADAC records
        </Link>
      </header>
      <div className={styles.detailGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Classification</p>
              <h2>Subject and intake source</h2>
            </div>
          </div>
          <div className={styles.filterGrid}>
            <label className={styles.field}>
              <span>Resident subject</span>
              <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
                {choices.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {formatResidentName(resident)} · {resident.lrn}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Record type</span>
              <select value={recordType} onChange={(event) => setRecordType(event.target.value as BadacRecordType)}>
                <option>Community Report</option>
                <option>Voluntary Referral</option>
                <option>Intervention Client</option>
                <option>Agency Endorsement</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Source class</span>
              <select
                value={sourceClass}
                onChange={(event) => setSourceClass(event.target.value as typeof sourceClass)}
              >
                <option>Confidential Community Source</option>
                <option>Self-Referral</option>
                <option>Authorized Agency</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Priority</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value as BadacPriority)}>
                <option>Urgent</option>
                <option>High</option>
                <option>Standard</option>
              </select>
            </label>
          </div>
          <label className={styles.field}>
            <span>Concern summary</span>
            <textarea rows={6} value={summary} onChange={(event) => setSummary(event.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Validation note</span>
            <textarea rows={4} value={validation} onChange={(event) => setValidation(event.target.value)} />
          </label>
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Authorized action</p>
              <h2>Support and legal basis</h2>
            </div>
          </div>
          <label className={styles.field}>
            <span>Intervention or referral plan</span>
            <textarea rows={7} value={plan} onChange={(event) => setPlan(event.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Lawful basis</span>
            <textarea rows={4} value={basis} onChange={(event) => setBasis(event.target.value)} />
          </label>
          <button className={styles.primaryButton} type="button" onClick={submit}>
            <ShieldCheck size={15} /> Save restricted intake
          </button>
        </aside>
      </div>
    </div>
  );
}

export function BadacRecordDetailView({ id }: { id: string }) {
  const item = useBadacStore((state) => state.records.find((entry) => entry.id === id));
  const logRead = useBadacStore((state) => state.logRead);
  const scheduleAction = useBadacStore((state) => state.scheduleAction);
  const updateStatus = useBadacStore((state) => state.updateStatus);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [scheduledAt, setScheduledAt] = useState("2026-09-30T10:00");
  const [venue, setVenue] = useState("Restricted BADAC Meeting Room");
  const [message, setMessage] = useState("");
  if (!item)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <h1>BADAC record not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/peace-order/badac">
            Return to BADAC
          </Link>
        </div>
      </div>
    );
  if (!open)
    return (
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Separately Restricted Record</p>
            <h1>{item.recordNumber}</h1>
            <p>An explicit operational reason is required for every read.</p>
          </div>
          <Link className={styles.secondaryButton} href="/barangay-affairs/peace-order/badac">
            <ArrowLeft size={15} /> BADAC records
          </Link>
        </header>
        <section className={`${styles.card} ${peaceStyles.accessGate}`}>
          <LockKeyhole size={34} />
          <h2>Explicit access reason required</h2>
          <p>The record, user, reason, and timestamp will be added to the full read log.</p>
          <label className={styles.field}>
            <span>Reason for this read</span>
            <textarea
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="State the authorized case-management purpose"
            />
          </label>
          <button
            className={styles.primaryButton}
            type="button"
            disabled={reason.trim().length < 12}
            onClick={() => {
              logRead(item.id, reason);
              setOpen(true);
            }}
          >
            <UserCheck size={15} /> Record reason and open record
          </button>
        </section>
      </div>
    );
  return (
    <div className={styles.page}>
      {message && <div className={styles.toast}>{message}</div>}
      <div className={peaceStyles.restrictedBanner}>
        <LockKeyhole size={17} />
        Read logged for: {reason}
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Restricted BADAC Record</p>
          <h1>{item.recordNumber}</h1>
          <p>
            {item.recordType} · {barangayName(item.barangayId)}
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/peace-order/badac">
          <ArrowLeft size={15} /> BADAC records
        </Link>
      </header>
      <div className={styles.detailGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Authorized case record</p>
              <h2>Validation and support</h2>
            </div>
            <span className={`${styles.badge} ${priorityClass(item.priority)}`}>{item.priority}</span>
          </div>
          <dl className={styles.dataList}>
            <div className={styles.dataRow}>
              <dt>Subject</dt>
              <dd>
                {item.subject.fullName}
                <br />
                <small>
                  {item.subject.contact} · {item.subject.address}
                </small>
              </dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Source class</dt>
              <dd>{item.sourceClass}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Concern</dt>
              <dd>{item.concernSummary}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Validation</dt>
              <dd>{item.validationNotes}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Support plan</dt>
              <dd>{item.interventionPlan}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Lawful basis</dt>
              <dd>{item.lawfulBasis}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Referrals</dt>
              <dd>{item.agencyReferrals.join(", ") || "No agency referral recorded"}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Assigned officer</dt>
              <dd>{item.assignedOfficer}</dd>
            </div>
          </dl>
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Authorized coordination</p>
              <h2>Next action</h2>
            </div>
            <span className={`${styles.badge} ${styles.info}`}>{item.status}</span>
          </div>
          <label className={styles.field}>
            <span>Review date and time</span>
            <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Restricted venue</span>
            <input value={venue} onChange={(event) => setVenue(event.target.value)} />
          </label>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => {
              scheduleAction(item.id, new Date(scheduledAt).toISOString(), venue);
              setMessage("Authorized validation review scheduled.");
            }}
          >
            <CalendarClock size={15} /> Schedule validation review
          </button>
          <label className={styles.field}>
            <span>Record status</span>
            <select
              value={item.status}
              onChange={(event) => {
                updateStatus(
                  item.id,
                  event.target.value as BadacStatus,
                  `Status updated during authorized review: ${reason}`,
                );
                setMessage("Record status updated.");
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
            <p className={styles.eyebrow}>Restricted activities</p>
            <h2>Coordination history</h2>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 780 }}>
            <thead>
              <tr>
                <th>Action</th>
                <th>Schedule</th>
                <th>Venue</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {item.actions.length === 0 ? (
                <tr>
                  <td colSpan={5}>No authorized action scheduled.</td>
                </tr>
              ) : (
                item.actions.map((action) => (
                  <tr key={action.id}>
                    <td>{action.type}</td>
                    <td>{new Date(action.scheduledAt).toLocaleString("en-PH")}</td>
                    <td>{action.venue}</td>
                    <td>{action.status}</td>
                    <td>{action.notes}</td>
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
            <p className={styles.eyebrow}>Full read logging</p>
            <h2>Access and action log</h2>
          </div>
          <span className={`${styles.badge} ${styles.info}`}>{item.auditTrail.length} events</span>
        </div>
        <div className={peaceStyles.caseTimeline}>
          {[...item.auditTrail].reverse().map((event) => (
            <article key={event.id}>
              <strong>{event.action}</strong>
              <p>{event.accessReason}</p>
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
