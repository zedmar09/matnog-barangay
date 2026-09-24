"use client";

import { useState } from "react";

import dynamic from "next/dynamic";
import Link from "next/link";

import { ArrowLeft, Download, Home, MapPin, Pencil, RadioTower, UsersRound, Waves, Wifi, Zap } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";

import { useHouseholdRegistryStore } from "../stores/household-registry-store";
import { formatStructureAddress } from "../utils/household-utils";

const tabs = ["Overview", "Address & GPS", "Dwelling & Utilities", "Linked Households"] as const;
const StructureLocationMap = dynamic(
  () => import("../components/structure-location-map").then((module) => module.StructureLocationMap),
  {
    ssr: false,
    loading: () => <div className={styles.leafletMapLoading}>Loading interactive map…</div>,
  },
);

function Rows({ items }: { items: Array<[string, string | number | undefined]> }) {
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

function DetailCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className={styles.detailCardStyled}>
      <div className={styles.detailCardHeader}>
        <span className={styles.detailCardIcon}>{icon}</span>
        <h3>{title}</h3>
      </div>
      <div className={styles.detailCardBody}>{children}</div>
    </section>
  );
}

export function StructureDetailView({ id }: { id: string }) {
  const structure = useHouseholdRegistryStore((state) => state.structures.find((item) => item.id === id));
  const households = useHouseholdRegistryStore((state) => state.households);
  const residents = useResidentRegistryStore((state) => state.residents);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");

  if (!structure)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <MapPin size={34} />
          <h1>Structure not found</h1>
          <p className={styles.muted}>The requested structure record is unavailable.</p>
          <Link className={styles.primaryButton} href="/barangay-affairs/structures">
            Return to inventory
          </Link>
        </div>
      </div>
    );

  const linked = households.filter((household) => household.structureId === structure.id);
  const residentCount = linked.reduce(
    (total, household) => total + household.members.filter((member) => !member.leftAt).length,
    0,
  );
  const barangay = MATNOG_BARANGAYS.find((item) => item.code === structure.barangayId)?.name ?? "—";
  const occupancyLabel =
    linked.length === 0
      ? "No linked household"
      : linked.length === 1
        ? "Single-household dwelling"
        : "Multi-household dwelling";

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${styles.householdHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>{structure.structureCode}</h1>
            <p>
              {formatStructureAddress(structure)} · Brgy. {barangay}
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href={`/barangay-affairs/structures/${structure.id}/edit`}>
              <Pencil size={16} /> Edit Structure
            </Link>
            <button type="button" className={styles.btnSecondary}>
              <Download size={16} /> Export Report
            </button>
            <Link className={styles.btnSecondary} href="/barangay-affairs/structures">
              <ArrowLeft size={16} /> Inventory
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        <section className={styles.card}>
          <header className={styles.profileHeader}>
            <div className={styles.avatarLg}>
              <MapPin size={30} />
            </div>
            <div className={styles.profileIdentity}>
              <h1>{structure.structureCode}</h1>
              <p>
                {formatStructureAddress(structure)} · Brgy. {barangay}
              </p>
              <div className={styles.badgeRow}>
                <span className={`${styles.badge} ${styles.active}`}>GPS mapped</span>
                <span className={`${styles.badge} ${linked.length > 1 ? styles.info : styles.active}`}>
                  {occupancyLabel}
                </span>
                <span className={styles.badge}>
                  {linked.length} household{linked.length === 1 ? "" : "s"}
                </span>
                <span className={styles.badge}>
                  {residentCount} resident{residentCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </header>

          <nav className={styles.tabs} aria-label="Structure details">
            {tabs.map((value) => (
              <button
                type="button"
                key={value}
                className={`${styles.tab} ${tab === value ? styles.tabActive : ""}`}
                onClick={() => setTab(value)}
              >
                {value}
              </button>
            ))}
          </nav>

          <div className={styles.profileBody}>
            {tab === "Overview" ? (
              <div className={styles.profileGrid}>
                <DetailCard icon={<MapPin size={17} />} title="Address and Location">
                  <Rows
                    items={[
                      ["Structure code", structure.structureCode],
                      ["Normalized address", formatStructureAddress(structure)],
                      ["Barangay", barangay],
                      ["Purok", structure.purok],
                      ["Sitio", structure.sitio],
                      ["Zone", structure.zone],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<UsersRound size={17} />} title="Occupancy">
                  <Rows
                    items={[
                      ["Occupancy type", occupancyLabel],
                      ["Linked households", linked.length],
                      ["Active residents", residentCount],
                      ["Structure use", "Residential dwelling"],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<Home size={17} />} title="Dwelling Profile">
                  <Rows
                    items={[
                      ["Construction material", structure.dwelling.constructionMaterial],
                      ["Housing arrangement", structure.dwelling.tenure],
                      ["GPS status", "Mapped"],
                      ["Latitude", structure.latitude.toFixed(6)],
                      ["Longitude", structure.longitude.toFixed(6)],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<Zap size={17} />} title="Utilities and Services">
                  <Rows
                    items={[
                      ["Water source", structure.dwelling.waterSource],
                      ["Toilet facility", structure.dwelling.toiletFacility],
                      ["Power source", structure.dwelling.powerSource],
                      ["Waste disposal", structure.dwelling.wasteDisposal],
                      ["Internet access", structure.dwelling.internetAccess],
                    ]}
                  />
                </DetailCard>
              </div>
            ) : null}

            {tab === "Address & GPS" ? (
              <div className={styles.profileGrid}>
                <DetailCard icon={<MapPin size={17} />} title="Address Hierarchy">
                  <Rows
                    items={[
                      ["Barangay", barangay],
                      ["Purok", structure.purok],
                      ["Sitio", structure.sitio],
                      ["Zone", structure.zone],
                      ["Street / road", structure.street],
                      ["House number", structure.houseNumber],
                      ["Normalized address", formatStructureAddress(structure)],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<RadioTower size={17} />} title="Verified GPS Location">
                  <StructureLocationMap
                    latitude={structure.latitude}
                    longitude={structure.longitude}
                    structureCode={structure.structureCode}
                    address={formatStructureAddress(structure)}
                  />
                </DetailCard>
              </div>
            ) : null}

            {tab === "Dwelling & Utilities" ? (
              <div className={styles.profileGrid}>
                <DetailCard icon={<Home size={17} />} title="Dwelling Profile">
                  <Rows
                    items={[
                      ["Construction material", structure.dwelling.constructionMaterial],
                      ["Housing arrangement", structure.dwelling.tenure],
                      ["Households in structure", linked.length],
                      ["Total active residents", residentCount],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<Waves size={17} />} title="Water and Sanitation">
                  <Rows
                    items={[
                      ["Water source", structure.dwelling.waterSource],
                      ["Toilet facility", structure.dwelling.toiletFacility],
                      ["Waste disposal", structure.dwelling.wasteDisposal],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<Zap size={17} />} title="Power and Connectivity">
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
                </DetailCard>
              </div>
            ) : null}

            {tab === "Linked Households" ? (
              <DetailCard icon={<UsersRound size={17} />} title="Households in this Structure">
                {linked.length ? (
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
                              <td>{household.members.filter((member) => !member.leftAt).length}</td>
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
                                <Link
                                  className={styles.secondaryButton}
                                  href={`/barangay-affairs/households/${household.id}`}
                                >
                                  View household
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.empty}>
                    <div>
                      <Home size={28} />
                      <h3>No linked households</h3>
                      <p>Households assigned to this structure will appear here.</p>
                    </div>
                  </div>
                )}
              </DetailCard>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
