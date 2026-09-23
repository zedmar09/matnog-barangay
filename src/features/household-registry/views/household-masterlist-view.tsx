"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { ChevronLeft, ChevronRight, HousePlus, Search } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useHouseholdRegistryStore } from "../stores/household-registry-store";
import { formatStructureAddress, householdRiskLabels, isHouseholdStale } from "../utils/household-utils";

const PAGE_SIZE = 25;

export function HouseholdMasterlistView() {
  const households = useHouseholdRegistryStore((state) => state.households);
  const structures = useHouseholdRegistryStore((state) => state.structures);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [verification, setVerification] = useState("");
  const [vulnerability, setVulnerability] = useState("");
  const [page, setPage] = useState(1);
  const rows = useMemo(
    () =>
      households.filter((household) => {
        if (selectedBarangay !== "all" && household.barangayId !== selectedBarangay) return false;
        if (verification === "current" && isHouseholdStale(household)) return false;
        if (verification === "stale" && !isHouseholdStale(household)) return false;
        const risks = householdRiskLabels(household);
        if (vulnerability && !risks.includes(vulnerability)) return false;
        const head = residents.find((resident) => resident.id === household.headResidentId);
        const structure = structures.find((item) => item.id === household.structureId);
        const haystack =
          `${household.householdNumber} ${head ? formatResidentName(head) : ""} ${structure?.structureCode ?? ""} ${structure ? formatStructureAddress(structure) : ""}`.toLowerCase();
        return !search.trim() || haystack.includes(search.trim().toLowerCase());
      }),
    [households, residents, search, selectedBarangay, structures, verification, vulnerability],
  );
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const update = (action: () => void) => {
    action();
    setPage(1);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A2 Household Registry</p>
          <h1>Household Masterlist</h1>
          <p>Review household membership, structures, vulnerability indicators, and verification status.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/households/register">
          <HousePlus size={15} /> Register household
        </Link>
      </header>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search households"
              value={search}
              onChange={(event) => update(() => setSearch(event.target.value))}
              placeholder="Search household number, head, structure, or address"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="Verification status"
            value={verification}
            onChange={(event) => update(() => setVerification(event.target.value))}
          >
            <option value="">All verification</option>
            <option value="current">Current</option>
            <option value="stale">Needs reverification</option>
          </select>
          <select
            className={styles.compactSelect}
            aria-label="Vulnerability filter"
            value={vulnerability}
            onChange={(event) => update(() => setVulnerability(event.target.value))}
          >
            <option value="">All vulnerability flags</option>
            {[
              "Senior",
              "PWD",
              "Pregnant / lactating",
              "Under 5",
              "Solo parent",
              "Bedridden / oxygen-dependent",
              "IP",
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} households</strong>
          <span>
            Showing {rows.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, rows.length)}
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1250 }}>
            <thead>
              <tr>
                <th>Household No.</th>
                <th>Household Head</th>
                <th>Barangay</th>
                <th>Structure</th>
                <th>Address</th>
                <th>Members</th>
                <th>Income</th>
                <th>Vulnerability</th>
                <th>Last Verified</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((household) => {
                const head = residents.find((resident) => resident.id === household.headResidentId);
                const structure = structures.find((item) => item.id === household.structureId);
                const risks = householdRiskLabels(household);
                return (
                  <tr key={household.id}>
                    <td className={styles.mono}>{household.householdNumber}</td>
                    <td>
                      <div className={styles.nameCell}>
                        <strong>{head ? formatResidentName(head) : "Unknown"}</strong>
                        <small>{head?.lrn}</small>
                      </div>
                    </td>
                    <td>{MATNOG_BARANGAYS.find((barangay) => barangay.code === household.barangayId)?.name ?? "—"}</td>
                    <td className={styles.mono}>{structure?.structureCode ?? "—"}</td>
                    <td>
                      <span className={styles.truncatedAddress}>
                        {structure ? formatStructureAddress(structure) : "—"}
                      </span>
                    </td>
                    <td>{household.members.filter((member) => !member.leftAt).length}</td>
                    <td>{household.monthlyIncomeBracket}</td>
                    <td>
                      <div className={styles.signals}>
                        {risks.length ? (
                          risks.slice(0, 3).map((risk) => (
                            <span className={styles.signal} key={risk}>
                              {risk}
                            </span>
                          ))
                        ) : (
                          <span className={styles.muted}>None recorded</span>
                        )}
                      </div>
                    </td>
                    <td>{new Date(household.lastVerifiedAt).toLocaleDateString("en-PH")}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${isHouseholdStale(household) ? styles.warning : styles.active}`}
                      >
                        {isHouseholdStale(household) ? "Needs verification" : "Current"}
                      </span>
                    </td>
                    <td>
                      <Link className={styles.secondaryButton} href={`/barangay-affairs/households/${household.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.pagination}>
          <span>
            Page {page} of {pages}
          </span>
          <button
            type="button"
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => setPage((value) => value - 1)}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            aria-label="Next page"
            disabled={page === pages}
            onClick={() => setPage((value) => value + 1)}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}
