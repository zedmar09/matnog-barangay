"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { ChevronLeft, ChevronRight, Map as MapIcon, MapPin, Plus, Search } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useHouseholdRegistryStore } from "../stores/household-registry-store";
import { formatStructureAddress } from "../utils/household-utils";

const PAGE_SIZE = 25;

export function StructureMasterlistView() {
  const structures = useHouseholdRegistryStore((state) => state.structures);
  const households = useHouseholdRegistryStore((state) => state.households);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [occupancy, setOccupancy] = useState("");
  const [mapping, setMapping] = useState("");
  const [page, setPage] = useState(1);
  const rows = useMemo(
    () =>
      structures.filter((structure) => {
        if (selectedBarangay !== "all" && structure.barangayId !== selectedBarangay) return false;
        const count = households.filter((household) => household.structureId === structure.id).length;
        if (occupancy === "vacant" && count !== 0) return false;
        if (occupancy === "single" && count !== 1) return false;
        if (occupancy === "multiple" && count < 2) return false;
        if (mapping === "mapped" && (!structure.latitude || !structure.longitude)) return false;
        if (mapping === "missing" && structure.latitude && structure.longitude) return false;
        const haystack =
          `${structure.structureCode} ${formatStructureAddress(structure)} ${structure.dwelling.constructionMaterial}`.toLowerCase();
        return !search.trim() || haystack.includes(search.trim().toLowerCase());
      }),
    [households, mapping, occupancy, search, selectedBarangay, structures],
  );
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const mapped = structures.filter((structure) => structure.latitude && structure.longitude).length;
  const shared = structures.filter(
    (structure) => households.filter((household) => household.structureId === structure.id).length > 1,
  ).length;
  const update = (callback: () => void) => {
    callback();
    setPage(1);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A2 Structures & Addresses</p>
          <h1>Structure Inventory</h1>
          <p>Maintain one normalized address and GPS location for every physical dwelling.</p>
        </div>
        <div className={styles.headerButtonGroup}>
          <Link className={styles.secondaryButton} href="/barangay-affairs/households/map">
            <MapIcon size={15} /> GPS map
          </Link>
          <Link className={styles.primaryButton} href="/barangay-affairs/structures/new">
            <Plus size={15} /> Register structure
          </Link>
        </div>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <MapPin size={18} />
          </span>
          <div>
            <strong>{structures.length}</strong>
            <span>Total structures</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <MapIcon size={18} />
          </span>
          <div>
            <strong>{mapped}</strong>
            <span>GPS mapped</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <MapPin size={18} />
          </span>
          <div>
            <strong>{shared}</strong>
            <span>Multi-household dwellings</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <MapPin size={18} />
          </span>
          <div>
            <strong>{households.length}</strong>
            <span>Linked households</span>
          </div>
        </div>
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search structures"
              value={search}
              onChange={(event) => update(() => setSearch(event.target.value))}
              placeholder="Search structure code, address, or material"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="Household occupancy"
            value={occupancy}
            onChange={(event) => update(() => setOccupancy(event.target.value))}
          >
            <option value="">All occupancy</option>
            <option value="vacant">No household</option>
            <option value="single">One household</option>
            <option value="multiple">Multiple households</option>
          </select>
          <select
            className={styles.compactSelect}
            aria-label="GPS mapping"
            value={mapping}
            onChange={(event) => update(() => setMapping(event.target.value))}
          >
            <option value="">All mapping status</option>
            <option value="mapped">GPS mapped</option>
            <option value="missing">Missing coordinates</option>
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} structures</strong>
          <span>
            Showing {rows.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, rows.length)}
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1200 }}>
            <thead>
              <tr>
                <th>Structure Code</th>
                <th>Barangay</th>
                <th>Normalized Address</th>
                <th>GPS Coordinates</th>
                <th>Households</th>
                <th>Construction</th>
                <th>Tenure</th>
                <th>Water</th>
                <th>Power</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((structure) => {
                const linked = households.filter((household) => household.structureId === structure.id);
                return (
                  <tr key={structure.id}>
                    <td className={styles.mono}>{structure.structureCode}</td>
                    <td>{MATNOG_BARANGAYS.find((barangay) => barangay.code === structure.barangayId)?.name ?? "—"}</td>
                    <td>
                      <span className={styles.truncatedAddress}>{formatStructureAddress(structure)}</span>
                    </td>
                    <td className={styles.mono}>
                      {structure.latitude && structure.longitude
                        ? `${structure.latitude.toFixed(5)}, ${structure.longitude.toFixed(5)}`
                        : "Not mapped"}
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${linked.length > 1 ? styles.info : linked.length ? styles.active : styles.warning}`}
                      >
                        {linked.length} household{linked.length === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td>{structure.dwelling.constructionMaterial}</td>
                    <td>{structure.dwelling.tenure}</td>
                    <td>{structure.dwelling.waterSource}</td>
                    <td>{structure.dwelling.powerSource}</td>
                    <td>
                      <Link className={styles.secondaryButton} href={`/barangay-affairs/structures/${structure.id}`}>
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
