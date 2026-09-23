"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { AlertTriangle, Clock3, FilePlus2, MapPin, Scale, Search, ShieldAlert, ShieldCheck } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { usePeaceOrderStore } from "../stores/peace-order-store";
import type { BlotterStatus, IncidentType } from "../types/blotter";
import peaceStyles from "./peace-order.module.css";

function badge(status: BlotterStatus) {
  return status === "Closed"
    ? styles.active
    : status === "Under Investigation"
      ? styles.info
      : status === "Referred to Lupon"
        ? styles.warning
        : styles.danger;
}

export function PeaceOrderDashboardView() {
  const records = usePeaceOrderStore((state) => state.blotterRecords);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const scoped = records.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const types = Array.from(new Set(scoped.map((item) => item.incidentType)));
  return (
    <div className={styles.page}>
      <div className={peaceStyles.restrictedBanner}>
        <ShieldAlert size={17} />
        <span>
          Peace and order records are permission-restricted and barangay-scoped. Sensitive VAW, BCPC, and BADAC records
          use separate access classes.
        </span>
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A5 Peace & Order</p>
          <h1>Peace & Order Dashboard</h1>
          <p>{selectedBarangayName} operational blotter overview and case workload.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/peace-order/blotter/new">
          <FilePlus2 size={15} /> File incident
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ShieldCheck size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>Blotter records</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Clock3 size={18} />
          </span>
          <div>
            <strong>
              {scoped.filter((item) => item.status === "Filed" || item.status === "Under Investigation").length}
            </strong>
            <span>Active cases</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Scale size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.status === "Referred to Lupon").length}</strong>
            <span>Referred to Lupon</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <AlertTriangle size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.priority === "High" && item.status !== "Closed").length}</strong>
            <span>High priority</span>
          </div>
        </div>
      </div>
      <div className={peaceStyles.dashboardGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Recent activity</p>
              <h2>Latest blotter entries</h2>
            </div>
            <Link className={styles.secondaryButton} href="/barangay-affairs/peace-order/blotter">
              Open blotter
            </Link>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table} style={{ minWidth: 850 }}>
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Incident</th>
                  <th>Location</th>
                  <th>Complainant</th>
                  <th>Respondent</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {scoped.slice(0, 12).map((record) => (
                  <tr key={record.id}>
                    <td className={styles.mono}>{record.caseNumber}</td>
                    <td>{record.incidentType}</td>
                    <td>
                      <MapPin size={12} /> {record.location}
                    </td>
                    <td>{record.complainant.fullName}</td>
                    <td>{record.respondent.fullName}</td>
                    <td>
                      <span className={`${styles.badge} ${badge(record.status)}`}>{record.status}</span>
                    </td>
                    <td>
                      <Link
                        className={styles.secondaryButton}
                        href={`/barangay-affairs/peace-order/blotter/${record.id}`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Incident profile</p>
              <h2>Cases by type</h2>
            </div>
          </div>
          <div className={peaceStyles.typeGrid}>
            {types.map((type) => (
              <div className={peaceStyles.typeCard} key={type}>
                <span>{type}</span>
                <strong>{scoped.filter((item) => item.incidentType === type).length}</strong>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function BlotterMasterlistView() {
  const records = usePeaceOrderStore((state) => state.blotterRecords);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const rows = useMemo(
    () =>
      records.filter(
        (record) =>
          (selectedBarangay === "all" || record.barangayId === selectedBarangay) &&
          (!status || record.status === status) &&
          (!type || record.incidentType === type) &&
          (!search.trim() ||
            `${record.caseNumber} ${record.complainant.fullName} ${record.respondent.fullName} ${record.location}`
              .toLowerCase()
              .includes(search.toLowerCase())),
      ),
    [records, search, selectedBarangay, status, type],
  );
  const incidentTypes: IncidentType[] = [
    "Physical Injury",
    "Threats",
    "Property Dispute",
    "Noise Complaint",
    "Theft",
    "Public Disturbance",
    "Domestic Dispute",
    "Other",
  ];
  return (
    <div className={styles.page}>
      <div className={peaceStyles.restrictedBanner}>
        <ShieldAlert size={17} />
        Access to case bodies is logged and restricted to authorized barangay peace and order personnel.
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A5 Blotter Registry</p>
          <h1>Barangay Blotter</h1>
          <p>Incident intake and case tracking linked to resident identities when applicable.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/peace-order/blotter/new">
          <FilePlus2 size={15} /> File incident
        </Link>
      </header>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search blotter"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search case, party, or location"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="Incident type"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="">All incident types</option>
            {incidentTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            className={styles.compactSelect}
            aria-label="Case status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {["Filed", "Under Investigation", "Referred to Lupon", "Closed"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} records</strong>
          <span>Showing the latest 30</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1200 }}>
            <thead>
              <tr>
                <th>Case number</th>
                <th>Reported</th>
                <th>Incident</th>
                <th>Barangay</th>
                <th>Location</th>
                <th>Complainant</th>
                <th>Respondent</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 30).map((record) => (
                <tr key={record.id}>
                  <td className={styles.mono}>{record.caseNumber}</td>
                  <td>{new Date(record.reportedAt).toLocaleDateString("en-PH")}</td>
                  <td>{record.incidentType}</td>
                  <td>{MATNOG_BARANGAYS.find((item) => item.code === record.barangayId)?.name}</td>
                  <td>{record.location}</td>
                  <td>{record.complainant.fullName}</td>
                  <td>{record.respondent.fullName}</td>
                  <td>
                    <span className={`${styles.badge} ${record.priority === "High" ? styles.danger : styles.info}`}>
                      {record.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${badge(record.status)}`}>{record.status}</span>
                  </td>
                  <td>
                    <Link
                      className={styles.secondaryButton}
                      href={`/barangay-affairs/peace-order/blotter/${record.id}`}
                    >
                      View case
                    </Link>
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
