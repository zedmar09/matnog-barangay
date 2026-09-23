"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { usePlanningStore } from "../stores/planning-store";
import type { MunicipalFeedbackItem, MunicipalReviewStatus } from "../types/planning";
import planningStyles from "./planning.module.css";

type ReviewFilter = "All" | MunicipalReviewStatus;

const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const formatDate = (value: string) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    : "Pending";

function ReviewStatusBadge({ status }: { status: MunicipalReviewStatus }) {
  const badgeClass =
    status === "Accepted"
      ? styles.active
      : status === "Endorsed" || status === "Resubmitted"
        ? styles.info
        : status === "For revision"
          ? styles.danger
          : status === "Under review"
            ? styles.warning
            : styles.muted;
  return <span className={`${styles.badge} ${badgeClass}`}>{status}</span>;
}

function FeedbackIcon({ type }: { type: MunicipalFeedbackItem["type"] }) {
  if (type === "Receipt") return <FileCheck2 size={14} />;
  if (type === "Revision") return <CircleAlert size={14} />;
  if (type === "Response") return <RefreshCw size={14} />;
  if (type === "Decision") return <BadgeCheck size={14} />;
  return <MessageSquareText size={14} />;
}

export function PlanningStatusView() {
  const submissions = usePlanningStore((state) => state.submissions);
  const plans = usePlanningStore((state) => state.plans);
  const proposals = usePlanningStore((state) => state.proposals);
  const advanceReview = usePlanningStore((state) => state.advanceReview);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ReviewFilter>("All");
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("");

  const planMap = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans]);
  const proposalMap = useMemo(() => new Map(proposals.map((proposal) => [proposal.id, proposal])), [proposals]);
  const scoped = submissions.filter(
    (submission) => selectedBarangay === "all" || submission.barangayId === selectedBarangay,
  );
  const filtered = scoped.filter((submission) => {
    const haystack =
      `${submission.referenceNumber} ${barangayName(submission.barangayId)} ${submission.reviewStatus}`.toLowerCase();
    return (filter === "All" || submission.reviewStatus === filter) && haystack.includes(query.trim().toLowerCase());
  });
  const initial = filtered.find((submission) => submission.reviewStatus === "For revision") ?? filtered[0];
  const selected = submissions.find((submission) => submission.id === selectedId) ?? initial;
  const selectedPlan = selected ? planMap.get(selected.planId) : undefined;
  const selectedProjects = selected
    ? selected.projectIds
        .map((id) => proposalMap.get(id))
        .filter((proposal): proposal is NonNullable<typeof proposal> => Boolean(proposal))
    : [];
  const latestFeedback = selected?.feedback.at(-1);

  const advance = () => {
    if (!selected) return;
    setSelectedId(selected.id);
    const updated = advanceReview(selected.id);
    if (!updated) return;
    const message =
      updated.reviewStatus === "For revision"
        ? "The municipal review team returned the package with required corrections."
        : updated.reviewStatus === "Resubmitted"
          ? "The barangay response and corrected files were resubmitted."
          : updated.reviewStatus === "Endorsed"
            ? "The corrected package was endorsed for investment programming."
            : "The package was accepted for municipal programming and archive.";
    setNotice(`${updated.referenceNumber}: ${message}`);
  };

  const actionLabel = selected
    ? selected.reviewStatus === "Under review"
      ? "Issue revision request"
      : selected.reviewStatus === "For revision"
        ? "Submit barangay response"
        : selected.reviewStatus === "Resubmitted"
          ? "Record municipal endorsement"
          : selected.reviewStatus === "Endorsed"
            ? "Accept final package"
            : selected.reviewStatus === "Accepted"
              ? "Review complete"
              : "Awaiting municipal receipt"
    : "";

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A10 Planning & Development</p>
          <h1>Municipal Status Feedback</h1>
          <p>Track municipal review comments, barangay responses, and final decisions for {selectedBarangayName}.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/planning/submissions">
          <Send size={15} /> View submissions
        </Link>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ClipboardCheck size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.reviewStatus === "Under review").length}</strong>
            <span>Under municipal review</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CircleAlert size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.reviewStatus === "For revision").length}</strong>
            <span>For barangay revision</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ShieldCheck size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.reviewStatus === "Endorsed").length}</strong>
            <span>Municipally endorsed</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <BadgeCheck size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.reviewStatus === "Accepted").length}</strong>
            <span>Accepted packages</span>
          </div>
        </div>
      </div>

      {notice ? (
        <div className={planningStyles.successNotice}>
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      ) : null}

      <div className={planningStyles.statusWorkspace}>
        <section className={styles.card}>
          <div className={planningStyles.statusToolbar}>
            <label>
              <Search size={14} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search feedback, reference, or barangay"
              />
            </label>
            <select value={filter} onChange={(event) => setFilter(event.target.value as ReviewFilter)}>
              <option>All</option>
              <option>Awaiting receipt</option>
              <option>Under review</option>
              <option>For revision</option>
              <option>Resubmitted</option>
              <option>Endorsed</option>
              <option>Accepted</option>
            </select>
            <small>{filtered.length} municipal review records</small>
          </div>
          <div className={planningStyles.statusList}>
            {filtered.map((submission) => (
              <button
                className={selected?.id === submission.id ? planningStyles.statusSelected : ""}
                key={submission.id}
                type="button"
                onClick={() => {
                  setSelectedId(submission.id);
                  setNotice("");
                }}
              >
                <span>
                  <MessageSquareText size={15} />
                </span>
                <div>
                  <strong>{barangayName(submission.barangayId)}</strong>
                  <small>{submission.referenceNumber}</small>
                  <small>{submission.feedback.length} review updates</small>
                </div>
                <div>
                  <ReviewStatusBadge status={submission.reviewStatus} />
                  <ChevronRight size={13} />
                </div>
              </button>
            ))}
          </div>
        </section>

        {selected ? (
          <section className={`${styles.card} ${planningStyles.statusDetail}`}>
            <header className={planningStyles.statusDetailHeader}>
              <div>
                <span>{selected.referenceNumber}</span>
                <h2>{barangayName(selected.barangayId)} Review and Feedback</h2>
                <p>
                  {selected.receivingOffice} · Received {formatDate(selected.receivedAt)}
                </p>
              </div>
              <ReviewStatusBadge status={selected.reviewStatus} />
            </header>

            <div className={planningStyles.reviewSummaryStrip}>
              <div>
                <strong>{selected.reviewScore || "—"}</strong>
                <small>Technical review score</small>
              </div>
              <div>
                <strong>{selected.feedback.length}</strong>
                <small>Recorded updates</small>
              </div>
              <div>
                <strong>{selected.revisionDueDate ? formatDate(selected.revisionDueDate) : "No deadline"}</strong>
                <small>Revision response due</small>
              </div>
              <div>
                <strong>{selectedProjects.length + 1}</strong>
                <small>Core planning records</small>
              </div>
            </div>

            {latestFeedback ? (
              <section className={planningStyles.latestFeedback}>
                <FeedbackIcon type={latestFeedback.type} />
                <div>
                  <span>Latest municipal update</span>
                  <strong>{latestFeedback.message}</strong>
                  <small>
                    {latestFeedback.author} · {formatDate(latestFeedback.date)}
                  </small>
                </div>
              </section>
            ) : (
              <section className={planningStyles.latestFeedback}>
                <Clock3 size={15} />
                <div>
                  <span>Awaiting review</span>
                  <strong>Feedback begins after the municipality receives the submission package.</strong>
                </div>
              </section>
            )}

            <div className={planningStyles.statusDetailGrid}>
              <article>
                <header>
                  <MessageSquareText size={15} />
                  <div>
                    <strong>Feedback and response history</strong>
                    <small>Chronological municipal and barangay updates</small>
                  </div>
                </header>
                <div className={planningStyles.feedbackTimeline}>
                  {selected.feedback.map((item) => (
                    <div key={item.id}>
                      <span>
                        <FeedbackIcon type={item.type} />
                      </span>
                      <article>
                        <div>
                          <strong>{item.type}</strong>
                          <small>{formatDate(item.date)}</small>
                        </div>
                        <p>{item.message}</p>
                        <small>
                          {item.author} · {item.office}
                        </small>
                      </article>
                    </div>
                  ))}
                  {!selected.feedback.length ? <p>No municipal feedback has been recorded yet.</p> : null}
                </div>
              </article>
              <aside>
                <header>
                  <FileText size={15} />
                  <div>
                    <strong>Reviewed package</strong>
                    <small>Records included in the municipal review</small>
                  </div>
                </header>
                <div className={planningStyles.reviewedRecords}>
                  <div>
                    <FileCheck2 size={14} />
                    <span>
                      <strong>{selectedPlan?.referenceNumber}</strong>
                      <small>BDP version {selectedPlan?.version}</small>
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
                </div>
              </aside>
            </div>

            <footer className={planningStyles.statusFooter}>
              <div>
                {selected.reviewStatus === "Accepted" ? <BadgeCheck size={17} /> : <CircleAlert size={17} />}
                <span>
                  <strong>
                    {selected.reviewStatus === "Accepted"
                      ? "Municipal review completed"
                      : "Municipal coordination in progress"}
                  </strong>
                  <small>Comments, corrections, responses, and decisions remain in the audit history.</small>
                </span>
              </div>
              <button
                className={styles.primaryButton}
                disabled={["Awaiting receipt", "Accepted"].includes(selected.reviewStatus)}
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
