"use client";

import { type FormEvent, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Plus, Search } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useSectorRegistryStore } from "../stores/sector-registry-store";
import type { SectorCode } from "../types/sector";

export function SectorAssignmentView({
  initialResidentId = "",
  initialSector = "",
}: {
  initialResidentId?: string;
  initialSector?: string;
}) {
  const residents = useResidentRegistryStore((state) => state.residents);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const memberships = useSectorRegistryStore((state) => state.memberships);
  const add = useSectorRegistryStore((state) => state.addMembership);
  const { selectedBarangay } = useBarangayScope();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [residentId, setResidentId] = useState(initialResidentId);
  const [sectorCode, setSectorCode] = useState<SectorCode | "">(initialSector as SectorCode | "");
  const [start, setStart] = useState("2026-09-23");
  const [end, setEnd] = useState("2029-09-22");
  const [documents, setDocuments] = useState("Barangay certification\nSupporting eligibility document");
  const [remarks, setRemarks] = useState("New sector classification for barangay review.");
  const [error, setError] = useState("");
  const selected = residents.find((item) => item.id === residentId);
  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return residents
      .filter(
        (resident) =>
          (selectedBarangay === "all" || resident.address.barangayId === selectedBarangay) &&
          resident.residentStatus === "Active" &&
          `${resident.lrn} ${formatResidentName(resident)}`.toLowerCase().includes(value),
      )
      .slice(0, 8);
  }, [query, residents, selectedBarangay]);
  const existingCodes = memberships
    .filter((item) => item.residentId === residentId && item.status !== "Inactive")
    .map((item) => item.sectorCode);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !sectorCode || !start || !documents.trim()) {
      setError("Select a resident, sector classification, validity start, and supporting documents.");
      return;
    }
    const membership = add({
      residentId: selected.id,
      sectorCode,
      validityStart: start,
      validityEnd: end,
      supportingDocuments: documents
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
      remarks,
    });
    if (!membership) {
      setError("This resident already has a current membership in the selected sector.");
      return;
    }
    router.push(`/barangay-affairs/sectors/residents/${selected.id}?created=1`);
  };
  return (
    <div className={`${styles.page} ${styles.formShell}`}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A3 Sectoral Registries</p>
          <h1>Assign sector classification</h1>
          <p>Link an existing A1 resident to a sector without creating a duplicate person record.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/sectors/masterlist">
          <ArrowLeft size={15} /> Masterlist
        </Link>
      </header>
      {error ? <div className={`${styles.toast} ${styles.error}`}>{error}</div> : null}
      <form onSubmit={submit}>
        <section className={styles.card}>
          <div className={styles.formBody}>
            <h2 className={styles.sectionTitle}>Resident</h2>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                aria-label="Search resident for sector assignment"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search active resident by name or LRN"
              />
            </label>
            {query && !selected ? (
              <div className={styles.searchResults}>
                {results.map((resident) => (
                  <button
                    type="button"
                    className={styles.decisionOption}
                    key={resident.id}
                    onClick={() => {
                      setResidentId(resident.id);
                      setQuery(formatResidentName(resident));
                    }}
                  >
                    <span>
                      <strong>{formatResidentName(resident)}</strong>
                      <small>
                        {resident.lrn} ·{" "}
                        {MATNOG_BARANGAYS.find((item) => item.code === resident.address.barangayId)?.name}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
            {selected ? (
              <div className={styles.eligibilityBanner}>
                <CheckCircle2Icon />
                <div>
                  <strong>{formatResidentName(selected)}</strong>
                  <span>
                    {selected.lrn} · Existing sectors: {existingCodes.length || "None"}
                  </span>
                </div>
              </div>
            ) : null}
            <h2 className={styles.sectionTitle}>Classification and validity</h2>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Sector *</span>
                <select value={sectorCode} onChange={(event) => setSectorCode(event.target.value as SectorCode)}>
                  <option value="">Select sector</option>
                  {definitions.map((definition) => (
                    <option
                      key={definition.code}
                      value={definition.code}
                      disabled={existingCodes.includes(definition.code)}
                    >
                      {definition.name}
                      {existingCodes.includes(definition.code) ? " · Already assigned" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Validity start *</span>
                <input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Validity end</span>
                <input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
              </label>
              <label className={`${styles.field} ${styles.span2}`}>
                <span>Supporting documents *</span>
                <textarea value={documents} onChange={(event) => setDocuments(event.target.value)} />
                <small>Enter one document per line.</small>
              </label>
              <label className={`${styles.field} ${styles.span2}`}>
                <span>Remarks</span>
                <textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} />
              </label>
            </div>
          </div>
        </section>
        <div className={styles.formActions}>
          <Link className={styles.secondaryButton} href="/barangay-affairs/sectors/masterlist">
            Cancel
          </Link>
          <button className={styles.primaryButton} type="submit">
            <Plus size={15} /> Submit for review
          </button>
        </div>
      </form>
    </div>
  );
}

function CheckCircle2Icon() {
  return <span aria-hidden="true">✓</span>;
}
