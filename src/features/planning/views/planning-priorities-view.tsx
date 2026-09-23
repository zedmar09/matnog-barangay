"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  FileText,
  Gauge,
  ListFilter,
  Plus,
  Search,
  Target,
  UsersRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { DEVELOPMENT_SECTORS } from "../data/planning-data";
import { usePlanningStore } from "../stores/planning-store";
import type { DevelopmentPriority, PriorityAreaStatus } from "../types/planning";
import planningStyles from "./planning.module.css";

type PriorityFilter = "All" | PriorityAreaStatus;

const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;

function PriorityStatusBadge({ status }: { status: PriorityAreaStatus }) {
  const badgeClass =
    status === "Incorporated"
      ? styles.active
      : status === "Endorsed"
        ? styles.info
        : status === "Validated"
          ? styles.warning
          : styles.muted;
  return <span className={`${styles.badge} ${badgeClass}`}>{status}</span>;
}

const criterionLabels = [
  ["Severity", "severity", 30],
  ["Population reach", "reach", 25],
  ["Urgency", "urgency", 25],
  ["Feasibility", "feasibility", 20],
] as const;

export function PlanningPrioritiesView() {
  const priorities = usePlanningStore((state) => state.priorities);
  const meetings = usePlanningStore((state) => state.meetings);
  const councils = usePlanningStore((state) => state.councils);
  const addPriority = usePlanningStore((state) => state.addPriority);
  const advancePriority = usePlanningStore((state) => state.advancePriority);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PriorityFilter>("All");
  const [selectedId, setSelectedId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const initialBarangay = selectedBarangay === "all" ? (councils[0]?.barangayId ?? "") : selectedBarangay;
  const initialMeeting = meetings.find(
    (meeting) => meeting.barangayId === initialBarangay && meeting.status === "Approved",
  );
  const [form, setForm] = useState({
    barangayId: initialBarangay,
    title: "",
    sector: "Social development" as DevelopmentPriority["sector"],
    problemStatement: "",
    evidence: "Barangay consultation and household registry",
    affectedPopulation: 100,
    severity: 3,
    reach: 3,
    urgency: 3,
    feasibility: 3,
    responsibleCommittee: "Social Development",
    targetYear: 2027,
    sourceMeetingId: initialMeeting?.id ?? "",
  });

  const meetingMap = useMemo(() => new Map(meetings.map((meeting) => [meeting.id, meeting])), [meetings]);
  const scoped = priorities.filter(
    (priority) => selectedBarangay === "all" || priority.barangayId === selectedBarangay,
  );
  const filtered = scoped
    .filter((priority) => {
      const haystack =
        `${priority.title} ${priority.referenceNumber} ${priority.sector} ${barangayName(priority.barangayId)}`.toLowerCase();
      return (filter === "All" || priority.status === filter) && haystack.includes(query.trim().toLowerCase());
    })
    .sort((a, b) => b.score - a.score);
  const initial = filtered.find((priority) => priority.status === "Validated") ?? filtered[0];
  const selected = priorities.find((priority) => priority.id === selectedId) ?? initial;
  const sourceMeeting = selected ? meetingMap.get(selected.sourceMeetingId) : undefined;
  const approvedMeetings = meetings.filter(
    (meeting) => meeting.barangayId === form.barangayId && meeting.status === "Approved",
  );
  const averageScore = scoped.length
    ? Math.round(scoped.reduce((total, priority) => total + priority.score, 0) / scoped.length)
    : 0;

  const updateBarangay = (barangayId: string) => {
    const meeting = meetings.find((item) => item.barangayId === barangayId && item.status === "Approved");
    setForm((current) => ({ ...current, barangayId, sourceMeetingId: meeting?.id ?? "" }));
  };

  const savePriority = () => {
    if (!form.barangayId || !form.title.trim() || !form.problemStatement.trim()) return;
    const priority = addPriority(form);
    setSelectedId(priority.id);
    setFilter("All");
    setShowForm(false);
    setNotice(`${priority.referenceNumber} was added to the ${barangayName(priority.barangayId)} priority register.`);
  };

  const advance = () => {
    if (!selected) return;
    setSelectedId(selected.id);
    const updated = advancePriority(selected.id);
    if (!updated) return;
    const message =
      updated.status === "Validated"
        ? "The evidence and scoring were validated."
        : updated.status === "Endorsed"
          ? "The priority was endorsed and linked to the development plan."
          : "The priority was incorporated into the adopted plan.";
    setNotice(`${updated.referenceNumber}: ${message}`);
  };

  const actionLabel = selected
    ? selected.status === "Identified"
      ? "Validate priority"
      : selected.status === "Validated"
        ? "Endorse to BDP"
        : selected.status === "Endorsed"
          ? "Mark incorporated"
          : "Already incorporated"
    : "";

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A10 Planning & Development</p>
          <h1>Priority Areas</h1>
          <p>Score community concerns and endorse the strongest priorities for {selectedBarangayName}.</p>
        </div>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={() => {
            setShowForm(true);
            setNotice("");
          }}
        >
          <Plus size={15} /> Add priority
        </button>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Target size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>Priority areas</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <BadgeCheck size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.status === "Endorsed").length}</strong>
            <span>Endorsed to plans</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ClipboardCheck size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.status === "Incorporated").length}</strong>
            <span>Incorporated priorities</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Gauge size={18} />
          </span>
          <div>
            <strong>{averageScore}</strong>
            <span>Average weighted score</span>
          </div>
        </div>
      </div>

      {notice ? (
        <div className={planningStyles.successNotice}>
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      ) : null}

      {showForm ? (
        <section className={`${styles.card} ${planningStyles.priorityForm}`}>
          <div className={planningStyles.formHeading}>
            <div>
              <strong>Add a development priority</strong>
              <small>Record the concern, its evidence, and the BDC scoring criteria.</small>
            </div>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
          <div className={planningStyles.priorityFormGrid}>
            <label>
              <span>Barangay</span>
              <select
                value={form.barangayId}
                onChange={(event) => updateBarangay(event.target.value)}
                disabled={selectedBarangay !== "all"}
              >
                {councils.map((council) => (
                  <option key={council.barangayId} value={council.barangayId}>
                    {barangayName(council.barangayId)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Sector</span>
              <select
                value={form.sector}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sector: event.target.value as DevelopmentPriority["sector"],
                  }))
                }
              >
                {DEVELOPMENT_SECTORS.map((sector) => (
                  <option key={sector}>{sector}</option>
                ))}
              </select>
            </label>
            <label className={planningStyles.formWide}>
              <span>Priority title</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Clear and specific community concern"
              />
            </label>
            <label className={planningStyles.formWide}>
              <span>Problem statement</span>
              <textarea
                value={form.problemStatement}
                onChange={(event) => setForm((current) => ({ ...current, problemStatement: event.target.value }))}
                placeholder="Describe the current condition and who is affected"
              />
            </label>
            <label className={planningStyles.formWide}>
              <span>Evidence source</span>
              <input
                value={form.evidence}
                onChange={(event) => setForm((current) => ({ ...current, evidence: event.target.value }))}
              />
            </label>
            <label>
              <span>Affected population</span>
              <input
                type="number"
                min="1"
                value={form.affectedPopulation}
                onChange={(event) =>
                  setForm((current) => ({ ...current, affectedPopulation: Number(event.target.value) }))
                }
              />
            </label>
            <label>
              <span>Target year</span>
              <select
                value={form.targetYear}
                onChange={(event) => setForm((current) => ({ ...current, targetYear: Number(event.target.value) }))}
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
              </select>
            </label>
            {criterionLabels.map(([label, key]) => (
              <label key={key}>
                <span>{label} score</span>
                <select
                  value={form[key]}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: Number(event.target.value) }))}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value} — {value === 1 ? "Low" : value === 5 ? "Very high" : "Moderate"}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <label>
              <span>Responsible committee</span>
              <input
                value={form.responsibleCommittee}
                onChange={(event) => setForm((current) => ({ ...current, responsibleCommittee: event.target.value }))}
              />
            </label>
            <label>
              <span>Source consultation</span>
              <select
                value={form.sourceMeetingId}
                onChange={(event) => setForm((current) => ({ ...current, sourceMeetingId: event.target.value }))}
              >
                {approvedMeetings.map((meeting) => (
                  <option key={meeting.id} value={meeting.id}>
                    {meeting.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={planningStyles.formActions}>
            <span>
              <Gauge size={14} /> Weighted score preview:{" "}
              {form.severity * 30 + form.reach * 25 + form.urgency * 25 + form.feasibility * 20} / 500
            </span>
            <button className={styles.primaryButton} type="button" onClick={savePriority}>
              Save priority
            </button>
          </div>
        </section>
      ) : null}

      <div className={planningStyles.priorityWorkspace}>
        <section className={styles.card}>
          <div className={planningStyles.priorityToolbar}>
            <label>
              <Search size={14} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search priority, sector, or barangay"
              />
            </label>
            <select value={filter} onChange={(event) => setFilter(event.target.value as PriorityFilter)}>
              <option>All</option>
              <option>Identified</option>
              <option>Validated</option>
              <option>Endorsed</option>
              <option>Incorporated</option>
            </select>
            <small>
              <ListFilter size={12} /> {filtered.length} ranked priorities
            </small>
          </div>
          <div className={planningStyles.priorityList}>
            {filtered.map((priority) => (
              <button
                className={selected?.id === priority.id ? planningStyles.prioritySelected : ""}
                key={priority.id}
                type="button"
                onClick={() => {
                  setSelectedId(priority.id);
                  setNotice("");
                }}
              >
                <span>{priority.rank}</span>
                <div>
                  <strong>{priority.title}</strong>
                  <small>
                    {barangayName(priority.barangayId)} · {priority.sector}
                  </small>
                  <PriorityStatusBadge status={priority.status} />
                </div>
                <div>
                  <b>{priority.score}</b>
                  <small>score</small>
                  <ChevronRight size={13} />
                </div>
              </button>
            ))}
          </div>
        </section>

        {selected ? (
          <section className={`${styles.card} ${planningStyles.priorityDetail}`}>
            <header className={planningStyles.priorityDetailHeader}>
              <div>
                <span>{selected.referenceNumber}</span>
                <h2>{selected.title}</h2>
                <p>
                  Brgy. {barangayName(selected.barangayId)} · {selected.sector} · Target {selected.targetYear}
                </p>
              </div>
              <PriorityStatusBadge status={selected.status} />
            </header>

            <div className={planningStyles.priorityScoreHero}>
              <div>
                <span>Weighted priority score</span>
                <strong>{selected.score}</strong>
                <small>out of 500 · Barangay rank #{selected.rank}</small>
              </div>
              <div className={planningStyles.scoreCriteria}>
                {criterionLabels.map(([label, key, weight]) => (
                  <article key={key}>
                    <div>
                      <span>{label}</span>
                      <b>{selected[key]} / 5</b>
                    </div>
                    <i>
                      <span style={{ width: `${selected[key] * 20}%` }} />
                    </i>
                    <small>{weight}% weight</small>
                  </article>
                ))}
              </div>
            </div>

            <div className={planningStyles.priorityNarrative}>
              <article>
                <span>Problem statement</span>
                <p>{selected.problemStatement}</p>
              </article>
              <article>
                <span>Planning evidence</span>
                <p>{selected.evidence}</p>
              </article>
            </div>

            <div className={planningStyles.priorityFacts}>
              <div>
                <UsersRound size={16} />
                <span>
                  <strong>{selected.affectedPopulation.toLocaleString("en-PH")}</strong>
                  <small>Estimated residents affected</small>
                </span>
              </div>
              <div>
                <Target size={16} />
                <span>
                  <strong>{selected.responsibleCommittee}</strong>
                  <small>Responsible BDC committee</small>
                </span>
              </div>
              <div>
                <FileText size={16} />
                <span>
                  <strong>{sourceMeeting?.title ?? "Community consultation"}</strong>
                  <small>Source meeting record</small>
                </span>
              </div>
            </div>

            <footer className={planningStyles.priorityFooter}>
              <div>
                {selected.status === "Incorporated" ? <CheckCircle2 size={17} /> : <CircleAlert size={17} />}
                <span>
                  <strong>
                    {selected.status === "Incorporated"
                      ? "Included in the adopted BDP"
                      : "Priority workflow in progress"}
                  </strong>
                  <small>Evidence and scoring remain linked to this priority reference.</small>
                </span>
              </div>
              <div className={planningStyles.priorityActions}>
                <Link className={styles.secondaryButton} href="/barangay-affairs/planning/bdp">
                  View BDP <ArrowUpRight size={14} />
                </Link>
                <button
                  className={styles.primaryButton}
                  disabled={selected.status === "Incorporated"}
                  type="button"
                  onClick={advance}
                >
                  {actionLabel}
                </button>
              </div>
            </footer>
          </section>
        ) : null}
      </div>
    </div>
  );
}
