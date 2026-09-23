"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { calculateAge, formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useSectorRegistryStore } from "../stores/sector-registry-store";

const PAGE_SIZE = 25;
export function SectorMasterlistView() {
  const memberships = useSectorRegistryStore((state) => state.memberships);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const rows = useMemo(
    () =>
      residents
        .map((resident) => ({
          resident,
          memberships: memberships.filter(
            (item) =>
              item.residentId === resident.id &&
              (!sector || item.sectorCode === sector) &&
              (!status || item.status === status),
          ),
        }))
        .filter(
          ({ resident, memberships: items }) =>
            items.length &&
            (selectedBarangay === "all" || resident.address.barangayId === selectedBarangay) &&
            (!search.trim() ||
              `${resident.lrn} ${formatResidentName(resident)} ${resident.contact.primaryMobile}`
                .toLowerCase()
                .includes(search.trim().toLowerCase())),
        ),
    [memberships, residents, search, sector, selectedBarangay, status],
  );
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const update = (callback: () => void) => {
    callback();
    setPage(1);
  };
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A3 Sectoral Registries</p>
          <h1>Consolidated Sectoral Masterlist</h1>
          <p>One resident record with all applicable sector classifications and validity states.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/sectors/assign">
          <Plus size={15} /> Assign sector
        </Link>
      </header>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search sectoral residents"
              value={search}
              onChange={(event) => update(() => setSearch(event.target.value))}
              placeholder="Search resident name, LRN, or mobile"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="Sector classification"
            value={sector}
            onChange={(event) => update(() => setSector(event.target.value))}
          >
            <option value="">All sectors</option>
            {definitions.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            className={styles.compactSelect}
            aria-label="Membership status"
            value={status}
            onChange={(event) => update(() => setStatus(event.target.value))}
          >
            <option value="">All statuses</option>
            {["Active", "Pending Review", "Expired", "Inactive"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} classified residents</strong>
          <span>
            Showing {rows.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, rows.length)}
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1150 }}>
            <thead>
              <tr>
                <th>Resident</th>
                <th>LRN</th>
                <th>Barangay</th>
                <th>Age</th>
                <th>Sector Classifications</th>
                <th>Active</th>
                <th>Pending / Expired</th>
                <th>Latest Update</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(({ resident, memberships: items }) => (
                <tr key={resident.id}>
                  <td>
                    <strong>{formatResidentName(resident)}</strong>
                  </td>
                  <td className={styles.mono}>{resident.lrn}</td>
                  <td>{MATNOG_BARANGAYS.find((item) => item.code === resident.address.barangayId)?.name}</td>
                  <td>{calculateAge(resident.birthDate)}</td>
                  <td>
                    <div className={styles.sectorBadges}>
                      {items.map((membership) => {
                        const definition = definitions.find((item) => item.code === membership.sectorCode);
                        return (
                          <span
                            key={membership.id}
                            style={{ borderColor: definition?.color, color: definition?.color }}
                          >
                            {definition?.shortName}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td>{items.filter((item) => item.status === "Active").length}</td>
                  <td>
                    {items.filter((item) => item.status === "Pending Review" || item.status === "Expired").length}
                  </td>
                  <td>
                    {new Date(
                      [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0].updatedAt,
                    ).toLocaleDateString("en-PH")}
                  </td>
                  <td>
                    <Link
                      className={styles.secondaryButton}
                      href={`/barangay-affairs/sectors/residents/${resident.id}`}
                    >
                      View sectors
                    </Link>
                  </td>
                </tr>
              ))}
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
