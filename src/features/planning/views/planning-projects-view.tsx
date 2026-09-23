"use client";

import { useMemo, useState } from "react";

import {
  BadgeCheck,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  FileText,
  Landmark,
  ListChecks,
  Paperclip,
  PhilippinePeso,
  Plus,
  Search,
  Target,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { usePlanningStore } from "../stores/planning-store";
import type { ProjectProposal, ProjectProposalStatus } from "../types/planning";
import planningStyles from "./planning.module.css";

type ProjectFilter = "All" | ProjectProposalStatus;

const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

function ProposalStatusBadge({ status }: { status: ProjectProposalStatus }) {
  const badgeClass =
    status === "Approved"
      ? styles.active
      : status === "For funding"
        ? styles.info
        : status === "For technical review"
          ? styles.warning
          : status === "Needs revision"
            ? styles.danger
            : styles.muted;
  return <span className={`${styles.badge} ${badgeClass}`}>{status}</span>;
}

const workflow = ["Draft", "Technical review", "Funding", "Approved"];

export function PlanningProjectsView() {
  const proposals = usePlanningStore((state) => state.proposals);
  const priorities = usePlanningStore((state) => state.priorities);
  const councils = usePlanningStore((state) => state.councils);
  const addProposal = usePlanningStore((state) => state.addProposal);
  const advanceProposal = usePlanningStore((state) => state.advanceProposal);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProjectFilter>("All");
  const [selectedId, setSelectedId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const initialBarangay = selectedBarangay === "all" ? (councils[0]?.barangayId ?? "") : selectedBarangay;
  const initialPriority = priorities.find(
    (priority) => priority.barangayId === initialBarangay && ["Endorsed", "Incorporated"].includes(priority.status),
  );
  const [form, setForm] = useState({
    barangayId: initialBarangay,
    priorityId: initialPriority?.id ?? "",
    title: "",
    description: "",
    objective: "",
    expectedOutputs: [""],
    estimatedBudget: 250000,
    fundingSource: "Barangay Development Fund" as ProjectProposal["fundingSource"],
    implementationStart: "2027-01-15",
    implementationEnd: "2027-06-30",
    proponent: "Barangay Development Council",
  });

  const priorityMap = useMemo(() => new Map(priorities.map((priority) => [priority.id, priority])), [priorities]);
  const scoped = proposals.filter((proposal) => selectedBarangay === "all" || proposal.barangayId === selectedBarangay);
  const filtered = scoped.filter((proposal) => {
    const priority = priorityMap.get(proposal.priorityId);
    const haystack =
      `${proposal.title} ${proposal.referenceNumber} ${barangayName(proposal.barangayId)} ${priority?.title ?? ""}`.toLowerCase();
    return (filter === "All" || proposal.status === filter) && haystack.includes(query.trim().toLowerCase());
  });
  const initial = filtered.find((proposal) => proposal.status === "For technical review") ?? filtered[0];
  const selected = proposals.find((proposal) => proposal.id === selectedId) ?? initial;
  const sourcePriority = selected ? priorityMap.get(selected.priorityId) : undefined;
  const eligiblePriorities = priorities.filter(
    (priority) => priority.barangayId === form.barangayId && ["Endorsed", "Incorporated"].includes(priority.status),
  );
  const approvedBudget = scoped
    .filter((proposal) => proposal.status === "Approved")
    .reduce((total, proposal) => total + proposal.estimatedBudget, 0);
  const reviewCount = scoped.filter((proposal) =>
    ["For technical review", "Needs revision"].includes(proposal.status),
  ).length;

  const updateBarangay = (barangayId: string) => {
    const priority = priorities.find(
      (item) => item.barangayId === barangayId && ["Endorsed", "Incorporated"].includes(item.status),
    );
    setForm((current) => ({ ...current, barangayId, priorityId: priority?.id ?? "" }));
  };

  const saveProposal = () => {
    const outputs = form.expectedOutputs.map((output) => output.trim()).filter(Boolean);
    if (!form.priorityId || !form.title.trim() || !form.description.trim() || !outputs.length) return;
    const proposal = addProposal({ ...form, expectedOutputs: outputs });
    setSelectedId(proposal.id);
    setFilter("All");
    setShowForm(false);
    setNotice(`${proposal.referenceNumber} was saved as a draft project proposal.`);
  };

  const advance = () => {
    if (!selected) return;
    setSelectedId(selected.id);
    const updated = advanceProposal(selected.id);
    if (!updated) return;
    const message =
      updated.status === "Draft"
        ? "The revision workspace was reopened."
        : updated.status === "For technical review"
          ? "The proposal was submitted for technical review."
          : updated.status === "For funding"
            ? "Technical review passed and the proposal moved to funding confirmation."
            : "Funding was confirmed and the project proposal was approved.";
    setNotice(`${updated.referenceNumber}: ${message}`);
  };

  const actionLabel = selected
    ? selected.status === "Needs revision"
      ? "Open revision"
      : selected.status === "Draft"
        ? "Submit for technical review"
        : selected.status === "For technical review"
          ? "Complete technical review"
          : selected.status === "For funding"
            ? "Confirm funding & approve"
            : "Proposal approved"
    : "";
  const selectedWorkflowIndex = selected
    ? selected.status === "Approved"
      ? 3
      : selected.status === "For funding"
        ? 2
        : ["For technical review", "Needs revision"].includes(selected.status)
          ? 1
          : 0
    : 0;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A10 Planning & Development</p>
          <h1>Project Proposals</h1>
          <p>Turn endorsed development priorities into reviewable, costed projects for {selectedBarangayName}.</p>
        </div>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={() => {
            setShowForm(true);
            setNotice("");
          }}
        >
          <Plus size={15} /> Create proposal
        </button>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <FileText size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>Project proposals</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CircleAlert size={18} />
          </span>
          <div>
            <strong>{reviewCount}</strong>
            <span>In technical review</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Landmark size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.status === "For funding").length}</strong>
            <span>Awaiting funding</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <PhilippinePeso size={18} />
          </span>
          <div>
            <strong>{formatCurrency(approvedBudget)}</strong>
            <span>Approved project value</span>
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
        <section className={`${styles.card} ${planningStyles.projectForm}`}>
          <div className={planningStyles.formHeading}>
            <div>
              <strong>Create a project proposal</strong>
              <small>Use an endorsed priority as the planning basis for the project.</small>
            </div>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
          <div className={planningStyles.projectFormGrid}>
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
            <label className={planningStyles.projectFormWide}>
              <span>Endorsed priority</span>
              <select
                value={form.priorityId}
                onChange={(event) => setForm((current) => ({ ...current, priorityId: event.target.value }))}
              >
                {eligiblePriorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    #{priority.rank} {priority.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={planningStyles.projectFormWide}>
              <span>Project title</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Specific project or program name"
              />
            </label>
            <label>
              <span>Estimated budget</span>
              <input
                type="number"
                min="1"
                value={form.estimatedBudget}
                onChange={(event) =>
                  setForm((current) => ({ ...current, estimatedBudget: Number(event.target.value) }))
                }
              />
            </label>
            <label>
              <span>Funding source</span>
              <select
                value={form.fundingSource}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fundingSource: event.target.value as ProjectProposal["fundingSource"],
                  }))
                }
              >
                <option>Barangay Development Fund</option>
                <option>Municipal support</option>
                <option>External grant</option>
                <option>Shared funding</option>
              </select>
            </label>
            <label className={planningStyles.projectFormWide}>
              <span>Project description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Describe the intervention and its scope"
              />
            </label>
            <label className={planningStyles.projectFormWide}>
              <span>Objective</span>
              <textarea
                value={form.objective}
                onChange={(event) => setForm((current) => ({ ...current, objective: event.target.value }))}
                placeholder="State the measurable result the project should achieve"
              />
            </label>
            <label className={planningStyles.projectFormWide}>
              <span>Expected outputs</span>
              <textarea
                value={form.expectedOutputs.join("\n")}
                onChange={(event) =>
                  setForm((current) => ({ ...current, expectedOutputs: event.target.value.split("\n") }))
                }
                placeholder="Enter one expected output per line"
              />
            </label>
            <label>
              <span>Implementation start</span>
              <input
                type="date"
                value={form.implementationStart}
                onChange={(event) => setForm((current) => ({ ...current, implementationStart: event.target.value }))}
              />
            </label>
            <label>
              <span>Implementation end</span>
              <input
                type="date"
                value={form.implementationEnd}
                onChange={(event) => setForm((current) => ({ ...current, implementationEnd: event.target.value }))}
              />
            </label>
            <label className={planningStyles.projectFormWide}>
              <span>Proponent</span>
              <input
                value={form.proponent}
                onChange={(event) => setForm((current) => ({ ...current, proponent: event.target.value }))}
              />
            </label>
          </div>
          <div className={planningStyles.formActions}>
            <span>
              <Target size={14} /> The proposal remains linked to its source priority.
            </span>
            <button className={styles.primaryButton} type="button" onClick={saveProposal}>
              Save draft proposal
            </button>
          </div>
        </section>
      ) : null}

      <div className={planningStyles.projectWorkspace}>
        <section className={styles.card}>
          <div className={planningStyles.projectToolbar}>
            <label>
              <Search size={14} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search project, reference, or barangay"
              />
            </label>
            <select value={filter} onChange={(event) => setFilter(event.target.value as ProjectFilter)}>
              <option>All</option>
              <option>Draft</option>
              <option>For technical review</option>
              <option>Needs revision</option>
              <option>For funding</option>
              <option>Approved</option>
            </select>
            <small>{filtered.length} project records</small>
          </div>
          <div className={planningStyles.projectList}>
            {filtered.map((proposal) => (
              <button
                className={selected?.id === proposal.id ? planningStyles.projectSelected : ""}
                key={proposal.id}
                type="button"
                onClick={() => {
                  setSelectedId(proposal.id);
                  setNotice("");
                }}
              >
                <span>
                  <FileText size={15} />
                </span>
                <div>
                  <strong>{proposal.title}</strong>
                  <small>
                    {proposal.referenceNumber} · {barangayName(proposal.barangayId)}
                  </small>
                  <ProposalStatusBadge status={proposal.status} />
                </div>
                <div>
                  <b>{formatCurrency(proposal.estimatedBudget)}</b>
                  <ChevronRight size={13} />
                </div>
              </button>
            ))}
          </div>
        </section>

        {selected ? (
          <section className={`${styles.card} ${planningStyles.projectDetail}`}>
            <header className={planningStyles.projectDetailHeader}>
              <div>
                <span>{selected.referenceNumber}</span>
                <h2>{selected.title}</h2>
                <p>
                  Brgy. {barangayName(selected.barangayId)} · {selected.proponent}
                </p>
              </div>
              <ProposalStatusBadge status={selected.status} />
            </header>

            <div className={planningStyles.projectWorkflow}>
              {workflow.map((step, index) => (
                <div className={selectedWorkflowIndex >= index ? planningStyles.workflowReached : ""} key={step}>
                  <span>{selectedWorkflowIndex >= index ? <CheckCircle2 size={14} /> : index + 1}</span>
                  <small>{step}</small>
                </div>
              ))}
            </div>

            <div className={planningStyles.projectFinanceStrip}>
              <div>
                <PhilippinePeso size={17} />
                <span>
                  <strong>{formatCurrency(selected.estimatedBudget)}</strong>
                  <small>Estimated project budget</small>
                </span>
              </div>
              <div>
                <Landmark size={17} />
                <span>
                  <strong>{selected.fundingSource}</strong>
                  <small>Proposed funding source</small>
                </span>
              </div>
              <div>
                <CalendarRange size={17} />
                <span>
                  <strong>
                    {formatDate(selected.implementationStart)} – {formatDate(selected.implementationEnd)}
                  </strong>
                  <small>Implementation period</small>
                </span>
              </div>
            </div>

            <div className={planningStyles.projectNarrative}>
              <article>
                <span>Project description</span>
                <p>{selected.description}</p>
              </article>
              <article>
                <span>Project objective</span>
                <p>{selected.objective}</p>
              </article>
            </div>

            <div className={planningStyles.projectDetailGrid}>
              <article>
                <header>
                  <ListChecks size={15} />
                  <div>
                    <strong>Expected outputs</strong>
                    <small>{selected.expectedOutputs.length} measurable deliverables</small>
                  </div>
                </header>
                <div className={planningStyles.outputList}>
                  {selected.expectedOutputs.map((output, index) => (
                    <div key={`${selected.id}-${output}`}>
                      <span>{index + 1}</span>
                      <p>{output}</p>
                      <CheckCircle2 className={planningStyles.outputCheck} size={14} />
                    </div>
                  ))}
                </div>
              </article>
              <aside>
                <header>
                  <Target size={15} />
                  <div>
                    <strong>Planning basis</strong>
                    <small>Connected to the endorsed priority register</small>
                  </div>
                </header>
                <div className={planningStyles.projectBasis}>
                  <span>Priority #{sourcePriority?.rank ?? "—"}</span>
                  <strong>{sourcePriority?.title ?? "Source priority"}</strong>
                  <p>{sourcePriority?.problemStatement}</p>
                  <small>
                    {sourcePriority?.sector} · Score {sourcePriority?.score ?? 0} / 500
                  </small>
                </div>
              </aside>
            </div>

            <section className={planningStyles.reviewPanel}>
              <div>
                <ClipboardCheck size={18} />
                <span>
                  <strong>{selected.technicalScore || "—"}</strong>
                  <small>Technical review score</small>
                </span>
              </div>
              <p>{selected.reviewerNotes}</p>
              <span>
                <Paperclip size={14} /> {selected.attachmentCount} supporting files
              </span>
            </section>

            <footer className={planningStyles.projectFooter}>
              <div>
                {selected.status === "Approved" ? <BadgeCheck size={17} /> : <CircleAlert size={17} />}
                <span>
                  <strong>
                    {selected.status === "Approved" ? "Approved project proposal" : "Project review in progress"}
                  </strong>
                  <small>
                    {selected.status === "Approved"
                      ? `Approved by ${selected.approvedBy}.`
                      : "The proposal remains linked to its priority and review record."}
                  </small>
                </span>
              </div>
              <button
                className={styles.primaryButton}
                disabled={selected.status === "Approved"}
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
