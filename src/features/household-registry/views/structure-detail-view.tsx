"use client";

import Link from "next/link";

import { ArrowLeft, Home, MapPin, Pencil, RadioTower, Waves, Wifi, Zap } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";

import { useHouseholdRegistryStore } from "../stores/household-registry-store";
import { formatStructureAddress } from "../utils/household-utils";

function Rows({ items }: { items: Array<[string, string | number]> }) {
  return (
    <dl className={styles.dataList}>
      {items.map(([label, value]) => (
        <div className={styles.dataRow} key={label}>
          <dt>{label}</dt>
          <dd>{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function StructureDetailView({ id }: { id: string }) {
  const structure = useHouseholdRegistryStore((state) => state.structures.find((item) => item.id === id));
  const households = useHouseholdRegistryStore((state) => state.households);
  const residents = useResidentRegistryStore((state) => state.residents);
  if (!structure)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <MapPin size={34} />
          <h1>Structure not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/structures">
            Return to inventory
          </Link>
        </div>
      </div>
    );
  const linked = households.filter((household) => household.structureId === structure.id);
  const barangay = MATNOG_BARANGAYS.find((item) => item.code === structure.barangayId)?.name ?? "—";
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A2 Structure Record</p>
          <h1>{structure.structureCode}</h1>
          <p>
            {formatStructureAddress(structure)} · Brgy. {barangay}
          </p>
        </div>
        <div className={styles.headerButtonGroup}>
          <Link className={styles.secondaryButton} href="/barangay-affairs/structures">
            <ArrowLeft size={15} /> Inventory
          </Link>
          <Link className={styles.primaryButton} href={`/barangay-affairs/structures/${structure.id}/edit`}>
            <Pencil size={14} /> Edit structure
          </Link>
        </div>
      </header>
      <div className={styles.structureDetailGrid}>
        <section className={styles.card}>
          <div className={styles.structureMapPreview}>
            <div className={styles.mapRoadOne} />
            <div className={styles.mapRoadTwo} />
            <span className={styles.mapPinLarge}>
              <MapPin size={25} />
            </span>
            <div className={styles.mapCoordinate}>
              <strong>Verified GPS location</strong>
              <span>
                {structure.latitude.toFixed(6)}, {structure.longitude.toFixed(6)}
              </span>
            </div>
          </div>
        </section>
        <section className={styles.card}>
          <div className={styles.householdSidePanel}>
            <h2>
              <MapPin size={16} /> Address hierarchy
            </h2>
            <Rows
              items={[
                ["Barangay", barangay],
                ["Purok", structure.purok],
                ["Sitio", structure.sitio],
                ["Zone", structure.zone],
                ["Street / road", structure.street],
                ["House number", structure.houseNumber],
              ]}
            />
          </div>
        </section>
      </div>
      <div className={styles.profileGrid}>
        <section className={styles.detailCard}>
          <h3>
            <Home size={15} /> Dwelling profile
          </h3>
          <Rows
            items={[
              ["Construction material", structure.dwelling.constructionMaterial],
              ["Tenure", structure.dwelling.tenure],
              ["Households in structure", linked.length],
              ["Total residents", linked.reduce((total, household) => total + household.members.length, 0)],
            ]}
          />
        </section>
        <section className={styles.detailCard}>
          <h3>
            <Waves size={15} /> Water and sanitation
          </h3>
          <Rows
            items={[
              ["Water source", structure.dwelling.waterSource],
              ["Toilet facility", structure.dwelling.toiletFacility],
              ["Waste disposal", structure.dwelling.wasteDisposal],
            ]}
          />
        </section>
        <section className={styles.detailCard}>
          <h3>
            <Zap size={15} /> Utilities and connectivity
          </h3>
          <Rows
            items={[
              ["Power source", structure.dwelling.powerSource],
              ["Internet access", structure.dwelling.internetAccess],
              ["GPS mapping", "Mapped"],
            ]}
          />
          <div className={styles.utilityIcons}>
            <span>
              <Zap size={15} /> Power
            </span>
            <span>
              <Wifi size={15} /> Connectivity
            </span>
            <span>
              <RadioTower size={15} /> GPS
            </span>
          </div>
        </section>
      </div>
      <section className={`${styles.card} ${styles.linkedHouseholds}`}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Occupancy</p>
            <h2>Households in this structure</h2>
          </div>
          <span className={`${styles.badge} ${linked.length > 1 ? styles.info : styles.active}`}>
            {linked.length > 1 ? "Multi-household dwelling" : "Single household dwelling"}
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 850 }}>
            <thead>
              <tr>
                <th>Household No.</th>
                <th>Household Head</th>
                <th>Members</th>
                <th>Income Bracket</th>
                <th>Food Security</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {linked.map((household) => {
                const head = residents.find((item) => item.id === household.headResidentId);
                return (
                  <tr key={household.id}>
                    <td className={styles.mono}>{household.householdNumber}</td>
                    <td>{head ? formatResidentName(head) : "—"}</td>
                    <td>{household.members.length}</td>
                    <td>{household.monthlyIncomeBracket}</td>
                    <td>{household.foodSecurity}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${household.status === "Active" ? styles.active : styles.warning}`}
                      >
                        {household.status}
                      </span>
                    </td>
                    <td>
                      <Link className={styles.secondaryButton} href={`/barangay-affairs/households/${household.id}`}>
                        View household
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
