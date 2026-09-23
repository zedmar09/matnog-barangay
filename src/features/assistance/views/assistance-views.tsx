"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  BadgeAlert,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FilePlus2,
  HandCoins,
  Search,
  WalletCards,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { ASSISTANCE_TYPES } from "../data/assistance-data";
import { useAssistanceStore } from "../stores/assistance-store";
import type { AssistanceRecord } from "../types/assistance";
import assistanceStyles from "./assistance.module.css";

const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
const date = (value: string) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-PH") : "—");

function StatusBadge({ status }: { status: AssistanceRecord["status"] }) {
  return (
    <span
      className={`${styles.badge} ${status === "Released" ? styles.active : status === "Held" ? styles.danger : styles.warning}`}
    >
      {status}
    </span>
  );
}

export function AssistanceDashboardView() {
  const records = useAssistanceStore((state) => state.records);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const scoped = records.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const released = scoped.filter((item) => item.status === "Released");
  const totalReleased = released.reduce((sum, item) => sum + item.amount, 0);
  const residentName = (id: string) => {
    const resident = residents.find((item) => item.id === id);
    return resident ? formatResidentName(resident) : "Resident record";
  };
  const typeTotals = ASSISTANCE_TYPES.map((type) => ({
    type,
    count: scoped.filter((item) => item.assistanceType === type).length,
    amount: scoped
      .filter((item) => item.assistanceType === type && item.status === "Released")
      .reduce((sum, item) => sum + item.amount, 0),
  }));
  const maxAmount = Math.max(...typeTotals.map((item) => item.amount), 1);
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A7 Assistance & Benefits</p>
          <h1>Assistance Operations Dashboard</h1>
          <p>{selectedBarangayName} assistance activity linked to municipal resident and household records.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/assistance/new">
          <FilePlus2 size={15} /> New assistance
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <WalletCards size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>Total assistance records</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CircleDollarSign size={18} />
          </span>
          <div>
            <strong>{money(totalReleased)}</strong>
            <span>Released assistance</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Clock3 size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.status === "Pending Review").length}</strong>
            <span>Pending review</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <BadgeAlert size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.status === "Held").length}</strong>
            <span>Duplicate alerts</span>
          </div>
        </div>
      </div>
      <div className={assistanceStyles.dashboardGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Assistance mix</p>
              <h2>Released value by type</h2>
            </div>
            <Link className={styles.secondaryButton} href="/barangay-affairs/assistance/ledger">
              Open ledger
            </Link>
          </div>
          <div className={assistanceStyles.assistanceBars}>
            {typeTotals.map((item) => (
              <div key={item.type}>
                <span>
                  <strong>{item.type}</strong>
                  <small>
                    {item.count} records · {money(item.amount)}
                  </small>
                </span>
                <i>
                  <b style={{ width: `${(item.amount / maxAmount) * 100}%` }} />
                </i>
              </div>
            ))}
          </div>
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Control checks</p>
              <h2>Review queue</h2>
            </div>
          </div>
          <div className={assistanceStyles.reviewList}>
            <Link href="/barangay-affairs/assistance/ledger?status=Pending%20Review">
              <Clock3 size={17} />
              <span>
                <strong>{scoped.filter((item) => item.status === "Pending Review").length} pending records</strong>
                <small>Awaiting approval and release</small>
              </span>
            </Link>
            <Link href="/barangay-affairs/assistance/alerts">
              <BadgeAlert size={17} />
              <span>
                <strong>{scoped.filter((item) => item.duplicateFlag).length} possible duplicates</strong>
                <small>Cross-office records requiring review</small>
              </span>
            </Link>
            <Link href="/barangay-affairs/assistance/disbursement">
              <CheckCircle2 size={17} />
              <span>
                <strong>{released.length} completed releases</strong>
                <small>Ready for disbursement reporting</small>
              </span>
            </Link>
          </div>
        </aside>
      </div>
      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Latest activity</p>
            <h2>Recent assistance records</h2>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Resident</th>
                <th>Barangay</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Office</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {scoped.slice(0, 12).map((item) => (
                <tr key={item.id}>
                  <td className={styles.mono}>{item.referenceNumber}</td>
                  <td>
                    <Link href={`/barangay-affairs/residents/${item.residentId}`}>{residentName(item.residentId)}</Link>
                  </td>
                  <td>{barangayName(item.barangayId)}</td>
                  <td>{item.assistanceType}</td>
                  <td>{money(item.amount)}</td>
                  <td>{item.releasingOffice}</td>
                  <td>{date(item.assistanceDate)}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function AssistanceLedgerView() {
  const records = useAssistanceStore((state) => state.records);
  const release = useAssistanceStore((state) => state.releaseAssistance);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const rows = useMemo(
    () =>
      records.filter((item) => {
        const resident = residents.find((entry) => entry.id === item.residentId);
        const name = resident ? formatResidentName(resident) : "";
        return (
          (selectedBarangay === "all" || item.barangayId === selectedBarangay) &&
          (!type || item.assistanceType === type) &&
          (!status || item.status === status) &&
          (!search.trim() || `${item.referenceNumber} ${name}`.toLowerCase().includes(search.toLowerCase()))
        );
      }),
    [records, residents, search, selectedBarangay, status, type],
  );
  const residentName = (id: string) => {
    const resident = residents.find((item) => item.id === id);
    return resident ? formatResidentName(resident) : "Resident record";
  };
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A7 Unified Transaction Record</p>
          <h1>Assistance Ledger</h1>
          <p>{selectedBarangayName} releases across barangay and municipal offices.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/assistance/new">
          <FilePlus2 size={15} /> New assistance
        </Link>
      </header>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search assistance ledger"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reference or resident"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="Assistance type"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="">All types</option>
            {ASSISTANCE_TYPES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            className={styles.compactSelect}
            aria-label="Assistance status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            <option>Pending Review</option>
            <option>Released</option>
            <option>Held</option>
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} ledger records</strong>
          <span>Showing the first 60 · linked to A1 residents and A2 households</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1450 }}>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Resident</th>
                <th>Household</th>
                <th>Barangay</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Fund</th>
                <th>Office</th>
                <th>Date</th>
                <th>Documents</th>
                <th>Cooling until</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 60).map((item) => (
                <tr key={item.id}>
                  <td className={styles.mono}>{item.referenceNumber}</td>
                  <td>
                    <Link href={`/barangay-affairs/residents/${item.residentId}`}>{residentName(item.residentId)}</Link>
                  </td>
                  <td>
                    {item.householdId ? (
                      <Link className={styles.mono} href={`/barangay-affairs/households/${item.householdId}`}>
                        {item.householdId}
                      </Link>
                    ) : (
                      "Unlinked"
                    )}
                  </td>
                  <td>{barangayName(item.barangayId)}</td>
                  <td>{item.assistanceType}</td>
                  <td>{money(item.amount)}</td>
                  <td>{item.fundSource}</td>
                  <td>{item.releasingOffice}</td>
                  <td>{date(item.assistanceDate)}</td>
                  <td>{item.supportingDocuments.length}</td>
                  <td>{date(item.coolingEndsAt)}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    {item.status === "Pending Review" && (
                      <button className={styles.primaryButton} type="button" onClick={() => release(item.id)}>
                        <HandCoins size={14} /> Release
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
