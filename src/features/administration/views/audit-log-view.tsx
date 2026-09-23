"use client";

import { useMemo, useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  Download,
  Eye,
  FileClock,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import common from "@/features/resident-registry/components/resident-registry.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { ACCESS_ACCOUNTS } from "../data/access-data";
import { AUDIT_EVENTS, AUDIT_MODULES } from "../data/audit-data";
import type { AuditEvent } from "../types/access";
import styles from "./administration.module.css";

const accountById = new Map(ACCESS_ACCOUNTS.map((account) => [account.id, account]));
const barangayName = (id: string | null) =>
  id ? (MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id) : "Municipal-wide";
const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function ResultBadge({ result }: { result: AuditEvent["result"] }) {
  return (
    <span
      className={`${styles.statusBadge} ${result === "Success" ? styles.active : result === "Denied" ? styles.locked : styles.suspended}`}
    >
      {result}
    </span>
  );
}

const actionIcon = (action: AuditEvent["action"]) => {
  if (action === "Viewed") return <Eye size={14} />;
  if (action === "Exported") return <Download size={14} />;
  if (action === "Access changed") return <KeyRound size={14} />;
  if (action === "Sign-in") return <Fingerprint size={14} />;
  return <FileClock size={14} />;
};

export function AuditLogView() {
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [query, setQuery] = useState("");
  const [module, setModule] = useState("All modules");
  const [result, setResult] = useState("All results");
  const [sensitivity, setSensitivity] = useState("All classifications");
  const [selectedId, setSelectedId] = useState(AUDIT_EVENTS[0].id);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);

  const scoped = useMemo(
    () => AUDIT_EVENTS.filter((event) => selectedBarangay === "all" || event.barangayId === selectedBarangay),
    [selectedBarangay],
  );
  const filtered = scoped.filter((event) => {
    const actor = accountById.get(event.actorId);
    const text =
      `${event.id} ${actor?.name ?? ""} ${event.action} ${event.module} ${event.recordType} ${event.recordId} ${event.reason}`.toLowerCase();
    return (
      text.includes(query.toLowerCase()) &&
      (module === "All modules" || event.module === module) &&
      (result === "All results" || event.result === result) &&
      (sensitivity === "All classifications" || event.sensitivity === sensitivity)
    );
  });
  const selected = filtered.find((event) => event.id === selectedId) ?? filtered[0];
  const selectedActor = selected ? accountById.get(selected.actorId) : undefined;
  const today = scoped.filter((event) => event.occurredAt.startsWith("2026-09-23")).length;
  const sensitiveReads = scoped.filter((event) => event.action === "Viewed" && event.sensitivity !== "Standard").length;
  const denied = scoped.filter((event) => event.result !== "Success").length;

  const verifyIntegrity = () => setVerifiedAt("Sep 23, 2026 · 5:52 PM");

  return (
    <div className={common.page}>
      <header className={common.pageHeader}>
        <div>
          <p className={common.eyebrow}>A11 Security & Access Control</p>
          <h1>Immutable Audit Trail</h1>
          <p>
            Review access and record activity for {selectedBarangayName} without altering the original event history.
          </p>
        </div>
        <button className={common.primaryButton} onClick={verifyIntegrity} type="button">
          <ShieldCheck size={15} />
          Verify audit chain
        </button>
      </header>
      {verifiedAt && (
        <div className={styles.successNotice}>
          <CheckCircle2 size={15} />
          All {scoped.length} visible events passed the integrity check · Verified {verifiedAt}
        </div>
      )}
      <div className={common.summaryGrid}>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <Clock3 size={18} />
          </span>
          <div>
            <strong>{today}</strong>
            <span>Events today</span>
          </div>
        </div>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <Eye size={18} />
          </span>
          <div>
            <strong>{sensitiveReads}</strong>
            <span>Sensitive reads</span>
          </div>
        </div>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <AlertTriangle size={18} />
          </span>
          <div>
            <strong>{denied}</strong>
            <span>Denied or failed</span>
          </div>
        </div>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <Database size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>Immutable events</span>
          </div>
        </div>
      </div>
      <div className={styles.immutableBanner}>
        <LockKeyhole size={15} />
        <span>
          <strong>Append-only system record</strong>
          <small>Events cannot be edited or removed. Corrections create a new linked event.</small>
        </span>
        <span className={styles.chainStatus}>
          <CheckCircle2 size={13} />
          Chain intact
        </span>
      </div>
      <div className={styles.auditWorkspace}>
        <section className={`${common.card} ${styles.auditDirectory}`}>
          <div className={common.toolbar}>
            <label className={common.searchBox}>
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search actor, record, event ID, or reason"
              />
            </label>
            <select
              className={common.compactSelect}
              value={module}
              onChange={(event) => setModule(event.target.value)}
              aria-label="Filter audit module"
            >
              <option>All modules</option>
              {AUDIT_MODULES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              className={common.compactSelect}
              value={result}
              onChange={(event) => setResult(event.target.value)}
              aria-label="Filter audit result"
            >
              <option>All results</option>
              <option>Success</option>
              <option>Denied</option>
              <option>Failed</option>
            </select>
            <select
              className={common.compactSelect}
              value={sensitivity}
              onChange={(event) => setSensitivity(event.target.value)}
              aria-label="Filter classification"
            >
              <option>All classifications</option>
              <option>Standard</option>
              <option>Confidential</option>
              <option>Restricted</option>
              <option>Highly restricted</option>
            </select>
          </div>
          <div className={common.resultsMeta}>
            <span>
              <strong>{filtered.length}</strong> audit events
            </span>
            <span>Newest event first</span>
          </div>
          <div className={styles.auditList}>
            {filtered.map((event) => {
              const actor = accountById.get(event.actorId);
              return (
                <button
                  key={event.id}
                  className={selected?.id === event.id ? styles.selectedAudit : ""}
                  onClick={() => setSelectedId(event.id)}
                  type="button"
                >
                  <span className={styles.auditIcon}>{actionIcon(event.action)}</span>
                  <span>
                    <strong>
                      {event.action} {event.recordType}
                    </strong>
                    <small>
                      {event.recordId} · {event.module}
                    </small>
                  </span>
                  <span>
                    <strong>{actor?.name}</strong>
                    <small>{barangayName(event.barangayId)}</small>
                  </span>
                  <span>
                    <strong>{formatDateTime(event.occurredAt)}</strong>
                    <small>{event.ipAddress}</small>
                  </span>
                  <ResultBadge result={event.result} />
                  <ChevronRight size={15} />
                </button>
              );
            })}
            {!filtered.length && (
              <div className={styles.emptyState}>
                <FileClock size={28} />
                <strong>No audit events match</strong>
                <span>Change the search or filters.</span>
              </div>
            )}
          </div>
        </section>
        {selected && selectedActor && (
          <aside className={`${common.card} ${styles.auditDetail}`}>
            <div className={styles.auditDetailHeader}>
              <span className={styles.largeLock}>{actionIcon(selected.action)}</span>
              <div>
                <p className={common.eyebrow}>{selected.id}</p>
                <h2>
                  {selected.action} {selected.recordType}
                </h2>
                <span>{formatDateTime(selected.occurredAt)}</span>
              </div>
              <ResultBadge result={selected.result} />
            </div>
            <div className={styles.auditSubject}>
              <span>
                <Database size={14} />
                <small>Record</small>
                <strong>{selected.recordId}</strong>
              </span>
              <span>
                <ShieldCheck size={14} />
                <small>Classification</small>
                <strong>{selected.sensitivity}</strong>
              </span>
            </div>
            <section className={styles.auditSection}>
              <div className={styles.sectionTitle}>
                <UserRound size={14} />
                <strong>Actor and session</strong>
              </div>
              <dl className={styles.detailList}>
                <div>
                  <dt>Staff member</dt>
                  <dd>{selectedActor.name}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{selectedActor.role}</dd>
                </div>
                <div>
                  <dt>Scope</dt>
                  <dd>{barangayName(selected.barangayId)}</dd>
                </div>
                <div>
                  <dt>IP address</dt>
                  <dd>{selected.ipAddress}</dd>
                </div>
                <div>
                  <dt>Device</dt>
                  <dd>{selected.device}</dd>
                </div>
              </dl>
            </section>
            <section className={styles.auditSection}>
              <div className={styles.sectionTitle}>
                <KeyRound size={14} />
                <strong>Captured purpose</strong>
              </div>
              <p className={styles.reasonText}>{selected.reason}</p>
            </section>
            {selected.changes.length > 0 && (
              <section className={styles.auditSection}>
                <div className={styles.sectionTitle}>
                  <FileClock size={14} />
                  <strong>Recorded changes</strong>
                  <span>{selected.changes.length}</span>
                </div>
                <div className={styles.changeList}>
                  {selected.changes.map((change) => (
                    <div key={change.field}>
                      <strong>{change.field}</strong>
                      <span>
                        <del>{change.before}</del>
                        <ChevronRight size={11} />
                        <ins>{change.after}</ins>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <section className={styles.integrityPanel}>
              <Fingerprint size={16} />
              <span>
                <small>SHA-256 integrity fingerprint</small>
                <strong>{selected.integrityHash}</strong>
                <small>Sequence #{selected.sequence} · Previous event hash linked</small>
              </span>
              <CheckCircle2 size={16} />
            </section>
          </aside>
        )}
      </div>
    </div>
  );
}
