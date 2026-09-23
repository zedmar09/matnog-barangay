"use client";

import { useState } from "react";

import Link from "next/link";

import { BadgeCheck, CircleDollarSign, Download, FileCheck2, ReceiptText, Search, WalletCards } from "lucide-react";

import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useAssistanceStore } from "../stores/assistance-store";
import type { AssistanceRecord, LiquidationStatus } from "../types/assistance";
import assistanceStyles from "./assistance.module.css";

const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
const date = (value: string) => (value ? new Date(value).toLocaleDateString("en-PH") : "—");

function liquidationClass(status: LiquidationStatus) {
  return status === "Liquidated" ? styles.active : status === "Partially Liquidated" ? styles.warning : styles.danger;
}

export function DisbursementView() {
  const records = useAssistanceStore((state) => state.records);
  const markLiquidated = useAssistanceStore((state) => state.markLiquidated);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [fund, setFund] = useState("");
  const [office, setOffice] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const released = records.filter(
    (item) => item.status === "Released" && (selectedBarangay === "all" || item.barangayId === selectedBarangay),
  );
  const funds = Array.from(new Set(released.map((item) => item.fundSource))).sort();
  const offices = Array.from(new Set(released.map((item) => item.releasingOffice))).sort();
  const residentName = (id: string) => {
    const resident = residents.find((item) => item.id === id);
    return resident ? formatResidentName(resident) : "Resident record";
  };
  const rows = released.filter(
    (item) =>
      (!fund || item.fundSource === fund) &&
      (!office || item.releasingOffice === office) &&
      (!status || item.liquidationStatus === status) &&
      (!search.trim() ||
        `${item.referenceNumber} ${item.disbursementReference} ${item.officialReceiptNumber} ${residentName(item.residentId)}`
          .toLowerCase()
          .includes(search.toLowerCase())),
  );
  const disbursed = rows.reduce((sum, item) => sum + item.amount, 0);
  const liquidated = rows.reduce((sum, item) => sum + item.liquidatedAmount, 0);
  const balance = disbursed - liquidated;
  const fundRows = funds.map((fundSource) => {
    const items = released.filter((item) => item.fundSource === fundSource);
    const releasedAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const liquidatedAmount = items.reduce((sum, item) => sum + item.liquidatedAmount, 0);
    return {
      fundSource,
      count: items.length,
      releasedAmount,
      liquidatedAmount,
      balance: releasedAmount - liquidatedAmount,
      rate: releasedAmount ? Math.round((liquidatedAmount / releasedAmount) * 100) : 0,
    };
  });
  const officeRows = offices.map((officeName) => {
    const items = released.filter((item) => item.releasingOffice === officeName);
    return {
      officeName,
      count: items.length,
      amount: items.reduce((sum, item) => sum + item.amount, 0),
      pending: items.filter((item) => item.liquidationStatus !== "Liquidated").length,
    };
  });

  const exportCsv = () => {
    const headers = [
      "Reference",
      "Disbursement Reference",
      "Resident",
      "Household",
      "Assistance Type",
      "Fund Source",
      "Office",
      "Payment Mode",
      "Official Receipt",
      "Disbursed Amount",
      "Liquidated Amount",
      "Balance",
      "Liquidation Status",
      "Release Date",
      "Liquidation Date",
    ];
    const lines = rows.map((item) =>
      [
        item.referenceNumber,
        item.disbursementReference,
        residentName(item.residentId),
        item.householdId,
        item.assistanceType,
        item.fundSource,
        item.releasingOffice,
        item.paymentMode,
        item.officialReceiptNumber,
        item.amount,
        item.liquidatedAmount,
        item.amount - item.liquidatedAmount,
        item.liquidationStatus,
        item.releasedAt,
        item.liquidationDate,
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    );
    const blob = new Blob([[headers.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "matnog-assistance-disbursement-liquidation.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const liquidate = (item: AssistanceRecord) => {
    markLiquidated(item.id);
    setMessage(`${item.disbursementReference} marked fully liquidated with three required documents.`);
  };

  return (
    <div className={styles.page}>
      {message && (
        <div className={assistanceStyles.successNotice}>
          <BadgeCheck size={18} /> {message}
        </div>
      )}
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A7 Financial Accountability</p>
          <h1>Disbursement & Liquidation</h1>
          <p>{selectedBarangayName} fund reconciliation, supporting documents, and liquidation reporting.</p>
        </div>
        <button className={styles.primaryButton} type="button" onClick={exportCsv}>
          <Download size={15} /> Export filtered report
        </button>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <WalletCards size={18} />
          </span>
          <div>
            <strong>{rows.length}</strong>
            <span>Released transactions</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CircleDollarSign size={18} />
          </span>
          <div>
            <strong>{money(disbursed)}</strong>
            <span>Total disbursed</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <FileCheck2 size={18} />
          </span>
          <div>
            <strong>{money(liquidated)}</strong>
            <span>Liquidated amount</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ReceiptText size={18} />
          </span>
          <div>
            <strong>{money(balance)}</strong>
            <span>Outstanding balance</span>
          </div>
        </div>
      </div>
      <div className={assistanceStyles.reconciliationGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Fund reconciliation</p>
              <h2>Liquidation by fund source</h2>
            </div>
          </div>
          <div className={assistanceStyles.fundReconciliation}>
            {fundRows.map((item) => (
              <div key={item.fundSource}>
                <div>
                  <span>
                    <strong>{item.fundSource}</strong>
                    <small>{item.count} releases</small>
                  </span>
                  <span>
                    <strong>{item.rate}%</strong>
                    <small>{money(item.balance)} balance</small>
                  </span>
                </div>
                <i>
                  <b style={{ width: `${item.rate}%` }} />
                </i>
                <footer>
                  <span>Disbursed {money(item.releasedAmount)}</span>
                  <span>Liquidated {money(item.liquidatedAmount)}</span>
                </footer>
              </div>
            ))}
          </div>
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Office accountability</p>
              <h2>Releasing offices</h2>
            </div>
          </div>
          <div className={assistanceStyles.officeReconciliation}>
            {officeRows.map((item) => (
              <div key={item.officeName}>
                <span>
                  <strong>{item.officeName}</strong>
                  <small>
                    {item.count} releases · {money(item.amount)}
                  </small>
                </span>
                <span className={`${styles.badge} ${item.pending ? styles.warning : styles.active}`}>
                  {item.pending} pending
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Transaction reconciliation</p>
            <h2>Released assistance ledger</h2>
          </div>
          <Link className={styles.secondaryButton} href="/barangay-affairs/assistance/ledger">
            Full assistance ledger
          </Link>
        </div>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search disbursement report"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reference, receipt, or resident"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="Fund source"
            value={fund}
            onChange={(event) => setFund(event.target.value)}
          >
            <option value="">All funds</option>
            {funds.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            className={styles.compactSelect}
            aria-label="Releasing office"
            value={office}
            onChange={(event) => setOffice(event.target.value)}
          >
            <option value="">All offices</option>
            {offices.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            className={styles.compactSelect}
            aria-label="Liquidation status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            <option>Unliquidated</option>
            <option>Partially Liquidated</option>
            <option>Liquidated</option>
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} released transactions</strong>
          <span>Showing the first 60 · balances update from filtered transactions</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1650 }}>
            <thead>
              <tr>
                <th>Assistance</th>
                <th>Disbursement</th>
                <th>Resident</th>
                <th>Household</th>
                <th>Type</th>
                <th>Fund</th>
                <th>Office</th>
                <th>Mode</th>
                <th>Receipt</th>
                <th>Disbursed</th>
                <th>Liquidated</th>
                <th>Balance</th>
                <th>Documents</th>
                <th>Status</th>
                <th>Liquidation date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 60).map((item) => (
                <tr key={item.id}>
                  <td className={styles.mono}>{item.referenceNumber}</td>
                  <td className={styles.mono}>{item.disbursementReference}</td>
                  <td>{residentName(item.residentId)}</td>
                  <td className={styles.mono}>{item.householdId}</td>
                  <td>{item.assistanceType}</td>
                  <td>{item.fundSource}</td>
                  <td>{item.releasingOffice}</td>
                  <td>{item.paymentMode}</td>
                  <td className={styles.mono}>{item.officialReceiptNumber}</td>
                  <td>{money(item.amount)}</td>
                  <td>{money(item.liquidatedAmount)}</td>
                  <td>{money(item.amount - item.liquidatedAmount)}</td>
                  <td>{item.liquidationDocuments.length}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${liquidationClass(item.liquidationStatus as LiquidationStatus)}`}
                    >
                      {item.liquidationStatus}
                    </span>
                  </td>
                  <td>{date(item.liquidationDate)}</td>
                  <td>
                    {item.liquidationStatus !== "Liquidated" && (
                      <button className={styles.primaryButton} type="button" onClick={() => liquidate(item)}>
                        <BadgeCheck size={14} /> Mark liquidated
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
