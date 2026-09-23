"use client";

import { type FormEvent, useMemo, useState } from "react";

import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Inbox,
  MessageSquareText,
  Send,
  Star,
  UserCheck,
  UsersRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { FRONTLINE_SERVICES } from "../data/frontline-data";
import { useFrontlineStore } from "../stores/frontline-store";
import type { FeedbackCategory, FeedbackStatus, FrontlineTicket } from "../types/frontline";
import frontlineStyles from "./frontline.module.css";

const OFFICERS = ["Maria Reyes", "Joel Santos", "Ana Dela Cruz", "Ramon Garcia", "Liza Mendoza", "Carlo Bautista"];
const COUNTERS = ["Counter 1", "Counter 2", "Counter 3", "Counter 4", "Counter 5"];
const CATEGORIES: FeedbackCategory[] = [
  "Service complaint",
  "Staff conduct",
  "Delay",
  "Facility",
  "Suggestion",
  "Commendation",
];
const FEEDBACK_STATUSES: Array<FeedbackStatus | "All statuses"> = [
  "All statuses",
  "New",
  "Assigned",
  "Under review",
  "Resolved",
];

const serviceFor = (id: string) => FRONTLINE_SERVICES.find((item) => item.id === id) ?? FRONTLINE_SERVICES[0];
const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const dateTime = (value: string) =>
  value
    ? new Date(value).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "—";
const minutesBetween = (start: string, end: string) =>
  Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000));

function StatusBadge({ status }: { status: FeedbackStatus }) {
  const statusClass =
    status === "Resolved"
      ? styles.active
      : status === "Under review" || status === "Assigned"
        ? styles.info
        : status === "New"
          ? styles.warning
          : styles.warning;
  return <span className={`${styles.badge} ${statusClass}`}>{status}</span>;
}

function Rating({ value }: { value: number }) {
  return (
    <span className={frontlineStyles.rating} aria-label={`${value} out of 5 stars`} role="img">
      <Star size={12} fill="currentColor" /> {value}.0
    </span>
  );
}

