"use client";

import Link from "next/link";

import { AlertTriangle, Home, HousePlus, MapPinned, ShieldCheck, UsersRound } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useHouseholdRegistryStore } from "../stores/household-registry-store";
import { householdRiskLabels, isHouseholdStale } from "../utils/household-utils";

export function HouseholdDashboardView() {
  const households = useHouseholdRegistryStore((state) => state.households);
  const structures = useHouseholdRegistryStore((state) => state.structures);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const scoped = households.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const scopedStructures = structures.filter(
    (item) => selectedBarangay === "all" || item.barangayId === selectedBarangay,
  );
  const memberCount = scoped.reduce((total, item) => total + item.members.filter((member) => !member.leftAt).length, 0);
  const vulnerable = scoped.filter((item) => householdRiskLabels(item).length > 0);
  const stale = scoped.filter(isHouseholdStale);
  const barangayRows = MATNOG_BARANGAYS.map((barangay) => {
    const items = households.filter((household) => household.barangayId === barangay.code);
    return {
      ...barangay,
      households: items.length,
      members: items.reduce((total, item) => total + item.members.length, 0),
      vulnerable: items.filter((item) => householdRiskLabels(item).length).length,
      stale: items.filter(isHouseholdStale).length,
    };
  }).filter((row) => selectedBarangay === "all" || row.code === selectedBarangay);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A2 Household Registry</p>
          <h1>Households & Structures</h1>
          <p>{selectedBarangayName} household inventory connected to permanent A1 resident records.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/households/register">
          <HousePlus size={15} /> Register household
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Home size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>Registered households</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <UsersRound size={18} />
          </span>
          <div>
            <strong>{memberCount}</strong>
            <span>Linked residents</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <MapPinned size={18} />
          </span>
          <div>
            <strong>{scopedStructures.length}</strong>
            <span>Mapped structures</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <AlertTriangle size={18} />
          </span>
          <div>
            <strong>{stale.length}</strong>
            <span>Need reverification</span>
          </div>
        </div>
      </div>
      <div className={styles.householdDashboardGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Coverage rollup</p>
              <h2>Barangay household inventory</h2>
            </div>
            <Link className={styles.secondaryButton} href="/barangay-affairs/households/masterlist">
              Open masterlist
            </Link>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table} style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th>Barangay</th>
                  <th>Households</th>
                  <th>Members</th>
                  <th>Vulnerable</th>
                  <th>Needs Verification</th>
                  <th>Coverage</th>
                </tr>
              </thead>
              <tbody>
                {barangayRows.map((row) => (
                  <tr key={row.code}>
                    <td>
                      <strong>{row.name}</strong>
                    </td>
                    <td>{row.households}</td>
                    <td>{row.members}</td>
                    <td>{row.vulnerable}</td>
                    <td>{row.stale}</td>
                    <td>
                      <span className={`${styles.badge} ${row.stale === 0 ? styles.active : styles.warning}`}>
                        {row.stale === 0 ? "Current" : "Follow-up"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <aside className={styles.card}>
          <div className={styles.householdSidePanel}>
            <h2>
              <ShieldCheck size={17} /> Priority households
            </h2>
            <p>Households with vulnerability indicators or stale verification records.</p>
            <div className={styles.priorityList}>
              {[...vulnerable]
                .sort((a, b) => Number(isHouseholdStale(b)) - Number(isHouseholdStale(a)))
                .slice(0, 8)
                .map((household) => {
                  const head = residents.find((item) => item.id === household.headResidentId);
                  return (
                    <Link key={household.id} href={`/barangay-affairs/households/${household.id}`}>
                      <span>
                        <strong>{household.householdNumber}</strong>
                        <small>{head ? formatResidentName(head) : "Unknown household head"}</small>
                      </span>
                      <span className={`${styles.badge} ${isHouseholdStale(household) ? styles.warning : styles.info}`}>
                        {isHouseholdStale(household) ? "Stale" : `${householdRiskLabels(household).length} flags`}
                      </span>
                    </Link>
                  );
                })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
