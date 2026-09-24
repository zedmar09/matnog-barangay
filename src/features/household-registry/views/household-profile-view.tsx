"use client";

import { useState } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Download,
  Home,
  MapPin,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { calculateAge, formatResidentName } from "@/features/resident-registry/utils/resident-utils";

import { useHouseholdRegistryStore } from "../stores/household-registry-store";
import { formatStructureAddress, householdRiskLabels, isHouseholdStale } from "../utils/household-utils";

const tabs = ["Overview", "Members", "Structure & Utilities", "Socio-economic", "Verification"] as const;

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

export function HouseholdProfileView({ id }: { id: string }) {
  const household = useHouseholdRegistryStore((state) => state.households.find((item) => item.id === id));
  const structures = useHouseholdRegistryStore((state) => state.structures);
  const verify = useHouseholdRegistryStore((state) => state.verifyHousehold);
  const residents = useResidentRegistryStore((state) => state.residents);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [message, setMessage] = useState("");
  if (!household)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <Home size={34} />
          <h1>Household not found</h1>
          <p className={styles.muted}>The requested household record is unavailable.</p>
          <Link className={styles.primaryButton} href="/barangay-affairs/households/masterlist">
            Return to masterlist
          </Link>
        </div>
      </div>
    );
  const structure = structures.find((item) => item.id === household.structureId);
  const head = residents.find((item) => item.id === household.headResidentId);
  const risks = householdRiskLabels(household);
  const sameStructure = useHouseholdRegistryStore
    .getState()
    .households.filter((item) => item.structureId === household.structureId);
  const barangay = MATNOG_BARANGAYS.find((item) => item.code === household.barangayId)?.name ?? "—";

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${styles.householdHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>{household.householdNumber}</h1>
            <p>
              {head ? `${formatResidentName(head)} · ${head.lrn}` : "Unknown head"} · Brgy. {barangay}
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href={`/barangay-affairs/households/${household.id}/edit`}>
              <Pencil size={16} /> Edit Household
            </Link>
            <button type="button" className={styles.btnSecondary}>
              <Download size={16} /> Export Report
            </button>
            <Link className={styles.btnSecondary} href="/barangay-affairs/households/masterlist">
              <ArrowLeft size={16} /> Masterlist
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        {message ? <div className={styles.toast}>{message}</div> : null}
        <section className={styles.card}>
          <header className={styles.profileHeader}>
            <div className={styles.avatarLg}>
              <Home size={30} />
            </div>
            <div className={styles.profileIdentity}>
              <h1>{household.householdNumber}</h1>
              <p>
                {head ? `${formatResidentName(head)} · ${head.lrn}` : "Unknown head"} · Brgy. {barangay}
              </p>
              <div className={styles.badgeRow}>
                <span className={`${styles.badge} ${household.status === "Active" ? styles.active : styles.danger}`}>
                  {household.status}
                </span>
                <span className={`${styles.badge} ${isHouseholdStale(household) ? styles.warning : styles.active}`}>
                  {isHouseholdStale(household) ? "Needs reverification" : "Verification current"}
                </span>
                <span className={styles.badge}>{household.members.length} members</span>
                <span className={styles.badge}>
                  {sameStructure.length} household{sameStructure.length === 1 ? "" : "s"} in structure
                </span>
              </div>
            </div>
          </header>
          <nav className={styles.tabs} aria-label="Household details">
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
                <DetailCard icon={<UsersRound size={17} />} title="Household">
                  <Rows
                    items={[
                      ["Household number", household.householdNumber],
                      ["Household head", head ? formatResidentName(head) : "—"],
                      ["Active members", household.members.filter((member) => !member.leftAt).length],
                      ["Primary livelihood", household.primaryLivelihood],
                      ["Monthly income bracket", household.monthlyIncomeBracket],
                      ["Food security", household.foodSecurity],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<MapPin size={17} />} title="Structure and Address">
                  <Rows
                    items={[
                      ["Structure code", structure?.structureCode],
                      ["Address", structure ? formatStructureAddress(structure) : "—"],
                      ["Barangay", barangay],
                      ["GPS", structure ? `${structure.latitude.toFixed(6)}, ${structure.longitude.toFixed(6)}` : "—"],
                      ["Households in structure", sameStructure.length],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<ShieldAlert size={17} />} title="Vulnerability Indicators">
                  {risks.length ? (
                    <div className={styles.vulnerabilityGrid}>
                      {risks.map((risk) => (
                        <span className={`${styles.badge} ${styles.warning}`} key={risk}>
                          {risk}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.muted}>No vulnerability indicators recorded.</p>
                  )}
                </DetailCard>
                <DetailCard icon={<CheckCircle2 size={17} />} title="Verification">
                  <Rows
                    items={[
                      ["Last verified", new Date(household.lastVerifiedAt).toLocaleString("en-PH")],
                      ["Verified by", household.verifiedBy],
                      ["Record condition", isHouseholdStale(household) ? "Needs reverification" : "Current"],
                      ["Last updated", new Date(household.updatedAt).toLocaleString("en-PH")],
                    ]}
                  />
                </DetailCard>
              </div>
            ) : null}
            {tab === "Members" ? (
              <DetailCard icon={<UsersRound size={17} />} title="Household Membership">
                <div className={styles.tableWrap}>
                  <table className={styles.table} style={{ minWidth: 900 }}>
                    <thead>
                      <tr>
                        <th>Resident</th>
                        <th>LRN</th>
                        <th>Relationship</th>
                        <th>Age</th>
                        <th>Joined</th>
                        <th>Temporary Absence</th>
                        <th>Resident Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {household.members.map((member) => {
                        const resident = residents.find((item) => item.id === member.residentId);
                        if (!resident) return null;
                        return (
                          <tr key={member.residentId}>
                            <td>
                              <strong>{formatResidentName(resident)}</strong>
                            </td>
                            <td className={styles.mono}>{resident.lrn}</td>
                            <td>{member.relationshipToHead}</td>
                            <td>{calculateAge(resident.birthDate)}</td>
                            <td>{member.joinedAt}</td>
                            <td>
                              {member.temporarilyAbsent ? (
                                <span className={`${styles.badge} ${styles.warning}`}>{member.absenceReason}</span>
                              ) : (
                                "Present"
                              )}
                            </td>
                            <td>
                              <span
                                className={`${styles.badge} ${resident.residentStatus === "Active" ? styles.active : styles.warning}`}
                              >
                                {resident.residentStatus}
                              </span>
                            </td>
                            <td>
                              <Link
                                className={styles.secondaryButton}
                                href={`/barangay-affairs/residents/${resident.id}`}
                              >
                                Resident profile
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </DetailCard>
            ) : null}
            {tab === "Structure & Utilities" && structure ? (
              <div className={styles.profileGrid}>
                <DetailCard icon={<MapPin size={17} />} title="Address and Location">
                  <Rows
                    items={[
                      ["Structure code", structure.structureCode],
                      ["House number", structure.houseNumber],
                      ["Street", structure.street],
                      ["Purok", structure.purok],
                      ["Sitio", structure.sitio],
                      ["Zone", structure.zone],
                      ["Latitude", structure.latitude],
                      ["Longitude", structure.longitude],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<Home size={17} />} title="Dwelling and Utilities">
                  <Rows
                    items={[
                      ["Construction material", structure.dwelling.constructionMaterial],
                      ["Tenure", structure.dwelling.tenure],
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
            {tab === "Socio-economic" ? (
              <div className={styles.profileGrid}>
                <DetailCard icon={<BriefcaseBusiness size={17} />} title="Household Socio-economic Profile">
                  <Rows
                    items={[
                      ["Monthly income bracket", household.monthlyIncomeBracket],
                      ["Primary livelihood", household.primaryLivelihood],
                      ["Food security", household.foodSecurity],
                      [
                        "Working-age members",
                        household.members.filter((member) => {
                          const resident = residents.find((item) => item.id === member.residentId);
                          const age = resident ? calculateAge(resident.birthDate) : 0;
                          return age >= 18 && age < 65;
                        }).length,
                      ],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<UsersRound size={17} />} title="Member Livelihoods">
                  <div className={styles.tableWrap}>
                    <table className={styles.table} style={{ minWidth: 600 }}>
                      <thead>
                        <tr>
                          <th>Resident</th>
                          <th>Employment</th>
                          <th>Occupation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {household.members.map((member) => {
                          const resident = residents.find((item) => item.id === member.residentId);
                          return resident ? (
                            <tr key={member.residentId}>
                              <td>{formatResidentName(resident)}</td>
                              <td>{resident.employmentStatus}</td>
                              <td>{resident.occupation || "—"}</td>
                            </tr>
                          ) : null;
                        })}
                      </tbody>
                    </table>
                  </div>
                </DetailCard>
              </div>
            ) : null}
            {tab === "Verification" ? (
              <DetailCard icon={<ShieldCheck size={17} />} title="Verification Record">
                <Rows
                  items={[
                    ["Last verified", new Date(household.lastVerifiedAt).toLocaleString("en-PH")],
                    ["Verified by", household.verifiedBy],
                    ["Status", isHouseholdStale(household) ? "Stale — follow-up required" : "Current"],
                    ["Last record update", new Date(household.updatedAt).toLocaleString("en-PH")],
                  ]}
                />
                <div className={styles.mediaAction}>
                  <button
                    className={styles.primaryButton}
                    type="button"
                    onClick={() => {
                      if (verify(household.id)) setMessage("Household verification date updated successfully.");
                    }}
                  >
                    <CheckCircle2 size={15} /> Complete reverification
                  </button>
                </div>
              </DetailCard>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