export function FrontlineFeedbackView() {
  const feedbacks = useFrontlineStore((state) => state.feedbacks);
  const requests = useFrontlineStore((state) => state.requests);
  const addFeedback = useFrontlineStore((state) => state.addFeedback);
  const assignFeedback = useFrontlineStore((state) => state.assignFeedback);
  const resolveFeedback = useFrontlineStore((state) => state.resolveFeedback);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof FEEDBACK_STATUSES)[number]>("All statuses");
  const [serviceReference, setServiceReference] = useState(requests[0]?.publicReference ?? "");
  const [category, setCategory] = useState<FeedbackCategory>("Service complaint");
  const [rating, setRating] = useState(3);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");

  const residentMap = useMemo(
    () => new Map(residents.map((resident) => [resident.id, formatResidentName(resident)])),
    [residents],
  );
  const scopedRequests = requests.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const scopedFeedback = feedbacks.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const filteredFeedback = scopedFeedback.filter((item) => {
    const haystack =
      `${item.feedbackReference} ${item.serviceReference} ${item.category} ${item.message} ${residentMap.get(item.residentId) ?? ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (status === "All statuses" || item.status === status);
  });
  const linkedRequest = requests.find((item) => item.publicReference === serviceReference);
  const averageRating = scopedFeedback.length
    ? (scopedFeedback.reduce((total, item) => total + item.rating, 0) / scopedFeedback.length).toFixed(1)
    : "0.0";

  const submitFeedback = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!linkedRequest || !message.trim()) return;
    const created = addFeedback({
      serviceReference,
      residentId: linkedRequest.residentId,
      category,
      rating,
      message: message.trim(),
    });
    setNotice(`${created.feedbackReference} was recorded and sent to ${created.assignedOffice}.`);
    setMessage("");
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A8 Frontline Services</p>
          <h1>Complaints &amp; Feedback</h1>
          <p>Capture, assign, and resolve citizen feedback for {selectedBarangayName}.</p>
        </div>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Inbox size={18} />
          </span>
          <div>
            <strong>{scopedFeedback.length}</strong>
            <span>Total submissions</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <MessageSquareText size={18} />
          </span>
          <div>
            <strong>{scopedFeedback.filter((item) => item.status === "New").length}</strong>
            <span>New and unassigned</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Clock3 size={18} />
          </span>
          <div>
            <strong>
              {scopedFeedback.filter((item) => item.status === "Assigned" || item.status === "Under review").length}
            </strong>
            <span>Being reviewed</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Star size={18} />
          </span>
          <div>
            <strong>{averageRating}</strong>
            <span>Average citizen rating</span>
          </div>
        </div>
      </div>

      {notice ? (
        <div className={frontlineStyles.successNotice}>
          <CheckCircle2 size={16} /> {notice}
        </div>
      ) : null}

      <div className={frontlineStyles.feedbackLayout}>
        <section className={styles.card}>
          <div className={frontlineStyles.panelHeading}>
            <MessageSquareText size={18} />
            <div>
              <strong>Record a submission</strong>
              <small>Link feedback to an existing public service reference</small>
            </div>
          </div>
          <form className={frontlineStyles.feedbackForm} onSubmit={submitFeedback}>
            <label className={styles.field}>
              <span>Service reference</span>
              <select value={serviceReference} onChange={(event) => setServiceReference(event.target.value)}>
                {scopedRequests.slice(0, 120).map((request) => (
                  <option key={request.id} value={request.publicReference}>
                    {request.publicReference} · {serviceFor(request.serviceId).name}
                  </option>
                ))}
              </select>
            </label>
            <div className={frontlineStyles.linkedRecord}>
              <span className={frontlineStyles.linkedRecordLabel}>Resident</span>
              <strong className={frontlineStyles.linkedRecordName}>
                {linkedRequest ? residentMap.get(linkedRequest.residentId) : "Select a service reference"}
              </strong>
              <small className={frontlineStyles.linkedRecordMeta}>
                {linkedRequest
                  ? `${barangayName(linkedRequest.barangayId)} · ${linkedRequest.assignedOffice}`
                  : "No linked record"}
              </small>
            </div>
            <label className={styles.field}>
              <span>Feedback type</span>
              <select value={category} onChange={(event) => setCategory(event.target.value as FeedbackCategory)}>
                {CATEGORIES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <div className={styles.field}>
              <span>Citizen rating</span>
              <div className={frontlineStyles.ratingPicker}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    className={value <= rating ? frontlineStyles.ratingSelected : ""}
                    type="button"
                    onClick={() => setRating(value)}
                    aria-label={`${value} stars`}
                  >
                    <Star size={17} fill={value <= rating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>
            <label className={styles.field}>
              <span>Message</span>
              <textarea
                required
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Describe the concern, suggestion, or commendation…"
              />
            </label>
            <button className={styles.primaryButton} type="submit">
              <Send size={14} /> Submit feedback
            </button>
          </form>
        </section>

        <section className={styles.card}>
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <MessageSquareText size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search reference, resident, or message"
              />
            </div>
            <select
              className={styles.compactSelect}
              value={status}
              onChange={(event) => setStatus(event.target.value as (typeof FEEDBACK_STATUSES)[number])}
            >
              {FEEDBACK_STATUSES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className={styles.resultsMeta}>
            <span>
              <strong>{filteredFeedback.length}</strong> submissions
            </span>
            <span>{scopedFeedback.filter((item) => item.status === "Resolved").length} resolved</span>
          </div>
          <div className={frontlineStyles.managementTableWrap}>
            <table className={frontlineStyles.managementTable}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Citizen &amp; service</th>
                  <th>Feedback</th>
                  <th>Status</th>
                  <th>Assignment</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedback.slice(0, 60).map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong className={frontlineStyles.ticketNumber}>{item.feedbackReference}</strong>
                      <span className={frontlineStyles.tableSub}>{item.serviceReference}</span>
                    </td>
                    <td>
                      <strong>{residentMap.get(item.residentId) ?? "Resident record"}</strong>
                      <span className={frontlineStyles.tableSub}>
                        {barangayName(item.barangayId)} · {item.assignedOffice}
                      </span>
                    </td>
                    <td>
                      <div className={frontlineStyles.feedbackMessage}>
                        <span className={frontlineStyles.feedbackCategory}>{item.category}</span>
                        <Rating value={item.rating} />
                        <p>{item.message}</p>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>{item.assignedOfficer || "Unassigned"}</td>
                    <td>{dateTime(item.submittedAt)}</td>
                    <td>
                      <div className={frontlineStyles.actionRow}>
                        {item.status === "New" ? (
                          <button type="button" onClick={() => assignFeedback(item.id)}>
                            <UserCheck size={13} /> Assign to me
                          </button>
                        ) : null}
                        {item.status !== "Resolved" ? (
                          <button
                            className={frontlineStyles.quietAction}
                            type="button"
                            onClick={() => resolveFeedback(item.id)}
                          >
                            <CheckCircle2 size={13} /> Resolve
                          </button>
                        ) : (
                          <span className={frontlineStyles.resolvedText}>
                            <CheckCircle2 size={13} /> Closed
                          </span>
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
    </div>
  );
}

type AssignmentDraft = Record<string, { officer: string; counter: string }>;

export function FrontlineAssignmentsView() {
  const tickets = useFrontlineStore((state) => state.tickets);
  const assignTicket = useFrontlineStore((state) => state.assignTicket);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [drafts, setDrafts] = useState<AssignmentDraft>({});
  const [notice, setNotice] = useState("");
  const residentMap = useMemo(() => new Map(residents.map((item) => [item.id, formatResidentName(item)])), [residents]);
  const scoped = tickets.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const active = scoped.filter((item) => ["Waiting", "Called", "Serving"].includes(item.status));
  const unassigned = active.filter((item) => !item.officer);

  const updateDraft = (id: string, field: "officer" | "counter", value: string) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        officer: current[id]?.officer ?? OFFICERS[0],
        counter: current[id]?.counter ?? COUNTERS[0],
        [field]: value,
      },
    }));
  };
  const saveAssignment = (ticket: FrontlineTicket) => {
    const draft = drafts[ticket.id] ?? { officer: OFFICERS[0], counter: COUNTERS[0] };
    assignTicket(ticket.id, draft.officer, draft.counter);
    setNotice(`${ticket.ticketNumber} was assigned to ${draft.officer} at ${draft.counter}.`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A8 Frontline Services</p>
          <h1>Officer Assignments</h1>
          <p>Balance active counter work across the {selectedBarangayName} service team.</p>
        </div>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <UsersRound size={18} />
          </span>
          <div>
            <strong>{active.length}</strong>
            <span>Active queue items</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Inbox size={18} />
          </span>
          <div>
            <strong>{unassigned.length}</strong>
            <span>Waiting for assignment</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <UserCheck size={18} />
          </span>
          <div>
            <strong>{active.filter((item) => item.officer).length}</strong>
            <span>Assigned to an officer</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ClipboardCheck size={18} />
          </span>
          <div>
            <strong>{OFFICERS.length}</strong>
            <span>Available counter officers</span>
          </div>
        </div>
      </div>
      {notice ? (
        <div className={frontlineStyles.successNotice}>
          <CheckCircle2 size={16} /> {notice}
        </div>
      ) : null}

      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Team capacity</p>
            <h2>Current officer workload</h2>
          </div>
        </div>
        <div className={frontlineStyles.officerGrid}>
          {OFFICERS.map((officer, index) => {
            const assigned = active.filter((item) => item.officer === officer);
            const serving = assigned.filter((item) => item.status === "Serving").length;
            return (
              <article key={officer}>
                <span className={frontlineStyles.officerAvatar}>
                  {officer
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </span>
                <div>
                  <strong>{officer}</strong>
                  <small>{COUNTERS[index % COUNTERS.length]}</small>
                </div>
                <b>{assigned.length}</b>
                <small>active</small>
                <div className={frontlineStyles.loadBar}>
                  <span
                    className={frontlineStyles.loadFill}
                    style={{ width: `${Math.min(100, assigned.length * 18)}%` }}
                  />
                </div>
                <footer>
                  {serving} serving · {assigned.length - serving} queued
                </footer>
              </article>
            );
          })}
        </div>
      </section>

      <section className={`${styles.card} ${frontlineStyles.assignmentPanel}`}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Dispatch</p>
            <h2>Unassigned service requests</h2>
          </div>
          <span className={frontlineStyles.countPill}>{unassigned.length} pending</span>
        </div>
        <div className={frontlineStyles.managementTableWrap}>
          <table className={frontlineStyles.managementTable}>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Resident</th>
                <th>Service &amp; priority</th>
                <th>Officer</th>
                <th>Counter</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {unassigned.slice(0, 50).map((item) => {
                const draft = drafts[item.id] ?? { officer: OFFICERS[0], counter: COUNTERS[0] };
                return (
                  <tr key={item.id}>
                    <td>
                      <strong className={frontlineStyles.ticketNumber}>{item.ticketNumber}</strong>
                      <span className={frontlineStyles.tableSub}>{item.publicReference}</span>
                    </td>
                    <td>
                      <strong>{residentMap.get(item.residentId) ?? "Resident record"}</strong>
                      <span className={frontlineStyles.tableSub}>{barangayName(item.barangayId)}</span>
                    </td>
                    <td>
                      {serviceFor(item.serviceId).name}
                      <span className={frontlineStyles.tableSub}>
                        {item.priority} · {dateTime(item.issuedAt)}
                      </span>
                    </td>
                    <td>
                      <select
                        className={frontlineStyles.inlineSelect}
                        value={draft.officer}
                        onChange={(event) => updateDraft(item.id, "officer", event.target.value)}
                      >
                        {OFFICERS.map((officer) => (
                          <option key={officer}>{officer}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className={frontlineStyles.inlineSelect}
                        value={draft.counter}
                        onChange={(event) => updateDraft(item.id, "counter", event.target.value)}
                      >
                        {COUNTERS.map((counter) => (
                          <option key={counter}>{counter}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className={frontlineStyles.actionRow}>
                        <button type="button" onClick={() => saveAssignment(item)}>
                          <UserCheck size={13} /> Assign
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

type PerformanceRow = { label: string; count: number; average: number; compliance: number; target?: number };

function PerformanceTable({ title, eyebrow, rows }: { title: string; eyebrow: string; rows: PerformanceRow[] }) {
  return (
    <section className={styles.card}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>
      <div className={frontlineStyles.performanceRows}>
        {rows.slice(0, 12).map((row) => (
          <div key={row.label}>
            <div className={frontlineStyles.performanceLabel}>
              <strong className={frontlineStyles.performanceLabelTitle}>{row.label}</strong>
              <span className={frontlineStyles.performanceLabelMeta}>{row.count} completed</span>
            </div>
            <div className={frontlineStyles.metricBar}>
              <span className={frontlineStyles.metricFill} style={{ width: `${Math.min(100, row.compliance)}%` }} />
            </div>
            <div className={frontlineStyles.performanceMetric}>
              <strong className={frontlineStyles.performanceMetricValue}>{row.average} min</strong>
              <span className={frontlineStyles.performanceMetricMeta}>{row.compliance}% within target</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FrontlinePerformanceView() {
  const tickets = useFrontlineStore((state) => state.tickets);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [period, setPeriod] = useState("All available data");
  const [officeFilter, setOfficeFilter] = useState("All offices");

  const completed = tickets.filter((item) => {
    const service = serviceFor(item.serviceId);
    const inScope = selectedBarangay === "all" || item.barangayId === selectedBarangay;
    const inOffice = officeFilter === "All offices" || service.office === officeFilter;
    const daysOld = (new Date("2026-09-23T23:59:00Z").getTime() - new Date(item.issuedAt).getTime()) / 86_400_000;
    const inPeriod = period === "Today" ? daysOld < 1 : period === "Last 7 days" ? daysOld < 7 : true;
    return item.status === "Completed" && Boolean(item.completedAt) && inScope && inOffice && inPeriod;
  });
  const durations = completed.map((item) => minutesBetween(item.issuedAt, item.completedAt));
  const waits = completed.filter((item) => item.calledAt).map((item) => minutesBetween(item.issuedAt, item.calledAt));
  const average = durations.length
    ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
    : 0;
  const averageWait = waits.length ? Math.round(waits.reduce((sum, value) => sum + value, 0) / waits.length) : 0;
  const compliant = completed.filter(
    (item) => minutesBetween(item.issuedAt, item.completedAt) <= serviceFor(item.serviceId).targetMinutes,
  ).length;
  const compliance = completed.length ? Math.round((compliant / completed.length) * 100) : 0;

  const aggregate = (
    keys: Array<{ key: string; label: string }>,
    matcher: (ticket: FrontlineTicket, key: string) => boolean,
  ): PerformanceRow[] =>
    keys
      .map(({ key, label }) => {
        const group = completed.filter((ticket) => matcher(ticket, key));
        const groupDurations = group.map((ticket) => minutesBetween(ticket.issuedAt, ticket.completedAt));
        const within = group.filter(
          (ticket) => minutesBetween(ticket.issuedAt, ticket.completedAt) <= serviceFor(ticket.serviceId).targetMinutes,
        ).length;
        return {
          label,
          count: group.length,
          average: group.length ? Math.round(groupDurations.reduce((sum, value) => sum + value, 0) / group.length) : 0,
          compliance: group.length ? Math.round((within / group.length) * 100) : 0,
        };
      })
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count);

  const serviceRows = aggregate(
    FRONTLINE_SERVICES.map((item) => ({ key: item.id, label: item.name })),
    (ticket, key) => ticket.serviceId === key,
  );
  const officeNames = Array.from(new Set(FRONTLINE_SERVICES.map((item) => item.office)));
  const officeRows = aggregate(
    officeNames.map((item) => ({ key: item, label: item })),
    (ticket, key) => serviceFor(ticket.serviceId).office === key,
  );
  const barangayRows = aggregate(
    MATNOG_BARANGAYS.map((item) => ({ key: item.code, label: item.name })),
    (ticket, key) => ticket.barangayId === key,
  );
  const officerRows = aggregate(
    OFFICERS.map((item) => ({ key: item, label: item })),
    (ticket, key) => ticket.officer === key,
  );

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A8 Frontline Services</p>
          <h1>Turnaround Performance</h1>
          <p>Measure service completion speed and target compliance for {selectedBarangayName}.</p>
        </div>
        <div className={frontlineStyles.headerFilters}>
          <select className={styles.compactSelect} value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option>Today</option>
            <option>Last 7 days</option>
            <option>All available data</option>
          </select>
          <select
            className={styles.compactSelect}
            value={officeFilter}
            onChange={(event) => setOfficeFilter(event.target.value)}
          >
            <option>All offices</option>
            {officeNames.map((office) => (
              <option key={office}>{office}</option>
            ))}
          </select>
        </div>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ClipboardCheck size={18} />
          </span>
          <div>
            <strong>{completed.length}</strong>
            <span>Completed transactions</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Clock3 size={18} />
          </span>
          <div>
            <strong>{average} min</strong>
            <span>Average turnaround</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CheckCircle2 size={18} />
          </span>
          <div>
            <strong>{compliance}%</strong>
            <span>Completed within target</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <BarChart3 size={18} />
          </span>
          <div>
            <strong>{averageWait} min</strong>
            <span>Average queue wait</span>
          </div>
        </div>
      </div>
      <section className={`${styles.card} ${frontlineStyles.performanceHero}`}>
        <div>
          <span>Service level achieved</span>
          <strong>{compliance}%</strong>
          <small>
            {compliant} of {completed.length} transactions met their service target
          </small>
        </div>
        <div
          className={frontlineStyles.complianceRing}
          style={{ "--compliance": `${compliance * 3.6}deg` } as React.CSSProperties}
        >
          <span className={frontlineStyles.complianceValue}>{compliance}%</span>
        </div>
        <div className={frontlineStyles.performanceLegend}>
          <p>
            <i className={frontlineStyles.legendGood} /> Within target <strong>{compliant}</strong>
          </p>
          <p>
            <i className={frontlineStyles.legendLate} /> Over target <strong>{completed.length - compliant}</strong>
          </p>
        </div>
      </section>
      <div className={frontlineStyles.performanceGrid}>
        <PerformanceTable eyebrow="Service type" title="Turnaround by service" rows={serviceRows} />
        <PerformanceTable eyebrow="Office" title="Turnaround by assigned office" rows={officeRows} />
        <PerformanceTable eyebrow="Barangay" title="Turnaround by barangay" rows={barangayRows} />
        <PerformanceTable eyebrow="Officer" title="Turnaround by officer" rows={officerRows} />
      </div>
    </div>
  );
}
