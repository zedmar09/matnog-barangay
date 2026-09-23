"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  FileArchive,
  FileCheck2,
  FileText,
  PackageCheck,
  Paperclip,
  Search,
  Send,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { usePlanningStore } from "../stores/planning-store";
import type { MunicipalSubmissionStatus } from "../types/planning";
import planningStyles from "./planning.module.css";

type SubmissionFilter = "All" | MunicipalSubmissionStatus;

const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const formatDate = (value: string) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    : "Pending";

function SubmissionStatusBadge({ status }: { status: MunicipalSubmissionStatus }) {
  const badgeClass =
    status === "Received"
      ? styles.active
      : status === "Submitted"
        ? styles.info
        : status === "Ready"
          ? styles.warning
          : styles.muted;
  return <span className={`${styles.badge} ${badgeClass}`}>{status}</span>;
}

export function PlanningSubmissionsView() {
  const submissions = usePlanningStore((state) => state.submissions);
  const plans = usePlanningStore((state) => state.plans);
  const proposals = usePlanningStore((state) => state.proposals);
  const advanceSubmission = usePlanningStore((state) => state.advanceSubmission);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SubmissionFilter>("All");
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("");

  const planMap = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans]);
  const proposalMap = useMemo(() => new Map(proposals.map((proposal) => [proposal.id, proposal])), [proposals]);
  const scoped = submissions.filter(
    (submission) => selectedBarangay === "all" || submission.barangayId === selectedBarangay,
  );
  const filtered = scoped.filter((submission) => {
    const plan = planMap.get(submission.planId);
    const haystack =
      `${submission.referenceNumber} ${barangayName(submission.barangayId)} ${plan?.planningCycle ?? ""}`.toLowerCase();
    return (filter === "All" || submission.status === filter) && haystack.includes(query.trim().toLowerCase());
  });
  const initial = filtered.find((submission) => submission.status === "Draft") ?? filtered[0];
  const selected = submissions.find((submission) => submission.id === selectedId) ?? initial;
  const selectedPlan = selected ? planMap.get(selected.planId) : undefined;
  const selectedProjects = selected
    ? selected.projectIds
        .map((id) => proposalMap.get(id))
        .filter((proposal): proposal is NonNullable<typeof proposal> => Boolean(proposal))
    : [];
  const missingDocuments = scoped.reduce(
    (total, submission) => total + submission.checklist.filter((item) => !item.complete).length,
    0,
  );
  const completePackages = scoped.filter((submission) => submission.checklist.every((item) => item.complete)).length;

  const advance = () => {
    if (!selected) return;
    setSelectedId(selected.id);
    const updated = advanceSubmission(selected.id);
    if (!updated) return;
    const message =
      updated.status === "Ready"
        ? "The package checklist was completed and is ready for submission."
        : updated.status === "Submitted"
          ? "The package was submitted to the municipal planning office."
          : "The municipal receipt was recorded and technical review has started.";
    setNotice(`${updated.referenceNumber}: ${message}`);
  };

  const actionLabel = selected
    ? selected.status === "Draft"
      ? "Complete package validation"
      : selected.status === "Ready"
        ? "Submit package to MPDO"
        : selected.status === "Submitted"
          ? "Record municipal receipt"
          : "Package received"
    : "";

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A10 Planning & Development</p>
          <h1>Municipal Submissions</h1>
          <p>
            Prepare and route development plan packages from {selectedBarangayName} to the municipal planning office.
          </p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/planning/status">
          <ClipboardCheck size={15} /> View status feedback
        </Link>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <FileArchive size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>Submission packages</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <PackageCheck size={18} />
          </span>
          <div>
            <strong>{completePackages}</strong>
            <span>Complete packages</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Send size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => ["Submitted", "Received"].includes(item.status)).length}</strong>
            <span>Sent to municipality</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CircleAlert size={18} />
          </span>
          <div>
            <strong>{missingDocuments}</strong>
            <span>Missing requirements</span>
          </div>
        </div>
      </div>

      {notice ? (
        <div className={planningStyles.successNotice}>
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      ) : null}

      <div className={planningStyles.submissionWorkspace}>
        <section className={styles.card}>
          <div className={planningStyles.submissionToolbar}>
            <label>
              <Search size={14} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search package, reference, or barangay"
              />
            </label>
            <select value={filter} onChange={(event) => setFilter(event.target.value as SubmissionFilter)}>
              <option>All</option>
              <option>Draft</option>
              <option>Ready</option>
              <option>Submitted</option>
              <option>Received</option>
            </select>
            <small>{filtered.length} submission records</small>
          </div>
          <div className={planningStyles.submissionList}>
            {filtered.map((submission) => {
              const completeCount = submission.checklist.filter((item) => item.complete).length;
              return (
                <button
                  className={selected?.id === submission.id ? planningStyles.submissionSelected : ""}
                  key={submission.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(submission.id);
                    setNotice("");
                  }}
                >
                  <span>
                    <FileArchive size={15} />
                  </span>
                  <div>
                    <strong>{barangayName(submission.barangayId)}</strong>
                    <small>{submission.referenceNumber}</small>
                    <small>
                      {completeCount}/{submission.checklist.length} requirements · {submission.attachmentCount} files
                    </small>
                  </div>
                  <div>
                    <SubmissionStatusBadge status={submission.status} />
                    <ChevronRight size={13} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {selected ? (
          <section className={`${styles.card} ${planningStyles.submissionDetail}`}>
            <header className={planningStyles.submissionDetailHeader}>
              <div>
                <span>{selected.referenceNumber}</span>
                <h2>{barangayName(selected.barangayId)} Municipal Submission Package</h2>
                <p>
                  {selectedPlan?.planningCycle} planning cycle · {selected.attachmentCount} supporting files
                </p>
              </div>
              <SubmissionStatusBadge status={selected.status} />
            </header>

            <div className={planningStyles.submissionRoute}>
              <div>
                <Building2 size={17} />
                <span>
                  <strong>Barangay Development Council</strong>
                  <small>{selected.submittedBy || "Package preparation"}</small>
                </span>
              </div>
              <ChevronRight className={planningStyles.routeArrow} size={18} />
              <div className={planningStyles.routeDestination}>
                <Building2 size={17} />
                <span>
                  <strong>{selected.receivingOffice}</strong>
                  <small>
                    {selected.receivedAt ? `Received ${formatDate(selected.receivedAt)}` : "Awaiting receipt"}
                  </small>
                </span>
              </div>
            </div>

            <div className={planningStyles.submissionDetailGrid}>
              <article>
                <header>
                  <ClipboardCheck size={15} />
                  <div>
                    <strong>Submission checklist</strong>
                    <small>
                      {selected.checklist.filter((item) => item.complete).length} of {selected.checklist.length}{" "}
                      complete
                    </small>
                  </div>
                </header>
                <div className={planningStyles.checklistItems}>
                  {selected.checklist.map((item) => (
                    <div key={item.id}>
                      {item.complete ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}
                      <span>
                        <strong>{item.label}</strong>
                        <small>
                          {item.complete
                            ? `${item.documentCount} document${item.documentCount === 1 ? "" : "s"} attached`
                            : "Required before submission"}
                        </small>
                      </span>
                      <b>{item.complete ? "Complete" : "Missing"}</b>
                    </div>
                  ))}
                </div>
              </article>
              <aside>
                <header>
                  <FileCheck2 size={15} />
                  <div>
                    <strong>Included planning records</strong>
                    <small>Source records remain linked to this package</small>
                  </div>
                </header>
                <div className={planningStyles.packageRecords}>
                  <div>
                    <FileText size={14} />
                    <span>
                      <strong>{selectedPlan?.referenceNumber}</strong>
                      <small>
                        BDP version {selectedPlan?.version} · {selectedPlan?.status}
                      </small>
                    </span>
                  </div>
                  {selectedProjects.map((proposal) => (
                    <div key={proposal.id}>
                      <FileCheck2 size={14} />
                      <span>
                        <strong>{proposal.title}</strong>
                        <small>{proposal.referenceNumber}</small>
                      </span>
                    </div>
                  ))}
                  <div>
                    <Paperclip size={14} />
                    <span>
                      <strong>{selected.attachmentCount} supporting files</strong>
                      <small>Resolutions, minutes, matrices, and estimates</small>
                    </span>
                  </div>
                </div>
              </aside>
            </div>

            <section className={planningStyles.submissionTimeline}>
              <div className={selected.status !== "Draft" ? planningStyles.routeReached : ""}>
                <span>
                  <PackageCheck size={14} />
                </span>
                <strong>Package ready</strong>
                <small>Requirements checked</small>
              </div>
              <div className={["Submitted", "Received"].includes(selected.status) ? planningStyles.routeReached : ""}>
                <span>
                  <Send size={14} />
                </span>
                <strong>Submitted</strong>
                <small>{formatDate(selected.submittedAt)}</small>
              </div>
              <div className={selected.status === "Received" ? planningStyles.routeReached : ""}>
                <span>
                  <BadgeCheck size={14} />
                </span>
                <strong>Municipal receipt</strong>
                <small>{formatDate(selected.receivedAt)}</small>
              </div>
            </section>

            <footer className={planningStyles.submissionFooter}>
              <div>
                {selected.status === "Received" ? <BadgeCheck size={17} /> : <CircleAlert size={17} />}
                <span>
                  <strong>
                    {selected.status === "Received"
                      ? "Package is under municipal control"
                      : "Submission workflow in progress"}
                  </strong>
                  <small>Every transition remains attached to this submission reference.</small>
                </span>
              </div>
              <button
                className={styles.primaryButton}
                disabled={selected.status === "Received"}
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
