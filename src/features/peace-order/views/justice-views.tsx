"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FilePlus2,
  Gavel,
  Search,
  Send,
  ShieldAlert,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useJusticeStore } from "../stores/justice-store";
import { usePeaceOrderStore } from "../stores/peace-order-store";
import type { JusticeCase, JusticeStage } from "../types/justice";
import peaceStyles from "./peace-order.module.css";

const stages: JusticeStage[] = [
  "For Summons",
  "Lupon Conciliation",
  "Pangkat Hearing",
  "Settlement",
  "Repudiation Period",
  "For CFA",
  "CFA Issued",
  "Closed",
];

function stageClass(stage: JusticeStage) {
  if (["CFA Issued", "Closed", "Settlement"].includes(stage)) return styles.active;
  if (["Repudiation Period", "For CFA"].includes(stage)) return styles.warning;
  if (stage === "For Summons") return styles.danger;
  return styles.info;
}

function barangayName(id: string) {
  return MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
}

function deadlineText(value: string) {
  const days = Math.ceil((new Date(value).getTime() - new Date("2026-09-23T00:00:00+08:00").getTime()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return "Due today";
  return `${days} days remaining`;
}

export function JusticeMasterlistView() {
  const cases = useJusticeStore((state) => state.cases);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const rows = useMemo(
    () =>
      cases.filter(
        (item) =>
          (selectedBarangay === "all" || item.barangayId === selectedBarangay) &&
          (!stage || item.stage === stage) &&
          (!search.trim() ||
            `${item.caseNumber} ${item.sourceBlotterNumber} ${item.complainant.fullName} ${item.respondent.fullName} ${item.subject}`
              .toLowerCase()
              .includes(search.toLowerCase())),
      ),
    [cases, search, selectedBarangay, stage],
  );
  const scoped = cases.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);

  return (
    <div className={styles.page}>
      <div className={peaceStyles.restrictedBanner}>
        <ShieldAlert size={17} />
        Barangay justice records are restricted. Case bodies and actions are available only within the assigned
        barangay.
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A5 Katarungang Pambarangay</p>
          <h1>Barangay Justice</h1>
          <p>Track conciliation from complaint filing through settlement or Certificate to File Action.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/peace-order/justice/new">
          <FilePlus2 size={15} /> Open KP case
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Gavel size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>KP cases</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Send size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.stage === "For Summons").length}</strong>
            <span>For summons</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CalendarClock size={18} />
          </span>
          <div>
            <strong>
              {scoped.filter((item) => ["Lupon Conciliation", "Pangkat Hearing"].includes(item.stage)).length}
            </strong>
            <span>In conciliation</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <FileCheck2 size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.stage === "For CFA").length}</strong>
            <span>Eligible for CFA</span>
          </div>
        </div>
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search justice cases"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search case, blotter, party, or subject"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="Justice stage"
            value={stage}
            onChange={(event) => setStage(event.target.value)}
          >
            <option value="">All stages</option>
            {stages.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} cases</strong>
          <span>Showing the latest 30</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1160 }}>
            <thead>
              <tr>
                <th>KP case</th>
                <th>Blotter</th>
                <th>Barangay</th>
                <th>Subject</th>
                <th>Parties</th>
                <th>Stage</th>
                <th>Statutory clock</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 30).map((item) => (
                <tr key={item.id}>
                  <td className={styles.mono}>{item.caseNumber}</td>
                  <td className={styles.mono}>{item.sourceBlotterNumber}</td>
                  <td>{barangayName(item.barangayId)}</td>
                  <td>{item.subject}</td>
                  <td>
                    {item.complainant.fullName}
                    <br />
                    <small>vs. {item.respondent.fullName}</small>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${stageClass(item.stage)}`}>{item.stage}</span>
                  </td>
                  <td>{deadlineText(item.statutoryDeadline)}</td>
                  <td>
                    <Link className={styles.secondaryButton} href={`/barangay-affairs/peace-order/justice/${item.id}`}>
                      Open case
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

export function JusticeCaseFormView() {
  const blotter = usePeaceOrderStore((state) => state.blotterRecords);
  const cases = useJusticeStore((state) => state.cases);
  const createCase = useJusticeStore((state) => state.createCase);
  const router = useRouter();
  const referred = blotter.filter(
    (item) => item.status === "Referred to Lupon" && !cases.some((entry) => entry.sourceBlotterId === item.id),
  );
  const [sourceId, setSourceId] = useState(referred[0]?.id ?? "");
  const [chairperson, setChairperson] = useState("Punong Barangay / Lupon Chairperson");
  const [error, setError] = useState("");
  const selected = referred.find((item) => item.id === sourceId);

  const submit = () => {
    if (!selected || !chairperson.trim()) {
      setError("Select a referred blotter record and enter the Lupon chairperson.");
      return;
    }
    const value = createCase({
      barangayId: selected.barangayId,
      sourceBlotterId: selected.id,
      sourceBlotterNumber: selected.caseNumber,
      subject: selected.incidentType,
      complainant: selected.complainant,
      respondent: selected.respondent,
      luponChairperson: chairperson,
    });
    router.push(`/barangay-affairs/peace-order/justice/${value.id}`);
  };

  return (
    <div className={styles.page}>
      {error && <div className={styles.toast}>{error}</div>}
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>KP complaint filing</p>
          <h1>Open Barangay Justice Case</h1>
          <p>Start conciliation from a blotter record formally referred to the Lupon.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/peace-order/justice">
          <ArrowLeft size={15} /> Justice cases
        </Link>
      </header>
      <div className={styles.detailGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Source complaint</p>
              <h2>Referred blotter record</h2>
            </div>
          </div>
          <label className={styles.field}>
            <span>Blotter case</span>
            <select value={sourceId} onChange={(event) => setSourceId(event.target.value)}>
              {referred.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.caseNumber} · {item.incidentType} · {item.complainant.fullName}
                </option>
              ))}
            </select>
          </label>
          {selected && (
            <dl className={styles.dataList}>
              <div className={styles.dataRow}>
                <dt>Barangay</dt>
                <dd>{barangayName(selected.barangayId)}</dd>
              </div>
              <div className={styles.dataRow}>
                <dt>Complainant</dt>
                <dd>{selected.complainant.fullName}</dd>
              </div>
              <div className={styles.dataRow}>
                <dt>Respondent</dt>
                <dd>{selected.respondent.fullName}</dd>
              </div>
              <div className={styles.dataRow}>
                <dt>Incident</dt>
                <dd>{selected.narrative}</dd>
              </div>
            </dl>
          )}
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Assignment</p>
              <h2>Lupon responsibility</h2>
            </div>
          </div>
          <label className={styles.field}>
            <span>Lupon chairperson</span>
            <input value={chairperson} onChange={(event) => setChairperson(event.target.value)} />
          </label>
          <div className={peaceStyles.partySelected}>
            <Clock3 size={17} />
            <strong>Statutory clock starts upon filing</strong>
            <small>The initial deadline is automatically set 15 days from the filing date.</small>
          </div>
          <button className={styles.primaryButton} type="button" disabled={!selected} onClick={submit}>
            <FilePlus2 size={15} /> Open KP case
          </button>
        </aside>
      </div>
    </div>
  );
}

function CaseWorkflow({ item }: { item: JusticeCase }) {
  return (
    <div className={peaceStyles.workflowStrip}>
      {["Filed", "Summons", "Lupon", "Pangkat", "Outcome", "CFA / Closed"].map((label, index) => {
        const stageIndex = Math.max(0, stages.indexOf(item.stage));
        const current = Math.min(5, stageIndex === 0 ? 1 : stageIndex <= 2 ? stageIndex + 1 : stageIndex <= 4 ? 4 : 5);
        return (
          <div key={label} className={index <= current ? peaceStyles.workflowDone : ""}>
            <span>{index + 1}</span>
            <small>{label}</small>
          </div>
        );
      })}
    </div>
  );
}

export function JusticeCaseDetailView({ id }: { id: string }) {
  const item = useJusticeStore((state) => state.cases.find((entry) => entry.id === id));
  const schedule = useJusticeStore((state) => state.scheduleHearing);
  const recordOutcome = useJusticeStore((state) => state.recordOutcome);
  const issueCfa = useJusticeStore((state) => state.issueCfa);
  const advance = useJusticeStore((state) => state.advanceStage);
  const [hearingAt, setHearingAt] = useState("2026-09-28T09:00");
  const [venue, setVenue] = useState("Barangay Hall Mediation Room");
  const [note, setNote] = useState("Parties were heard and the proceedings were entered in the case record.");
  const [message, setMessage] = useState("");
  if (!item)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <h1>Justice case not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/peace-order/justice">
            Return to cases
          </Link>
        </div>
      </div>
    );

  const addHearing = () => {
    if (!hearingAt || !venue.trim()) return;
    schedule(item.id, new Date(hearingAt).toISOString(), venue);
    setMessage("Hearing scheduled and summons added to the service queue.");
  };
  const outcome = (value: "Settled" | "Failed") => {
    if (!note.trim()) return;
    recordOutcome(item.id, value, note);
    setMessage(
      value === "Settled"
        ? "Settlement recorded; repudiation window opened."
        : "Failed conciliation recorded; case is eligible for CFA.",
    );
  };

  return (
    <div className={styles.page}>
      {message && <div className={styles.toast}>{message}</div>}
      <div className={peaceStyles.restrictedBanner}>
        <ShieldAlert size={17} />
        Viewing and changing this case is written to its audit trail.
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A5 Barangay Justice Case</p>
          <h1>{item.caseNumber}</h1>
          <p>
            {item.subject} · {barangayName(item.barangayId)}
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/peace-order/justice">
          <ArrowLeft size={15} /> Justice cases
        </Link>
      </header>
      <CaseWorkflow item={item} />
      <div className={styles.detailGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Case record</p>
              <h2>Complaint and parties</h2>
            </div>
            <span className={`${styles.badge} ${stageClass(item.stage)}`}>{item.stage}</span>
          </div>
          <dl className={styles.dataList}>
            <div className={styles.dataRow}>
              <dt>Source blotter</dt>
              <dd>
                <Link href={`/barangay-affairs/peace-order/blotter/${item.sourceBlotterId}`}>
                  {item.sourceBlotterNumber}
                </Link>
              </dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Complainant</dt>
              <dd>
                {item.complainant.fullName}
                <br />
                <small>{item.complainant.address}</small>
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
              <dt>Lupon chairperson</dt>
              <dd>{item.luponChairperson}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Statutory deadline</dt>
              <dd>
                {new Date(item.statutoryDeadline).toLocaleString("en-PH")} · {deadlineText(item.statutoryDeadline)}
              </dd>
            </div>
            {item.outcome && (
              <div className={styles.dataRow}>
                <dt>Outcome</dt>
                <dd>
                  {item.outcome}
                  {item.settlementTerms && (
                    <>
                      <br />
                      <small>{item.settlementTerms}</small>
                    </>
                  )}
                </dd>
              </div>
            )}
            {item.repudiationDeadline && (
              <div className={styles.dataRow}>
                <dt>Repudiation deadline</dt>
                <dd>{new Date(item.repudiationDeadline).toLocaleString("en-PH")}</dd>
              </div>
            )}
            {item.cfaNumber && (
              <div className={styles.dataRow}>
                <dt>CFA</dt>
                <dd>
                  {item.cfaNumber} · {new Date(item.cfaIssuedAt).toLocaleString("en-PH")}
                </dd>
              </div>
            )}
          </dl>
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Next action</p>
              <h2>Case controls</h2>
            </div>
          </div>
          {["For Summons", "Lupon Conciliation", "Pangkat Hearing"].includes(item.stage) && (
            <>
              <label className={styles.field}>
                <span>Hearing date and time</span>
                <input type="datetime-local" value={hearingAt} onChange={(event) => setHearingAt(event.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Venue</span>
                <input value={venue} onChange={(event) => setVenue(event.target.value)} />
              </label>
              <button className={styles.primaryButton} type="button" onClick={addHearing}>
                <CalendarClock size={15} /> Schedule hearing
              </button>
            </>
          )}
          {["Lupon Conciliation", "Pangkat Hearing"].includes(item.stage) && (
            <>
              <label className={styles.field}>
                <span>Proceeding note</span>
                <textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} />
              </label>
              <div className={styles.headerButtonGroup}>
                <button className={styles.primaryButton} type="button" onClick={() => outcome("Settled")}>
                  <CheckCircle2 size={15} /> Record settlement
                </button>
                <button className={styles.secondaryButton} type="button" onClick={() => outcome("Failed")}>
                  <Gavel size={15} /> Failed conciliation
                </button>
              </div>
            </>
          )}
          {item.stage === "Repudiation Period" && (
            <button
              className={styles.primaryButton}
              type="button"
              onClick={() => {
                advance(item.id, "Closed", "Repudiation period completed without a valid repudiation.");
                setMessage("Repudiation window completed; settlement is final.");
              }}
            >
              <CheckCircle2 size={15} /> Finalize settlement
            </button>
          )}
          {item.stage === "For CFA" && (
            <button
              className={styles.primaryButton}
              type="button"
              onClick={() => {
                issueCfa(item.id);
                setMessage("Certificate to File Action issued.");
              }}
            >
              <FileCheck2 size={15} /> Issue CFA
            </button>
          )}
          {["CFA Issued", "Closed"].includes(item.stage) && (
            <div className={peaceStyles.partySelected}>
              <CheckCircle2 size={18} />
              <strong>Workflow complete</strong>
              <small>{item.stage === "CFA Issued" ? item.cfaNumber : "Settlement is final and recorded."}</small>
            </div>
          )}
        </aside>
      </div>
      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Hearings and summons</p>
            <h2>Proceedings</h2>
          </div>
          <Link className={styles.secondaryButton} href="/barangay-affairs/peace-order/hearings">
            Open service queue
          </Link>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 850 }}>
            <thead>
              <tr>
                <th>Proceeding</th>
                <th>Schedule</th>
                <th>Venue</th>
                <th>Complainant summons</th>
                <th>Respondent summons</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {item.hearings.length === 0 ? (
                <tr>
                  <td colSpan={6}>No hearing has been scheduled.</td>
                </tr>
              ) : (
                item.hearings.map((hearing) => (
                  <tr key={hearing.id}>
                    <td>{hearing.type}</td>
                    <td>{new Date(hearing.scheduledAt).toLocaleString("en-PH")}</td>
                    <td>{hearing.venue}</td>
                    <td>{hearing.complainantSummons}</td>
                    <td>{hearing.respondentSummons}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${hearing.status === "Completed" ? styles.active : styles.info}`}
                      >
                        {hearing.status}
                      </span>
                    </td>
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
            <p className={styles.eyebrow}>Accountability</p>
            <h2>Case audit trail</h2>
          </div>
          <span className={`${styles.badge} ${styles.info}`}>{item.auditTrail.length} events</span>
        </div>
        <div className={peaceStyles.caseTimeline}>
          {[...item.auditTrail].reverse().map((event) => (
            <article key={event.id}>
              <strong>{event.action}</strong>
              <p>{event.note}</p>
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

export function HearingsAndSummonsView() {
  const cases = useJusticeStore((state) => state.cases);
  const updateSummons = useJusticeStore((state) => state.updateSummons);
  const { selectedBarangay } = useBarangayScope();
  const [status, setStatus] = useState("");
  const rows = cases
    .filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay)
    .flatMap((item) => item.hearings.map((hearing) => ({ item, hearing })))
    .filter(({ hearing }) => !status || hearing.status === status)
    .sort((a, b) => b.hearing.scheduledAt.localeCompare(a.hearing.scheduledAt));

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A5 Hearing Operations</p>
          <h1>Hearings & Summons</h1>
          <p>Manage schedules and confirm service to each party.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/peace-order/justice">
          <Gavel size={15} /> Justice cases
        </Link>
      </header>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <select
            className={styles.compactSelect}
            aria-label="Hearing status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All hearing statuses</option>
            <option>Scheduled</option>
            <option>Completed</option>
            <option>Reset</option>
            <option>Cancelled</option>
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} proceedings</strong>
          <span>Summons actions are written to the case audit trail</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1180 }}>
            <thead>
              <tr>
                <th>KP case</th>
                <th>Proceeding</th>
                <th>Schedule</th>
                <th>Parties</th>
                <th>Complainant summons</th>
                <th>Respondent summons</th>
                <th>Hearing</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 40).map(({ item, hearing }) => (
                <tr key={hearing.id}>
                  <td>
                    <Link href={`/barangay-affairs/peace-order/justice/${item.id}`} className={styles.mono}>
                      {item.caseNumber}
                    </Link>
                  </td>
                  <td>{hearing.type}</td>
                  <td>
                    {new Date(hearing.scheduledAt).toLocaleString("en-PH")}
                    <br />
                    <small>{hearing.venue}</small>
                  </td>
                  <td>
                    {item.complainant.fullName}
                    <br />
                    <small>vs. {item.respondent.fullName}</small>
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${hearing.complainantSummons === "Served" ? styles.active : styles.warning}`}
                    >
                      {hearing.complainantSummons}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${hearing.respondentSummons === "Served" ? styles.active : styles.warning}`}
                    >
                      {hearing.respondentSummons}
                    </span>
                  </td>
                  <td>{hearing.status}</td>
                  <td>
                    <div className={styles.rowActions}>
                      {hearing.complainantSummons !== "Served" && (
                        <button
                          className={styles.secondaryButton}
                          type="button"
                          onClick={() => updateSummons(item.id, hearing.id, "complainant", "Served")}
                        >
                          Serve complainant
                        </button>
                      )}
                      {hearing.respondentSummons !== "Served" && (
                        <button
                          className={styles.secondaryButton}
                          type="button"
                          onClick={() => updateSummons(item.id, hearing.id, "respondent", "Served")}
                        >
                          Serve respondent
                        </button>
                      )}
                    </div>
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

export function CfaProcessingView() {
  const cases = useJusticeStore((state) => state.cases);
  const issueCfa = useJusticeStore((state) => state.issueCfa);
  const { selectedBarangay } = useBarangayScope();
  const rows = cases.filter(
    (item) =>
      (selectedBarangay === "all" || item.barangayId === selectedBarangay) &&
      ["For CFA", "CFA Issued"].includes(item.stage),
  );
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A5 Certificate Processing</p>
          <h1>Certificate to File Action</h1>
          <p>Review failed conciliation cases and control CFA issuance.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/peace-order/justice">
          <ArrowLeft size={15} /> Justice cases
        </Link>
      </header>
      <div className={peaceStyles.restrictedBanner}>
        <ShieldAlert size={17} />A CFA may be issued only after the required barangay conciliation steps are recorded as
        failed.
      </div>
      <section className={styles.card}>
        <div className={styles.resultsMeta}>
          <strong>{rows.filter((item) => item.stage === "For CFA").length} awaiting issuance</strong>
          <span>{rows.filter((item) => item.stage === "CFA Issued").length} issued</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1050 }}>
            <thead>
              <tr>
                <th>KP case</th>
                <th>Barangay</th>
                <th>Parties</th>
                <th>Failed conciliation</th>
                <th>CFA number</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link href={`/barangay-affairs/peace-order/justice/${item.id}`} className={styles.mono}>
                      {item.caseNumber}
                    </Link>
                  </td>
                  <td>{barangayName(item.barangayId)}</td>
                  <td>
                    {item.complainant.fullName}
                    <br />
                    <small>vs. {item.respondent.fullName}</small>
                  </td>
                  <td>
                    {item.hearings.filter((hearing) => hearing.status === "Completed").length} proceedings recorded
                  </td>
                  <td className={styles.mono}>{item.cfaNumber || "Pending"}</td>
                  <td>
                    <span className={`${styles.badge} ${item.stage === "CFA Issued" ? styles.active : styles.warning}`}>
                      {item.stage}
                    </span>
                  </td>
                  <td>
                    {item.stage === "For CFA" ? (
                      <button className={styles.primaryButton} type="button" onClick={() => issueCfa(item.id)}>
                        <FileCheck2 size={15} /> Issue CFA
                      </button>
                    ) : (
                      <Link
                        className={styles.secondaryButton}
                        href={`/barangay-affairs/peace-order/justice/${item.id}`}
                      >
                        View certificate
                      </Link>
                    )}
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
