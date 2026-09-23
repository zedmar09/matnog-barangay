"use client";

import { useState } from "react";

import {
  AlertTriangle,
  Archive,
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  Eye,
  FileCheck2,
  FileClock,
  Fingerprint,
  HardDrive,
  LockKeyhole,
  Play,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import common from "@/features/resident-registry/components/resident-registry.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { ACCESS_ACCOUNTS } from "../data/access-data";
import { GOVERNANCE_CATEGORIES, RETENTION_POLICIES, SECURITY_EVENTS } from "../data/governance-data";
import type { DataGovernanceCategory, RetentionPolicy, SecurityEvent } from "../types/access";
import styles from "./administration.module.css";

const accountById = new Map(ACCESS_ACCOUNTS.map((account) => [account.id, account]));
const barangayName = (id: string | null) =>
  id ? (MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id) : "Municipal-wide";
const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function ReviewBadge({ status }: { status: DataGovernanceCategory["reviewStatus"] }) {
  return (
    <span
      className={`${styles.statusBadge} ${status === "Current" ? styles.active : status === "Review due" ? styles.locked : styles.suspended}`}
    >
      {status}
    </span>
  );
}

export function ConsentGovernanceView() {
  const [query, setQuery] = useState("");
  const [classification, setClassification] = useState("All classifications");
  const [selectedId, setSelectedId] = useState(GOVERNANCE_CATEGORIES[0].id);
  const [notice, setNotice] = useState("");
  const filtered = GOVERNANCE_CATEGORIES.filter(
    (item) =>
      `${item.name} ${item.module} ${item.lawfulBasis} ${item.dataOwner}`.toLowerCase().includes(query.toLowerCase()) &&
      (classification === "All classifications" || item.classification === classification),
  );
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0];
  const records = GOVERNANCE_CATEGORIES.reduce((sum, item) => sum + item.recordsCovered, 0);
  const consentCategories = GOVERNANCE_CATEGORIES.filter((item) => item.consentRequired).length;
  const needsReview = GOVERNANCE_CATEGORIES.filter((item) => item.reviewStatus !== "Current").length;

  return (
    <div className={common.page}>
      <header className={common.pageHeader}>
        <div>
          <p className={common.eyebrow}>A11 Privacy & Data Governance</p>
          <h1>Consent and Lawful Basis Register</h1>
          <p>Document why each category of personal data is processed and who is accountable for it.</p>
        </div>
        <button
          className={common.primaryButton}
          onClick={() => setNotice("Governance review checklist generated for all data owners.")}
          type="button"
        >
          <FileCheck2 size={15} />
          Start governance review
        </button>
      </header>
      {notice && (
        <div className={styles.successNotice}>
          <CheckCircle2 size={15} />
          {notice}
        </div>
      )}
      <div className={common.summaryGrid}>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <Database size={18} />
          </span>
          <div>
            <strong>{records.toLocaleString()}</strong>
            <span>Records governed</span>
          </div>
        </div>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <Scale size={18} />
          </span>
          <div>
            <strong>{GOVERNANCE_CATEGORIES.length}</strong>
            <span>Lawful basis entries</span>
          </div>
        </div>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <UserCheck size={18} />
          </span>
          <div>
            <strong>{consentCategories}</strong>
            <span>Require consent</span>
          </div>
        </div>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <AlertTriangle size={18} />
          </span>
          <div>
            <strong>{needsReview}</strong>
            <span>Need policy review</span>
          </div>
        </div>
      </div>
      <div className={styles.governanceWorkspace}>
        <section className={`${common.card} ${styles.governanceDirectory}`}>
          <div className={common.toolbar}>
            <label className={common.searchBox}>
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search category, module, basis, or owner"
              />
            </label>
            <select
              className={common.compactSelect}
              value={classification}
              onChange={(event) => setClassification(event.target.value)}
              aria-label="Filter data classification"
            >
              <option>All classifications</option>
              <option>Public</option>
              <option>Internal</option>
              <option>Confidential</option>
              <option>Restricted</option>
              <option>Highly restricted</option>
            </select>
          </div>
          <div className={common.resultsMeta}>
            <span>
              <strong>{filtered.length}</strong> data categories
            </span>
            <span>Municipal governance register</span>
          </div>
          <div className={styles.governanceList}>
            {filtered.map((item) => (
              <button
                key={item.id}
                className={selected?.id === item.id ? styles.selectedGovernance : ""}
                onClick={() => setSelectedId(item.id)}
                type="button"
              >
                <span className={styles.domainIcon}>
                  {item.consentRequired ? <UserCheck size={15} /> : <Scale size={15} />}
                </span>
                <span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.module} · {item.classification}
                  </small>
                </span>
                <span>
                  <strong>{item.recordsCovered.toLocaleString()}</strong>
                  <small>records covered</small>
                </span>
                <ReviewBadge status={item.reviewStatus} />
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </section>
        {selected && (
          <aside className={`${common.card} ${styles.governanceDetail}`}>
            <div className={styles.governanceHeader}>
              <span className={styles.largeLock}>
                <Scale size={20} />
              </span>
              <div>
                <p className={common.eyebrow}>{selected.id}</p>
                <h2>{selected.name}</h2>
                <span>{selected.module}</span>
              </div>
              <ReviewBadge status={selected.reviewStatus} />
            </div>
            <div className={styles.basisCallout}>
              <Scale size={15} />
              <span>
                <small>Lawful basis</small>
                <strong>{selected.lawfulBasis}</strong>
              </span>
            </div>
            <section className={styles.governanceSection}>
              <div className={styles.sectionTitle}>
                <FileCheck2 size={14} />
                <strong>Processing purpose</strong>
              </div>
              <p>{selected.processingPurpose}</p>
            </section>
            <section className={styles.governanceSection}>
              <div className={styles.sectionTitle}>
                <UserCheck size={14} />
                <strong>Consent position</strong>
              </div>
              <div className={styles.consentCoverage}>
                <span>
                  <strong>{selected.consentRequired ? `${selected.consentCoverage}%` : "Not required"}</strong>
                  <small>
                    {selected.consentRequired
                      ? "Recorded consent coverage"
                      : "Processing is supported by another lawful basis"}
                  </small>
                </span>
                {selected.consentRequired && (
                  <div>
                    <span style={{ width: `${selected.consentCoverage}%` }} />
                  </div>
                )}
              </div>
            </section>
            <dl className={`${styles.detailList} ${styles.governanceFacts}`}>
              <div>
                <dt>Data subjects</dt>
                <dd>{selected.dataSubjects}</dd>
              </div>
              <div>
                <dt>Accountable owner</dt>
                <dd>{selected.dataOwner}</dd>
              </div>
              <div>
                <dt>Legal reference</dt>
                <dd>{selected.legalReference}</dd>
              </div>
              <div>
                <dt>Next review</dt>
                <dd>{formatDate(selected.nextReview)}</dd>
              </div>
            </dl>
          </aside>
        )}
      </div>
    </div>
  );
}

function RetentionBadge({ status }: { status: RetentionPolicy["status"] }) {
  return (
    <span
      className={`${styles.statusBadge} ${status === "Active" ? styles.active : status === "Review due" ? styles.locked : styles.suspended}`}
    >
      {status}
    </span>
  );
}

export function RetentionPoliciesView() {
  const [policies, setPolicies] = useState(RETENTION_POLICIES);
  const [selectedId, setSelectedId] = useState(RETENTION_POLICIES[0].id);
  const [notice, setNotice] = useState("");
  const selected = policies.find((item) => item.id === selectedId) ?? policies[0];
  const eligible = policies.reduce((sum, item) => sum + item.eligibleRecords, 0);
  const held = policies.reduce((sum, item) => sum + item.protectedRecords, 0);
  const runDisposition = () => {
    if (selected.status !== "Active" || selected.eligibleRecords === 0) return;
    setPolicies((current) =>
      current.map((item) => (item.id === selected.id ? { ...item, eligibleRecords: 0, lastRun: "2026-09-23" } : item)),
    );
    setNotice(
      `${selected.name}: ${selected.eligibleRecords} eligible records processed using ${selected.disposition.toLowerCase()}.`,
    );
  };

  return (
    <div className={common.page}>
      <header className={common.pageHeader}>
        <div>
          <p className={common.eyebrow}>A11 Privacy & Data Governance</p>
          <h1>Retention and Disposal Policies</h1>
          <p>Apply approved retention periods, legal holds, archiving, anonymization, and secure disposal.</p>
        </div>
      </header>
      {notice && (
        <div className={styles.successNotice}>
          <CheckCircle2 size={15} />
          {notice}
        </div>
      )}
      <div className={common.summaryGrid}>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <FileClock size={18} />
          </span>
          <div>
            <strong>{policies.length}</strong>
            <span>Retention policies</span>
          </div>
        </div>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <Trash2 size={18} />
          </span>
          <div>
            <strong>{eligible}</strong>
            <span>Eligible for disposition</span>
          </div>
        </div>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <LockKeyhole size={18} />
          </span>
          <div>
            <strong>{held}</strong>
            <span>Protected by holds</span>
          </div>
        </div>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <Archive size={18} />
          </span>
          <div>
            <strong>{policies.filter((item) => item.status === "Active").length}</strong>
            <span>Automations active</span>
          </div>
        </div>
      </div>
      <div className={styles.retentionWorkspace}>
        <section className={`${common.card} ${styles.retentionTable}`}>
          <div className={styles.panelHeading}>
            <div>
              <p className={common.eyebrow}>Policy schedule</p>
              <h2>Data lifecycle controls</h2>
            </div>
            <span>{policies.length} policies</span>
          </div>
          <div className={styles.retentionRows}>
            {policies.map((item) => (
              <button
                key={item.id}
                className={selected.id === item.id ? styles.selectedGovernance : ""}
                onClick={() => {
                  setSelectedId(item.id);
                  setNotice("");
                }}
                type="button"
              >
                <span className={styles.domainIcon}>
                  {item.disposition === "Secure deletion" ? <Trash2 size={15} /> : <Archive size={15} />}
                </span>
                <span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.module} · {item.classification}
                  </small>
                </span>
                <span>
                  <strong>{item.retentionPeriod}</strong>
                  <small>{item.disposition}</small>
                </span>
                <span>
                  <strong>{item.eligibleRecords}</strong>
                  <small>eligible records</small>
                </span>
                <RetentionBadge status={item.status} />
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </section>
        <aside className={`${common.card} ${styles.retentionDetail}`}>
          <div className={styles.governanceHeader}>
            <span className={styles.largeLock}>
              <Archive size={20} />
            </span>
            <div>
              <p className={common.eyebrow}>{selected.id}</p>
              <h2>{selected.name}</h2>
              <span>{selected.module}</span>
            </div>
            <RetentionBadge status={selected.status} />
          </div>
          <div className={styles.retentionClock}>
            <Clock3 size={18} />
            <span>
              <small>Retention period</small>
              <strong>{selected.retentionPeriod}</strong>
            </span>
          </div>
          <dl className={`${styles.detailList} ${styles.governanceFacts}`}>
            <div>
              <dt>Retention begins</dt>
              <dd>{selected.trigger}</dd>
            </div>
            <div>
              <dt>Final disposition</dt>
              <dd>{selected.disposition}</dd>
            </div>
            <div>
              <dt>Next automated run</dt>
              <dd>{formatDate(selected.nextRun)}</dd>
            </div>
            <div>
              <dt>Last completed run</dt>
              <dd>{formatDate(selected.lastRun)}</dd>
            </div>
          </dl>
          <div className={styles.disposalCounts}>
            <div>
              <strong>{selected.eligibleRecords}</strong>
              <span>Eligible</span>
            </div>
            <div>
              <strong>{selected.protectedRecords}</strong>
              <span>On legal hold</span>
            </div>
          </div>
          {selected.legalHold && (
            <div className={styles.riskNotice}>
              <LockKeyhole size={14} />
              <span>Legal-hold checks run before any disposition. Protected records remain unchanged.</span>
            </div>
          )}
          <div className={styles.retentionActions}>
            <button
              className={common.primaryButton}
              disabled={selected.status !== "Active" || selected.eligibleRecords === 0}
              onClick={runDisposition}
              type="button"
            >
              <Play size={14} />
              Run disposition job
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: SecurityEvent["severity"] }) {
  const className =
    severity === "Critical"
      ? styles.severityCritical
      : severity === "High"
        ? styles.severityHigh
        : severity === "Medium"
          ? styles.severityMedium
          : styles.severityLow;
  return <span className={`${styles.severityBadge} ${className}`}>{severity}</span>;
}

export function SecurityEventsView() {
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [events, setEvents] = useState(SECURITY_EVENTS);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [severity, setSeverity] = useState("All severities");
  const [selectedId, setSelectedId] = useState(SECURITY_EVENTS[0].id);
  const [notice, setNotice] = useState("");
  const scoped = events.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const filtered = scoped.filter(
    (item) =>
      `${item.id} ${item.type} ${item.summary} ${barangayName(item.barangayId)}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "All statuses" || item.status === status) &&
      (severity === "All severities" || item.severity === severity),
  );
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0];
  const selectedAccount = selected ? accountById.get(selected.accountId) : undefined;
  const open = scoped.filter((item) => item.status === "Open" || item.status === "Investigating").length;
  const critical = scoped.filter((item) => item.severity === "Critical").length;
  const notification = scoped.filter((item) => item.notificationRequired).length;
  const advanceIncident = () => {
    if (!selected) return;
    const next: Record<SecurityEvent["status"], SecurityEvent["status"]> = {
      Open: "Investigating",
      Investigating: "Contained",
      Contained: "Resolved",
      Resolved: "Resolved",
    };
    const nextStatus = next[selected.status];
    setEvents((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              status: nextStatus,
              responseSteps: item.responseSteps.map((step, index) =>
                index <= ["Open", "Investigating", "Contained", "Resolved"].indexOf(nextStatus)
                  ? { ...step, completed: true, completedAt: step.completedAt ?? "2026-09-23T17:58:00+08:00" }
                  : step,
              ),
            }
          : item,
      ),
    );
    setNotice(`${selected.id} moved to ${nextStatus}. The response timeline was updated.`);
  };

  return (
    <div className={common.page}>
      <header className={common.pageHeader}>
        <div>
          <p className={common.eyebrow}>A11 Privacy & Data Governance</p>
          <h1>Security Events and Breach Response</h1>
          <p>Detect, investigate, contain, and document security incidents for {selectedBarangayName}.</p>
        </div>
      </header>
      {notice && (
        <div className={styles.successNotice}>
          <CheckCircle2 size={15} />
          {notice}
        </div>
      )}
      <div className={common.summaryGrid}>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <BellRing size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>Detected events</span>
          </div>
        </div>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <ShieldAlert size={18} />
          </span>
          <div>
            <strong>{open}</strong>
            <span>Open investigations</span>
          </div>
        </div>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <AlertTriangle size={18} />
          </span>
          <div>
            <strong>{critical}</strong>
            <span>Critical severity</span>
          </div>
        </div>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <FileCheck2 size={18} />
          </span>
          <div>
            <strong>{notification}</strong>
            <span>Notification review</span>
          </div>
        </div>
      </div>
      <div className={styles.securityWorkspace}>
        <section className={`${common.card} ${styles.securityDirectory}`}>
          <div className={common.toolbar}>
            <label className={common.searchBox}>
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search event, barangay, or evidence"
              />
            </label>
            <select
              className={common.compactSelect}
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
              aria-label="Filter severity"
            >
              <option>All severities</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
            <select
              className={common.compactSelect}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter incident status"
            >
              <option>All statuses</option>
              <option>Open</option>
              <option>Investigating</option>
              <option>Contained</option>
              <option>Resolved</option>
            </select>
          </div>
          <div className={common.resultsMeta}>
            <span>
              <strong>{filtered.length}</strong> security events
            </span>
            <span>Latest detection first</span>
          </div>
          <div className={styles.securityList}>
            {filtered.map((item) => (
              <button
                key={item.id}
                className={selected?.id === item.id ? styles.selectedSecurity : ""}
                onClick={() => {
                  setSelectedId(item.id);
                  setNotice("");
                }}
                type="button"
              >
                <span className={styles.domainIcon}>
                  <ShieldAlert size={15} />
                </span>
                <span>
                  <strong>{item.type}</strong>
                  <small>
                    {item.id} · {barangayName(item.barangayId)}
                  </small>
                </span>
                <span>
                  <strong>{formatDateTime(item.detectedAt)}</strong>
                  <small>{item.status}</small>
                </span>
                <SeverityBadge severity={item.severity} />
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </section>
        {selected && selectedAccount && (
          <aside className={`${common.card} ${styles.securityDetail}`}>
            <div className={styles.securityHeader}>
              <span className={styles.largeLock}>
                <ShieldAlert size={20} />
              </span>
              <div>
                <p className={common.eyebrow}>{selected.id}</p>
                <h2>{selected.type}</h2>
                <span>{formatDateTime(selected.detectedAt)}</span>
              </div>
              <SeverityBadge severity={selected.severity} />
            </div>
            <div className={styles.incidentStatus}>
              <span>
                <small>Incident status</small>
                <strong>{selected.status}</strong>
              </span>
              <span>
                <small>Assigned to</small>
                <strong>{selected.assignedTo}</strong>
              </span>
            </div>
            {selected.notificationRequired && (
              <div className={styles.breachNotice}>
                <BellRing size={15} />
                <span>
                  <strong>Breach notification assessment required</strong>
                  <small>
                    Personal data may be involved in a critical event. Record the DPO decision and notification
                    timeline.
                  </small>
                </span>
              </div>
            )}
            <section className={styles.governanceSection}>
              <div className={styles.sectionTitle}>
                <Eye size={14} />
                <strong>Detection summary</strong>
              </div>
              <p>{selected.summary}</p>
            </section>
            <dl className={`${styles.detailList} ${styles.governanceFacts}`}>
              <div>
                <dt>Account</dt>
                <dd>
                  {selectedAccount.name} · {selectedAccount.employeeNumber}
                </dd>
              </div>
              <div>
                <dt>Barangay</dt>
                <dd>{barangayName(selected.barangayId)}</dd>
              </div>
              <div>
                <dt>IP address</dt>
                <dd>{selected.ipAddress}</dd>
              </div>
              <div>
                <dt>Records affected</dt>
                <dd>{selected.affectedRecords}</dd>
              </div>
              <div>
                <dt>Personal data</dt>
                <dd>{selected.personalDataInvolved ? "Potentially involved" : "No evidence"}</dd>
              </div>
            </dl>
            <section className={styles.governanceSection}>
              <div className={styles.sectionTitle}>
                <Fingerprint size={14} />
                <strong>Preserved evidence</strong>
                <span>{selected.evidence.length}</span>
              </div>
              <div className={styles.evidenceList}>
                {selected.evidence.map((item) => (
                  <span key={item}>
                    <HardDrive size={12} />
                    {item}
                  </span>
                ))}
              </div>
            </section>
            <section className={styles.governanceSection}>
              <div className={styles.sectionTitle}>
                <ShieldCheck size={14} />
                <strong>Response workflow</strong>
              </div>
              <div className={styles.responseSteps}>
                {selected.responseSteps.map((step) => (
                  <div key={step.label} className={step.completed ? styles.stepComplete : ""}>
                    <span>{step.completed ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}</span>
                    <strong>{step.label}</strong>
                    <small>{step.completedAt ? formatDateTime(step.completedAt) : "Pending"}</small>
                  </div>
                ))}
              </div>
            </section>
            <div className={styles.retentionActions}>
              <button
                className={common.primaryButton}
                disabled={selected.status === "Resolved"}
                onClick={advanceIncident}
                type="button"
              >
                <ShieldCheck size={14} />
                {selected.status === "Open"
                  ? "Start investigation"
                  : selected.status === "Investigating"
                    ? "Mark contained"
                    : selected.status === "Contained"
                      ? "Resolve incident"
                      : "Incident resolved"}
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
