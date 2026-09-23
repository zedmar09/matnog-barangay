"use client";

import { useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  KeyRound,
  LockKeyhole,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import common from "@/features/resident-registry/components/resident-registry.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { ACCESS_ACCOUNTS } from "../data/access-data";
import { PURPOSE_RULES, SENSITIVE_DOMAINS, SENSITIVE_GRANTS } from "../data/sensitive-access-data";
import type { PurposeRule, SensitiveGrant } from "../types/access";
import styles from "./administration.module.css";

const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
const formatDateTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "Never used";
const accountById = new Map(ACCESS_ACCOUNTS.map((account) => [account.id, account]));

function GrantStatus({ status }: { status: SensitiveGrant["status"] }) {
  return (
    <span
      className={`${styles.statusBadge} ${status === "Active" ? styles.active : status === "Expiring" ? styles.locked : styles.suspended}`}
    >
      {status}
    </span>
  );
}

export function SensitivePermissionsView() {
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [grants, setGrants] = useState(SENSITIVE_GRANTS);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("All domains");
  const [status, setStatus] = useState("All statuses");
  const [selectedId, setSelectedId] = useState(SENSITIVE_GRANTS[0].id);
  const [notice, setNotice] = useState("");

  const scoped = grants.filter((grant) => {
    const account = accountById.get(grant.accountId);
    return selectedBarangay === "all" || account?.barangayId === selectedBarangay;
  });
  const filtered = scoped.filter((grant) => {
    const account = accountById.get(grant.accountId);
    const text =
      `${account?.name ?? ""} ${account?.employeeNumber ?? ""} ${grant.domain} ${grant.access}`.toLowerCase();
    return (
      text.includes(query.toLowerCase()) &&
      (domain === "All domains" || grant.domain === domain) &&
      (status === "All statuses" || grant.status === status)
    );
  });
  const selected = filtered.find((grant) => grant.id === selectedId) ?? filtered[0];
  const selectedAccount = selected ? accountById.get(selected.accountId) : undefined;
  const active = scoped.filter((grant) => grant.status === "Active").length;
  const attention = scoped.filter((grant) => grant.status !== "Active").length;
  const usedThisMonth = scoped.filter((grant) => grant.lastUsedAt?.startsWith("2026-09")).length;

  const toggleGrant = () => {
    if (!selected) return;
    const nextStatus = selected.status === "Revoked" ? "Active" : "Revoked";
    setGrants((current) =>
      current.map((grant) => (grant.id === selected.id ? { ...grant, status: nextStatus } : grant)),
    );
    setNotice(
      `${selected.domain} access for ${selectedAccount?.name} was ${nextStatus === "Active" ? "restored" : "revoked"}.`,
    );
  };

  return (
    <div className={common.page}>
      <header className={common.pageHeader}>
        <div>
          <p className={common.eyebrow}>A11 Security & Access Control</p>
          <h1>Sensitive Data Permissions</h1>
          <p>Control separately authorized access to protected records for {selectedBarangayName}.</p>
        </div>
        <button className={common.primaryButton} type="button">
          <Plus size={15} />
          Grant sensitive access
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
            <KeyRound size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>Access assignments</span>
          </div>
        </div>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <ShieldCheck size={18} />
          </span>
          <div>
            <strong>{active}</strong>
            <span>Active grants</span>
          </div>
        </div>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <AlertTriangle size={18} />
          </span>
          <div>
            <strong>{attention}</strong>
            <span>Need review</span>
          </div>
        </div>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <Eye size={18} />
          </span>
          <div>
            <strong>{usedThisMonth}</strong>
            <span>Used this month</span>
          </div>
        </div>
      </div>
      <div className={styles.sensitiveWorkspace}>
        <section className={`${common.card} ${styles.sensitiveDirectory}`}>
          <div className={common.toolbar}>
            <label className={common.searchBox}>
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search staff or access type"
              />
            </label>
            <select
              className={common.compactSelect}
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              aria-label="Filter by sensitive domain"
            >
              <option>All domains</option>
              {SENSITIVE_DOMAINS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              className={common.compactSelect}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by grant status"
            >
              <option>All statuses</option>
              <option>Active</option>
              <option>Expiring</option>
              <option>Revoked</option>
            </select>
          </div>
          <div className={common.resultsMeta}>
            <span>
              <strong>{filtered.length}</strong> sensitive access grants
            </span>
            <span>Purpose captured on every read</span>
          </div>
          <div className={styles.grantList}>
            {filtered.map((grant) => {
              const account = accountById.get(grant.accountId);
              return (
                <button
                  key={grant.id}
                  className={selected?.id === grant.id ? styles.selectedGrant : ""}
                  onClick={() => {
                    setSelectedId(grant.id);
                    setNotice("");
                  }}
                  type="button"
                >
                  <span className={styles.domainIcon}>
                    <LockKeyhole size={15} />
                  </span>
                  <span>
                    <strong>{account?.name}</strong>
                    <small>
                      {account?.position} · {account?.employeeNumber}
                    </small>
                  </span>
                  <span>
                    <strong>{grant.domain}</strong>
                    <small>{grant.access}</small>
                  </span>
                  <span>
                    <strong>{formatDate(grant.expiresAt)}</strong>
                    <small>Access expiry</small>
                  </span>
                  <GrantStatus status={grant.status} />
                  <ChevronRight size={15} />
                </button>
              );
            })}
            {!filtered.length && (
              <div className={styles.emptyState}>
                <LockKeyhole size={28} />
                <strong>No grants match these filters</strong>
                <span>Change the search, domain, or status.</span>
              </div>
            )}
          </div>
        </section>
        {selected && selectedAccount && (
          <aside className={`${common.card} ${styles.grantDetail}`}>
            <div className={styles.grantHeader}>
              <span className={styles.largeLock}>
                <ShieldAlert size={21} />
              </span>
              <div>
                <p className={common.eyebrow}>{selected.id}</p>
                <h2>{selected.domain} Access</h2>
                <span>{selectedAccount.name}</span>
              </div>
              <GrantStatus status={selected.status} />
            </div>
            <div className={styles.grantBanner}>
              <LockKeyhole size={14} />
              <span>A purpose and access reason are required before protected records open.</span>
            </div>
            <dl className={styles.detailList}>
              <div>
                <dt>Permission</dt>
                <dd>{selected.access}</dd>
              </div>
              <div>
                <dt>Account role</dt>
                <dd>{selectedAccount.role}</dd>
              </div>
              <div>
                <dt>Data scope</dt>
                <dd>{selectedAccount.barangayId ? selectedAccount.office : "Municipality-wide"}</dd>
              </div>
              <div>
                <dt>Approved by</dt>
                <dd>{selected.approvedBy}</dd>
              </div>
              <div>
                <dt>Approved</dt>
                <dd>{formatDate(selected.approvedAt)}</dd>
              </div>
              <div>
                <dt>Expires</dt>
                <dd>{formatDate(selected.expiresAt)}</dd>
              </div>
            </dl>
            <div className={styles.lastAccess}>
              <Clock3 size={15} />
              <span>
                <small>Last sensitive-record access</small>
                <strong>{formatDateTime(selected.lastUsedAt)}</strong>
              </span>
            </div>
            <div className={styles.grantControls}>
              <button
                className={selected.status === "Revoked" ? common.primaryButton : common.dangerButton}
                onClick={toggleGrant}
                type="button"
              >
                {selected.status === "Revoked" ? <RotateCcw size={14} /> : <LockKeyhole size={14} />}
                {selected.status === "Revoked" ? "Restore access" : "Revoke access"}
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export function AccessPurposeRulesView() {
  const [rules, setRules] = useState(PURPOSE_RULES);
  const [savedRules, setSavedRules] = useState(PURPOSE_RULES);
  const [selectedId, setSelectedId] = useState(PURPOSE_RULES[0].id);
  const [newPurpose, setNewPurpose] = useState("");
  const [notice, setNotice] = useState("");
  const selected = rules.find((rule) => rule.id === selectedId) ?? rules[0];
  const savedSelected = savedRules.find((rule) => rule.id === selected.id);
  const hasChanges = JSON.stringify(selected) !== JSON.stringify(savedSelected);

  const updateRule = (changes: Partial<PurposeRule>) =>
    setRules((current) => current.map((rule) => (rule.id === selected.id ? { ...rule, ...changes } : rule)));
  const addPurpose = () => {
    const value = newPurpose.trim();
    if (!value || selected.purposes.includes(value)) return;
    updateRule({ purposes: [...selected.purposes, value] });
    setNewPurpose("");
  };
  const removePurpose = (purpose: string) =>
    updateRule({ purposes: selected.purposes.filter((item) => item !== purpose) });
  const saveRule = () => {
    setSavedRules(rules);
    setNotice(`${selected.domain} access-purpose rule saved.`);
  };
  const resetRule = () => {
    if (savedSelected) setRules((current) => current.map((rule) => (rule.id === selected.id ? savedSelected : rule)));
    setNotice("");
  };

  return (
    <div className={common.page}>
      <header className={common.pageHeader}>
        <div>
          <p className={common.eyebrow}>A11 Security & Access Control</p>
          <h1>Access Purpose Rules</h1>
          <p>Require a valid official purpose before users can open sensitive records.</p>
        </div>
      </header>
      {notice && (
        <div className={styles.successNotice}>
          <CheckCircle2 size={15} />
          {notice}
        </div>
      )}
      <div className={styles.purposeWorkspace}>
        <section className={`${common.card} ${styles.purposeDirectory}`}>
          <div className={styles.panelHeading}>
            <div>
              <p className={common.eyebrow}>Protected domains</p>
              <h2>Purpose rules</h2>
            </div>
            <span>{rules.length} active</span>
          </div>
          <div className={styles.purposeList}>
            {rules.map((rule) => (
              <button
                key={rule.id}
                className={selected.id === rule.id ? styles.selectedRole : ""}
                onClick={() => {
                  setSelectedId(rule.id);
                  setNotice("");
                }}
                type="button"
              >
                <span className={styles.domainIcon}>
                  <ShieldAlert size={15} />
                </span>
                <span>
                  <strong>{rule.domain}</strong>
                  <small>{rule.classification}</small>
                </span>
                <span>
                  <strong>{rule.purposes.length}</strong>
                  <small>allowed purposes</small>
                </span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </section>
        <section className={`${common.card} ${styles.ruleEditor}`}>
          <div className={styles.permissionHeader}>
            <div>
              <div className={styles.roleTitleLine}>
                <span>{selected.classification}</span>
                <span>{selected.id}</span>
              </div>
              <h2>{selected.domain}</h2>
              <p>{selected.description}</p>
            </div>
            <span className={styles.scopeBadge}>
              <ShieldCheck size={13} />
              Rule active
            </span>
          </div>
          <div className={styles.ruleGrid}>
            <div className={styles.ruleForm}>
              <label className={common.field}>
                <span>Purpose prompt</span>
                <input
                  value={selected.promptTitle}
                  onChange={(event) => updateRule({ promptTitle: event.target.value })}
                />
              </label>
              <div className={styles.ruleChecks}>
                <label>
                  <input
                    checked={selected.reasonRequired}
                    onChange={(event) => updateRule({ reasonRequired: event.target.checked })}
                    type="checkbox"
                  />
                  <span>
                    <strong>Require written reason</strong>
                    <small>User must explain why the record is needed.</small>
                  </span>
                </label>
                <label>
                  <input
                    checked={selected.acknowledgementRequired}
                    onChange={(event) => updateRule({ acknowledgementRequired: event.target.checked })}
                    type="checkbox"
                  />
                  <span>
                    <strong>Require confidentiality acknowledgement</strong>
                    <small>User confirms proper handling before continuing.</small>
                  </span>
                </label>
                <label>
                  <input
                    checked={selected.logEveryRead}
                    onChange={(event) => updateRule({ logEveryRead: event.target.checked })}
                    type="checkbox"
                  />
                  <span>
                    <strong>Log every record read</strong>
                    <small>Record actor, reason, timestamp, record, and IP.</small>
                  </span>
                </label>
              </div>
              <div className={styles.purposeOptions}>
                <div className={styles.sectionTitle}>
                  <KeyRound size={14} />
                  <strong>Allowed official purposes</strong>
                  <span>{selected.purposes.length}</span>
                </div>
                {selected.purposes.map((purpose) => (
                  <div key={purpose}>
                    <CheckCircle2 size={13} />
                    <span>{purpose}</span>
                    <button aria-label={`Remove ${purpose}`} onClick={() => removePurpose(purpose)} type="button">
                      ×
                    </button>
                  </div>
                ))}
                <div className={styles.addPurpose}>
                  <input
                    value={newPurpose}
                    onChange={(event) => setNewPurpose(event.target.value)}
                    placeholder="Add another official purpose"
                  />
                  <button onClick={addPurpose} type="button">
                    <Plus size={13} />
                    Add
                  </button>
                </div>
              </div>
            </div>
            <aside className={styles.promptPreview}>
              <p className={common.eyebrow}>Staff prompt preview</p>
              <div className={styles.previewDialog}>
                <span className={styles.largeLock}>
                  <LockKeyhole size={20} />
                </span>
                <h3>{selected.promptTitle}</h3>
                <p>This access will be written to the immutable audit log.</p>
                <label>
                  Official purpose
                  <select>
                    <option>Select a purpose</option>
                    {selected.purposes.map((purpose) => (
                      <option key={purpose}>{purpose}</option>
                    ))}
                  </select>
                </label>
                {selected.reasonRequired && (
                  <label>
                    Access reason
                    <textarea placeholder="Explain the specific service or case need" />
                  </label>
                )}
                {selected.acknowledgementRequired && (
                  <label className={styles.previewCheck}>
                    <input type="checkbox" />I understand this record is confidential.
                  </label>
                )}
                <button type="button">Continue to record</button>
              </div>
              <div className={styles.visibilityNote}>
                <Eye size={14} />
                <span>
                  <strong>Municipal view: {selected.municipalVisibility}</strong>
                  <small>Access reasons are retained for {selected.retentionDays} days.</small>
                </span>
              </div>
            </aside>
          </div>
          <div className={styles.permissionFooter}>
            <span>Rule changes are recorded in the administration audit history.</span>
            <div>
              {hasChanges && (
                <span className={styles.unsaved}>
                  <span />
                  Unsaved changes
                </span>
              )}
              <button className={common.secondaryButton} disabled={!hasChanges} onClick={resetRule} type="button">
                Discard
              </button>
              <button className={common.primaryButton} disabled={!hasChanges} onClick={saveRule} type="button">
                <Save size={14} />
                Save rule
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
