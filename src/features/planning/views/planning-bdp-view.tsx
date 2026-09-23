"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FileCheck2,
  FileText,
  ListChecks,
  MessagesSquare,
  Paperclip,
  Search,
  Target,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { usePlanningStore } from "../stores/planning-store";
import type { BdpStatus } from "../types/planning";
import planningStyles from "./planning.module.css";

type PlanFilter = "All" | BdpStatus;

const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

function PlanStatusBadge({ status }: { status: BdpStatus }) {
  const badgeClass =
    status === "Adopted"
      ? styles.active
      : status === "Approved"
        ? styles.info
        : status === "For validation"
          ? styles.warning
          : styles.muted;
  return <span className={`${styles.badge} ${badgeClass}`}>{status}</span>;
}

const workflow: BdpStatus[] = ["Draft", "For validation", "Approved", "Adopted"];

export function PlanningBdpView() {
  const plans = usePlanningStore((state) => state.plans);
  const priorities = usePlanningStore((state) => state.priorities);
  const meetings = usePlanningStore((state) => state.meetings);
  const advancePlan = usePlanningStore((state) => state.advancePlan);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PlanFilter>("All");
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("");

  const meetingMap = useMemo(() => new Map(meetings.map((meeting) => [meeting.id, meeting])), [meetings]);
  const priorityMap = useMemo(() => new Map(priorities.map((priority) => [priority.id, priority])), [priorities]);
  const scoped = plans.filter((plan) => selectedBarangay === "all" || plan.barangayId === selectedBarangay);
  const filtered = scoped.filter((plan) => {
    const haystack = `${plan.referenceNumber} ${barangayName(plan.barangayId)} ${plan.planningCycle}`.toLowerCase();
    return (filter === "All" || plan.status === filter) && haystack.includes(query.trim().toLowerCase());
  });
  const initial = filtered.find((plan) => plan.status === "For validation") ?? filtered[0];
  const selected = plans.find((plan) => plan.id === selectedId) ?? initial;
  const selectedPriorities = selected
    ? selected.priorityAreaIds
        .map((id) => priorityMap.get(id))
        .filter((priority): priority is NonNullable<typeof priority> => Boolean(priority))
        .sort((a, b) => a.rank - b.rank)
    : [];
  const evidenceMeetings = selected
    ? selected.consultationMeetingIds
        .map((id) => meetingMap.get(id))
        .filter((meeting): meeting is NonNullable<typeof meeting> => Boolean(meeting))
    : [];
  const adoptedCount = scoped.filter((plan) => plan.status === "Adopted").length;
  const validationCount = scoped.filter((plan) => plan.status === "For validation").length;
  const linkedPriorityCount = scoped.reduce((total, plan) => total + plan.priorityAreaIds.length, 0);
  const evidenceCount = scoped.reduce((total, plan) => total + plan.consultationMeetingIds.length, 0);

  const advance = () => {
    if (!selected) return;
    setSelectedId(selected.id);
    const updated = advancePlan(selected.id);
    if (!updated) return;
    const message =
      updated.status === "For validation"
        ? "The revised plan was sent to the municipal planning office for validation."
        : updated.status === "Approved"
          ? "The validated plan was approved by the Sangguniang Barangay."
          : "The plan was adopted and its endorsed priorities were incorporated.";
    setNotice(`${updated.referenceNumber}: ${message}`);
  };

  const actionLabel = selected
    ? selected.status === "Draft"
      ? "Send for validation"
      : selected.status === "For validation"
        ? "Record barangay approval"
        : selected.status === "Approved"
          ? "Adopt development plan"
          : "Plan adopted"
    : "";

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A10 Planning & Development</p>
          <h1>Barangay Development Plan</h1>
          <p>Control the planning cycle, evidence, priorities, and adoption record for {selectedBarangayName}.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/planning/priorities">
          <Target size={15} /> Manage priority areas
        </Link>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <BookOpenCheck size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>Development plans</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <BadgeCheck size={18} />
          </span>
          <div>
            <strong>{adoptedCount}</strong>
            <span>Plans adopted</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CircleAlert size={18} />
          </span>
          <div>
            <strong>{validationCount}</strong>
            <span>Awaiting validation</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ListChecks size={18} />
          </span>
          <div>
            <strong>{linkedPriorityCount}</strong>
            <span>Priorities in plans</span>
          </div>
        </div>
      </div>

      {notice ? (
        <div className={planningStyles.successNotice}>
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      ) : null}

      <div className={planningStyles.planWorkspace}>
        <section className={styles.card}>
          <div className={planningStyles.planToolbar}>
            <label>
              <Search size={14} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search plan, reference, or barangay"
              />
            </label>
            <div className={planningStyles.planTabs}>
              {(["All", "Draft", "For validation", "Approved", "Adopted"] as PlanFilter[]).map((item) => (
                <button
                  className={filter === item ? planningStyles.planTabActive : ""}
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <small>{filtered.length} planning records</small>
          </div>
          <div className={planningStyles.planList}>
            {filtered.map((plan) => (
              <button
                className={selected?.id === plan.id ? planningStyles.planSelected : ""}
                key={plan.id}
                type="button"
                onClick={() => {
                  setSelectedId(plan.id);
                  setNotice("");
                }}
              >
                <span>
                  <FileText size={15} />
                </span>
                <div>
                  <strong>{barangayName(plan.barangayId)}</strong>
                  <small>{plan.referenceNumber}</small>
                  <small>
                    Version {plan.version} · Updated {formatDate(plan.lastUpdatedAt)}
                  </small>
                </div>
                <div>
                  <PlanStatusBadge status={plan.status} />
                  <ChevronRight size={14} />
                </div>
              </button>
            ))}
          </div>
        </section>

        {selected ? (
          <section className={`${styles.card} ${planningStyles.planDetail}`}>
            <header className={planningStyles.planDetailHeader}>
              <div>
                <span>{selected.referenceNumber}</span>
                <h2>{barangayName(selected.barangayId)} Barangay Development Plan</h2>
                <p>
                  {selected.planningCycle} planning cycle · Version {selected.version} · {selected.attachmentCount}{" "}
                  files
                </p>
              </div>
              <PlanStatusBadge status={selected.status} />
            </header>

            <div className={planningStyles.planWorkflow}>
              {workflow.map((step, index) => {
                const reached = workflow.indexOf(selected.status) >= index;
                return (
                  <div className={reached ? planningStyles.workflowReached : ""} key={step}>
                    <span>{reached ? <CheckCircle2 size={14} /> : index + 1}</span>
                    <small>{step}</small>
                  </div>
                );
              })}
            </div>

            <div className={planningStyles.planNarrative}>
              <article>
                <span>Community vision</span>
                <p>{selected.vision}</p>
              </article>
              <article>
                <span>Development goal</span>
                <p>{selected.developmentGoal}</p>
              </article>
            </div>

            <div className={planningStyles.planDetailGrid}>
              <article>
                <header>
                  <Target size={15} />
                  <div>
                    <strong>Priority areas in this plan</strong>
                    <small>{selectedPriorities.length} endorsed priorities</small>
                  </div>
                  <Link href="/barangay-affairs/planning/priorities">Review priorities</Link>
                </header>
                <div className={planningStyles.planPriorityList}>
                  {selectedPriorities.map((priority) => (
                    <div key={priority.id}>
                      <b>#{priority.rank}</b>
                      <span>
                        <strong>{priority.title}</strong>
                        <small>
                          {priority.sector} · Target {priority.targetYear}
                        </small>
                      </span>
                      <em>{priority.score}</em>
                    </div>
                  ))}
                </div>
              </article>

              <aside>
                <header>
                  <MessagesSquare size={15} />
                  <div>
                    <strong>Planning evidence</strong>
                    <small>{evidenceMeetings.length} approved consultations</small>
                  </div>
                </header>
                <div className={planningStyles.evidenceList}>
                  {evidenceMeetings.map((meeting) => (
                    <div key={meeting.id}>
                      <FileCheck2 size={14} />
                      <span>
                        <strong>{meeting.title}</strong>
                        <small>{formatDate(meeting.meetingDate)}</small>
                      </span>
                    </div>
                  ))}
                  <div>
                    <Paperclip size={14} />
                    <span>
                      <strong>{selected.attachmentCount} supporting files</strong>
                      <small>Profiles, maps, minutes, and resolutions</small>
                    </span>
                  </div>
                  <div>
                    <ListChecks size={14} />
                    <span>
                      <strong>{evidenceCount} municipal evidence links</strong>
                      <small>Across the current barangay scope</small>
                    </span>
                  </div>
                </div>
              </aside>
            </div>

            <section className={planningStyles.objectiveSection}>
              <header>
                <strong>Sector objectives</strong>
                <small>Objectives guide project proposals and annual investment programming.</small>
              </header>
              <div>
                {selected.sectorObjectives.map((item) => (
                  <article key={item.sector}>
                    <span>{item.sector}</span>
                    <p>{item.objective}</p>
                  </article>
                ))}
              </div>
            </section>

            <footer className={planningStyles.planFooter}>
              <div>
                <FileCheck2 size={17} />
                <span>
                  <strong>
                    {selected.status === "Adopted" ? selected.adoptionResolution : "Controlled plan workflow"}
                  </strong>
                  <small>
                    {selected.status === "Adopted"
                      ? "Adoption record is linked to the approved plan version."
                      : "Each status change is recorded against this plan version."}
                  </small>
                </span>
              </div>
              <button
                className={styles.primaryButton}
                disabled={selected.status === "Adopted"}
                type="button"
                onClick={advance}
              >
                {actionLabel}
              </button>
            </footer>
          </section>
        ) : null}
      </div>
    </div>
  );
}
