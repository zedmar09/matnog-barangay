"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowLeft, Plus, Search, UsersRound } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { calculateAge, formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useSectorRegistryStore } from "../stores/sector-registry-store";
import type { SectorCode } from "../types/sector";

const slugMap: Record<string, SectorCode> = {
  seniors: "senior",
  senior: "senior",
  pwd: "pwd",
  "solo-parents": "solo-parent",
  "solo-parent": "solo-parent",
  children: "child",
  child: "child",
  youth: "youth",
  osy: "osy",
  indigent: "indigent",
  ip: "ip",
  "4ps": "4ps",
};

export function SectorRegistryView({ slug }: { slug: string }) {
  const code = slugMap[slug];
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const memberships = useSectorRegistryStore((state) => state.memberships);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const definition = definitions.find((item) => item.code === code);
  if (!definition)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <UsersRound size={34} />
          <h1>Sector registry not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/sectors">
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  const rows = memberships
    .filter((membership) => membership.sectorCode === code && (!status || membership.status === status))
    .map((membership) => ({ membership, resident: residents.find((item) => item.id === membership.residentId) }))
    .filter(
      ({ resident }) =>
        resident &&
        (selectedBarangay === "all" || resident.address.barangayId === selectedBarangay) &&
        (!search.trim() ||
          `${resident.lrn} ${formatResidentName(resident)}`.toLowerCase().includes(search.trim().toLowerCase())),
    );
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A3 Sectoral Registry</p>
          <h1>{definition.name}</h1>
          <p>{definition.description} Records remain connected to the permanent municipal resident identity.</p>
        </div>
        <div className={styles.headerButtonGroup}>
          <Link className={styles.secondaryButton} href="/barangay-affairs/sectors">
            <ArrowLeft size={15} /> Dashboard
          </Link>
          <Link className={styles.primaryButton} href={`/barangay-affairs/sectors/assign?sector=${definition.code}`}>
            <Plus size={15} /> Add member
          </Link>
        </div>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon} style={{ color: definition.color }}>
            <UsersRound size={18} />
          </span>
          <div>
            <strong>{rows.length}</strong>
            <span>Total members</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <UsersRound size={18} />
          </span>
          <div>
            <strong>{rows.filter(({ membership }) => membership.status === "Active").length}</strong>
            <span>Active</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <UsersRound size={18} />
          </span>
          <div>
            <strong>{rows.filter(({ membership }) => membership.status === "Pending Review").length}</strong>
            <span>Pending review</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <UsersRound size={18} />
          </span>
          <div>
            <strong>{rows.filter(({ membership }) => membership.status === "Expired").length}</strong>
            <span>Expired</span>
          </div>
        </div>
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label={`Search ${definition.name}`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search resident name or LRN"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="Sector member status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {["Active", "Pending Review", "Expired", "Inactive"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1080 }}>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Resident</th>
                <th>LRN</th>
                <th>Barangay</th>
                <th>Age</th>
                <th>Validity</th>
                <th>Documents</th>
                <th>Issuing Office</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ membership, resident }) =>
                resident ? (
                  <tr key={membership.id}>
                    <td className={styles.mono}>{membership.referenceNumber}</td>
                    <td>
                      <strong>{formatResidentName(resident)}</strong>
                    </td>
                    <td className={styles.mono}>{resident.lrn}</td>
                    <td>{MATNOG_BARANGAYS.find((item) => item.code === resident.address.barangayId)?.name}</td>
                    <td>{calculateAge(resident.birthDate)}</td>
                    <td>
                      {membership.validityStart} – {membership.validityEnd || "Age-based"}
                    </td>
                    <td>{membership.supportingDocuments.length}</td>
                    <td>{membership.issuingOffice}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${membership.status === "Active" ? styles.active : membership.status === "Expired" ? styles.danger : styles.warning}`}
                      >
                        {membership.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        className={styles.secondaryButton}
                        href={`/barangay-affairs/sectors/residents/${resident.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ) : null,
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
