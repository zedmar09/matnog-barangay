"use client";

import { useMemo, useState } from "react";

import {
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPin,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Smartphone,
  UserCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import common from "@/features/resident-registry/components/resident-registry.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { ACCESS_ACCOUNTS, ACCESS_ROLES } from "../data/access-data";
import type { AccountStatus, StaffAccount } from "../types/access";
import styles from "./administration.module.css";

const barangayName = (id: string | null) =>
  id ? (MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id) : "Municipal-wide";

const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : "Not yet signed in";

function StatusBadge({ status }: { status: AccountStatus }) {
  const statusClass =
    status === "Active"
      ? styles.active
      : status === "Invited"
        ? styles.invited
        : status === "Locked"
          ? styles.locked
          : styles.suspended;
  return <span className={`${styles.statusBadge} ${statusClass}`}>{status}</span>;
}

function AccountDetail({ account }: { account: StaffAccount }) {
  return (
    <aside className={`${common.card} ${styles.detailPanel}`}>
      <div className={styles.profileHeader}>
        <span className={styles.largeAvatar}>{account.initials}</span>
        <div>
          <p className={common.eyebrow}>{account.employeeNumber}</p>
          <h2>{account.name}</h2>
          <span className={styles.profilePosition}>{account.position}</span>
        </div>
        <StatusBadge status={account.status} />
      </div>

      <div className={styles.profileActions}>
        <button className={common.primaryButton} type="button">
          <KeyRound size={14} /> Manage access
        </button>
        <button className={common.secondaryButton} type="button" aria-label="More account actions">
          <MoreHorizontal size={15} />
        </button>
      </div>

      <section className={styles.detailSection}>
        <div className={styles.sectionTitle}>
          <UserCheck size={15} />
          <strong>Account assignment</strong>
        </div>
        <dl className={styles.detailList}>
          <div>
            <dt>Role</dt>
            <dd>{account.role}</dd>
          </div>
          <div>
            <dt>Office</dt>
            <dd>{account.office}</dd>
          </div>
          <div>
            <dt>Data scope</dt>
            <dd>{account.barangayId ? `Brgy. ${barangayName(account.barangayId)}` : "All 40 barangays"}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>
              {new Date(`${account.createdAt}T00:00:00`).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </dd>
          </div>
        </dl>
      </section>

      <section className={styles.detailSection}>
        <div className={styles.sectionTitle}>
          <ShieldCheck size={15} />
          <strong>Permission groups</strong>
          <span>{account.permissionGroups.length}</span>
        </div>
        <div className={styles.permissionList}>
          {account.permissionGroups.map((permission) => (
            <span key={permission}>
              <CheckCircle2 size={13} />
              {permission}
            </span>
          ))}
        </div>
      </section>

      <section className={styles.detailSection}>
        <div className={styles.sectionTitle}>
          <LockKeyhole size={15} />
          <strong>Sign-in security</strong>
        </div>
        <div className={styles.securityRows}>
          <div>
            <span>
              <Clock3 size={14} />
              Last sign-in
            </span>
            <strong>{formatDateTime(account.lastLoginAt)}</strong>
          </div>
          <div>
            <span>
              <MapPin size={14} />
              Last IP address
            </span>
            <strong>{account.lastLoginIp ?? "—"}</strong>
          </div>
          <div>
            <span>
              <Smartphone size={14} />
              Two-step verification
            </span>
            <strong className={account.twoFactorEnabled ? styles.goodText : styles.warningText}>
              {account.twoFactorEnabled ? "Enabled" : "Setup required"}
            </strong>
          </div>
        </div>
      </section>

      <section className={styles.detailSection}>
        <div className={styles.sectionTitle}>
          <Mail size={15} />
          <strong>Contact</strong>
        </div>
        <p className={styles.contactLine}>{account.email}</p>
        <p className={styles.contactLine}>{account.mobile}</p>
      </section>
    </aside>
  );
}

export function AccessDashboardView() {
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All roles");
  const [status, setStatus] = useState("All statuses");
  const [selectedId, setSelectedId] = useState(ACCESS_ACCOUNTS[0].id);

  const scoped = useMemo(
    () => ACCESS_ACCOUNTS.filter((account) => selectedBarangay === "all" || account.barangayId === selectedBarangay),
    [selectedBarangay],
  );
  const filtered = scoped.filter((account) => {
    const text = `${account.name} ${account.employeeNumber} ${account.email} ${account.office}`.toLowerCase();
    return (
      text.includes(query.toLowerCase()) &&
      (role === "All roles" || account.role === role) &&
      (status === "All statuses" || account.status === status)
    );
  });
  const selected = filtered.find((account) => account.id === selectedId) ?? filtered[0];
  const active = scoped.filter((account) => account.status === "Active").length;
  const attention = scoped.filter((account) => account.status === "Locked" || account.status === "Suspended").length;
  const protectedAccounts = scoped.filter((account) => account.twoFactorEnabled).length;
  const coveredBarangays = new Set(scoped.flatMap((account) => account.barangayId ?? [])).size;

  return (
    <div className={common.page}>
      <header className={common.pageHeader}>
        <div>
          <p className={common.eyebrow}>A11 Security & Access Control</p>
          <h1>Users and Access Dashboard</h1>
          <p>Manage staff identities, account health, and barangay access scope for {selectedBarangayName}.</p>
        </div>
        <button className={common.primaryButton} type="button">
          <UserPlus size={15} />
          Create staff account
        </button>
      </header>

      <div className={common.summaryGrid}>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <UsersRound size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>Total staff accounts</span>
          </div>
        </div>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <UserCheck size={18} />
          </span>
          <div>
            <strong>{active}</strong>
            <span>Active accounts</span>
          </div>
        </div>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <CircleAlert size={18} />
          </span>
          <div>
            <strong>{attention}</strong>
            <span>Need attention</span>
          </div>
        </div>
        <div className={common.summaryCard}>
          <span className={common.summaryIcon}>
            <ShieldCheck size={18} />
          </span>
          <div>
            <strong>
              {protectedAccounts}/{scoped.length}
            </strong>
            <span>Two-step protected</span>
          </div>
        </div>
      </div>

      <div className={styles.scopeStrip}>
        <div>
          <Building2 size={16} />
          <span>
            <strong>{selectedBarangay === "all" ? coveredBarangays : 1}</strong> barangays represented
          </span>
        </div>
        <div>
          <ShieldCheck size={16} />
          <span>
            <strong>{ACCESS_ROLES.length}</strong> operational roles
          </span>
        </div>
        <div>
          <LockKeyhole size={16} />
          <span>Administrative access is logged and reviewed</span>
        </div>
      </div>

      <div className={styles.workspace}>
        <section className={`${common.card} ${styles.directory}`}>
          <div className={common.toolbar}>
            <label className={common.searchBox}>
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search staff, ID, email, or office"
              />
            </label>
            <select
              className={common.compactSelect}
              value={role}
              onChange={(event) => setRole(event.target.value)}
              aria-label="Filter by role"
            >
              <option>All roles</option>
              {ACCESS_ROLES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              className={common.compactSelect}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
            >
              <option>All statuses</option>
              <option>Active</option>
              <option>Invited</option>
              <option>Locked</option>
              <option>Suspended</option>
            </select>
          </div>
          <div className={common.resultsMeta}>
            <span>
              <strong>{filtered.length}</strong> accounts
            </span>
            <span>{selectedBarangay === "all" ? "Municipal and barangay staff" : selectedBarangayName}</span>
          </div>
          <div className={styles.accountList}>
            {filtered.map((account) => (
              <button
                key={account.id}
                className={selected?.id === account.id ? styles.selectedAccount : ""}
                onClick={() => setSelectedId(account.id)}
                type="button"
              >
                <span className={styles.avatar}>{account.initials}</span>
                <span className={styles.accountIdentity}>
                  <strong>{account.name}</strong>
                  <small>
                    {account.position} · {barangayName(account.barangayId)}
                  </small>
                </span>
                <span className={styles.accountRole}>
                  <strong>{account.role}</strong>
                  <small>{account.employeeNumber}</small>
                </span>
                <span className={styles.loginInfo}>
                  <strong>{account.lastLoginAt ? "Last sign-in" : "Invitation pending"}</strong>
                  <small>{formatDateTime(account.lastLoginAt)}</small>
                </span>
                <StatusBadge status={account.status} />
                <ChevronRight size={15} />
              </button>
            ))}
            {!filtered.length && (
              <div className={styles.emptyState}>
                <UsersRound size={28} />
                <strong>No accounts match these filters</strong>
                <span>Change the search, role, or account status.</span>
              </div>
            )}
          </div>
        </section>
        {selected ? (
          <AccountDetail account={selected} />
        ) : (
          <aside className={`${common.card} ${styles.emptyDetail}`}>Select a staff account to review access.</aside>
        )}
      </div>
    </div>
  );
}
