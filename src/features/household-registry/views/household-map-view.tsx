"use client";

import { useMemo, useState } from "react";

import dynamic from "next/dynamic";
import Link from "next/link";

import { Layers3, MapPin, Search, UsersRound } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useHouseholdRegistryStore } from "../stores/household-registry-store";
import { formatStructureAddress } from "../utils/household-utils";

const StructureInventoryMap = dynamic(
  () => import("../components/structure-inventory-map").then((module) => module.StructureInventoryMap),
  {
    ssr: false,
    loading: () => <div className={styles.structureInventoryMapLoading}>Loading structure map…</div>,
  },
);

export function HouseholdMapView() {
  const structures = useHouseholdRegistryStore((state) => state.structures);
  const households = useHouseholdRegistryStore((state) => state.households);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [barangayId, setBarangayId] = useState(selectedBarangay === "all" ? "" : selectedBarangay);
  const [occupancy, setOccupancy] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const visible = useMemo(
    () =>
      structures.filter((structure) => {
        if (barangayId && structure.barangayId !== barangayId) return false;
        const count = households.filter((household) => household.structureId === structure.id).length;
        if (occupancy === "single" && count !== 1) return false;
        if (occupancy === "multiple" && count < 2) return false;
        if (
          search.trim() &&
          !`${structure.structureCode} ${formatStructureAddress(structure)}`
            .toLowerCase()
            .includes(search.trim().toLowerCase())
        )
          return false;
        return true;
      }),
    [barangayId, households, occupancy, search, structures],
  );
  const selected = visible.find((structure) => structure.id === selectedId) ?? visible[0];
  const selectedHouseholds = selected ? households.filter((household) => household.structureId === selected.id) : [];
  const mapEntries = useMemo(
    () =>
      visible.map((structure) => {
        const linkedHouseholds = households.filter((household) => household.structureId === structure.id);
        return {
          id: structure.id,
          structureCode: structure.structureCode,
          address: formatStructureAddress(structure),
          latitude: structure.latitude,
          longitude: structure.longitude,
          householdCount: linkedHouseholds.length,
          residentCount: linkedHouseholds.reduce((total, household) => total + household.members.length, 0),
        };
      }),
    [households, visible],
  );

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${styles.householdHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>Structure GPS Map</h1>
            <p>
              {selectedBarangayName} &middot; {visible.length.toLocaleString()} mapped structure
              {visible.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href="/barangay-affairs/structures">
              <Layers3 size={16} /> Structure Inventory
            </Link>
          </div>
        </div>
      </section>
      <main className={styles.body}>
        <section className={styles.card}>
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                aria-label="Search map structures"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search structure code or address"
              />
            </label>
            <select
              className={styles.compactSelect}
              aria-label="Map barangay"
              value={barangayId}
              onChange={(event) => {
                setBarangayId(event.target.value);
                setSelectedId("");
              }}
            >
              <option value="">All 40 barangays</option>
              {MATNOG_BARANGAYS.map((barangay) => (
                <option key={barangay.code} value={barangay.code}>
                  {barangay.name}
                </option>
              ))}
            </select>
            <select
              className={styles.compactSelect}
              aria-label="Map occupancy"
              value={occupancy}
              onChange={(event) => setOccupancy(event.target.value)}
            >
              <option value="">All occupancy</option>
              <option value="single">Single household</option>
              <option value="multiple">Multi-household</option>
            </select>
          </div>
        </section>
        <div className={styles.mapLayout}>
          <section className={`${styles.card} ${styles.mapCanvas}`} aria-label="Structure location map">
            {mapEntries.length ? (
              <StructureInventoryMap entries={mapEntries} selectedId={selected?.id ?? ""} onSelect={setSelectedId} />
            ) : (
              <div className={styles.structureInventoryMapLoading}>No mapped structures match the filters.</div>
            )}
            <div className={styles.mapLegend}>
              <span>
                <i className={styles.legendSingle} /> Single household
              </span>
              <span>
                <i className={styles.legendShared} /> Multiple households
              </span>
              <strong>{visible.length} mapped structures</strong>
            </div>
          </section>
          <aside className={`${styles.card} ${styles.mapDetails}`}>
            {selected ? (
              <>
                <div className={styles.mapDetailsHeader}>
                  <span>
                    <MapPin size={19} />
                  </span>
                  <div>
                    <p className={styles.eyebrow}>Selected structure</p>
                    <h2>{selected.structureCode}</h2>
                  </div>
                </div>
                <p>{formatStructureAddress(selected)}</p>
                <dl className={styles.accessFacts}>
                  <div>
                    <dt>Barangay</dt>
                    <dd>{MATNOG_BARANGAYS.find((barangay) => barangay.code === selected.barangayId)?.name}</dd>
                  </div>
                  <div>
                    <dt>Coordinates</dt>
                    <dd>
                      {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
                    </dd>
                  </div>
                  <div>
                    <dt>Households</dt>
                    <dd>{selectedHouseholds.length}</dd>
                  </div>
                  <div>
                    <dt>Residents</dt>
                    <dd>{selectedHouseholds.reduce((total, household) => total + household.members.length, 0)}</dd>
                  </div>
                  <div>
                    <dt>Construction</dt>
                    <dd>{selected.dwelling.constructionMaterial}</dd>
                  </div>
                </dl>
                <div className={styles.mapHouseholds}>
                  <h3>
                    <UsersRound size={15} /> Occupants
                  </h3>
                  {selectedHouseholds.map((household) => {
                    const head = residents.find((resident) => resident.id === household.headResidentId);
                    return (
                      <Link href={`/barangay-affairs/households/${household.id}`} key={household.id}>
                        <strong>{household.householdNumber}</strong>
                        <small>
                          {head ? formatResidentName(head) : "Unknown head"} · {household.members.length} members
                        </small>
                      </Link>
                    );
                  })}
                </div>
                <Link className={styles.primaryButton} href={`/barangay-affairs/structures/${selected.id}`}>
                  View structure
                </Link>
              </>
            ) : (
              <div className={styles.empty}>
                <div>
                  <MapPin size={28} />
                  <h3>No structure selected</h3>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
