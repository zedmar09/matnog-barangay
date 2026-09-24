"use client";

import { useState } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ContactRound,
  FileBadge2,
  FileCheck2,
  Plus,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { calculateAge, formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import dashboardStyles from "@/features/resident-registry/views/resident-dashboard.module.css";

import { useSectorRegistryStore } from "../stores/sector-registry-store";

const tabs = ["Overview", "Sector Classifications", "IDs & Booklets", "Benefits History", "Verification"] as const;

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

function statusClass(status: string) {
  if (status === "Active" || status === "Released") return styles.active;
  if (status === "Expired" || status === "Revoked" || status === "Replaced") return styles.danger;
  return styles.warning;
}

export function ResidentSectorProfileView({ id }: { id: string }) {
  const resident = useResidentRegistryStore((state) => state.residents.find((item) => item.id === id));
  const allMemberships = useSectorRegistryStore((state) => state.memberships);
  const allCredentials = useSectorRegistryStore((state) => state.credentials);
  const allBenefits = useSectorRegistryStore((state) => state.benefits);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const update = useSectorRegistryStore((state) => state.updateMembershipStatus);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [message, setMessage] = useState("");

  if (!resident)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <UsersRound size={34} />
          <h1>Resident not found</h1>
          <p className={styles.muted}>The requested sector profile is unavailable.</p>
          <Link className={styles.primaryButton} href="/barangay-affairs/sectors/masterlist">
            Return to masterlist
          </Link>
        </div>
      </div>
    );

  const memberships = allMemberships.filter((item) => item.residentId === id);
  const credentials = allCredentials.filter((item) => item.residentId === id);
  const benefits = allBenefits.filter((item) => item.residentId === id);
  const activeMemberships = memberships.filter((item) => item.status === "Active");
  const pendingMemberships = memberships.filter((item) => item.status === "Pending Review");
  const certifiedMemberships = memberships.filter((item) => item.certifiedByBarangay);
  const barangay = MATNOG_BARANGAYS.find((item) => item.code === resident.address.barangayId)?.name ?? "—";
  const latestUpdate = memberships.map((item) => item.updatedAt).sort((a, b) => b.localeCompare(a))[0];

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${dashboardStyles.sectorHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>{formatResidentName(resident)}</h1>
            <p>
              {resident.lrn} · {calculateAge(resident.birthDate)} years old · Brgy. {barangay}
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href={`/barangay-affairs/sectors/assign?resident=${resident.id}`}>
              <Plus size={16} /> Add Sector
            </Link>
            <Link className={styles.btnSecondary} href={`/barangay-affairs/residents/${resident.id}`}>
              <ContactRound size={16} /> Resident Profile
            </Link>
            <Link className={styles.btnSecondary} href="/barangay-affairs/sectors/masterlist">
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
              <UsersRound size={30} />
            </div>
            <div className={styles.profileIdentity}>
              <h1>{formatResidentName(resident)}</h1>
              <p>
                {resident.lrn} · Brgy. {barangay}
              </p>
              <div className={styles.badgeRow}>
                <span
                  className={`${styles.badge} ${resident.residentStatus === "Active" ? styles.active : styles.warning}`}
                >
                  {resident.residentStatus} resident
                </span>
                <span className={`${styles.badge} ${activeMemberships.length ? styles.active : styles.warning}`}>
                  {activeMemberships.length} active classification{activeMemberships.length === 1 ? "" : "s"}
                </span>
                {pendingMemberships.length ? (
                  <span className={`${styles.badge} ${styles.warning}`}>
                    {pendingMemberships.length} pending review
                  </span>
                ) : null}
                <span className={styles.badge}>
                  {credentials.length} issued record{credentials.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </header>

          <nav className={styles.tabs} aria-label="Resident sector profile details">
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
                <DetailCard icon={<ContactRound size={17} />} title="Resident Information">
                  <Rows
                    items={[
                      ["Local Resident Number", resident.lrn],
                      ["Full name", formatResidentName(resident)],
                      ["Age", `${calculateAge(resident.birthDate)} years old`],
                      ["Sex", resident.gender],
                      ["Civil status", resident.civilStatus],
                      ["Barangay", barangay],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<BadgeCheck size={17} />} title="Classification Summary">
                  <Rows
                    items={[
                      ["Total classifications", memberships.length],
                      ["Active", activeMemberships.length],
                      ["Pending review", pendingMemberships.length],
                      ["Barangay certified", certifiedMemberships.length],
                      ["Credentials", credentials.length],
                      ["Benefits recorded", benefits.length],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<UsersRound size={17} />} title="Current Sector Memberships">
                  {memberships.length ? (
                    <div className={styles.badgeRow}>
                      {memberships.map((membership) => {
                        const definition = definitions.find((item) => item.code === membership.sectorCode);
                        return (
                          <span className={`${styles.badge} ${statusClass(membership.status)}`} key={membership.id}>
                            {definition?.shortName} · {membership.status}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className={styles.muted}>No sector classification has been recorded.</p>
                  )}
                </DetailCard>
                <DetailCard icon={<ShieldCheck size={17} />} title="Registry Condition">
                  <Rows
                    items={[
                      ["Resident status", resident.residentStatus],
                      ["Barangay certified records", `${certifiedMemberships.length} of ${memberships.length}`],
                      ["Records needing review", pendingMemberships.length],
                      ["Latest sector update", latestUpdate ? new Date(latestUpdate).toLocaleString("en-PH") : "—"],
                    ]}
                  />
                </DetailCard>
              </div>
            ) : null}

            {tab === "Sector Classifications" ? (
              memberships.length ? (
                <div className={styles.profileGrid}>
                  {memberships.map((membership) => {
                    const definition = definitions.find((item) => item.code === membership.sectorCode);
                    return (
                      <DetailCard
                        key={membership.id}
                        icon={<UsersRound size={17} />}
                        title={definition?.name ?? "Sector Classification"}
                      >
                        <div className={styles.badgeRow}>
                          <span className={`${styles.badge} ${statusClass(membership.status)}`}>
                            {membership.status}
                          </span>
                          <span
                            className={`${styles.badge} ${membership.certifiedByBarangay ? styles.active : styles.warning}`}
                          >
                            {membership.certifiedByBarangay ? "Barangay certified" : "Certification pending"}
                          </span>
                        </div>
                        <Rows
                          items={[
                            ["Reference number", membership.referenceNumber],
                            ["Validity start", membership.validityStart],
                            ["Validity end", membership.validityEnd || "Age-based"],
                            ["Issuing office", membership.issuingOffice],
                            ["Supporting documents", membership.supportingDocuments.join(", ")],
                            ["Remarks", membership.remarks],
                          ]}
                        />
                        <div className={styles.mediaAction}>
                          {membership.status === "Pending Review" ? (
                            <button
                              type="button"
                              className={styles.primaryButton}
                              onClick={() => {
                                if (
                                  update(
                                    membership.id,
                                    "Active",
                                    "Barangay certification and supporting documents verified.",
                                  )
                                )
                                  setMessage(`${definition?.name} membership activated.`);
                              }}
                            >
                              <CheckCircle2 size={14} /> Approve membership
                            </button>
                          ) : membership.status === "Expired" ? (
                            <button
                              type="button"
                              className={styles.secondaryButton}
                              onClick={() => {
                                if (update(membership.id, "Pending Review", "Renewal documents requested."))
                                  setMessage(`${definition?.name} renewal moved to review.`);
                              }}
                            >
                              <FileCheck2 size={14} /> Start renewal
                            </button>
                          ) : (
                            <span className={styles.membershipVerified}>
                              <ShieldCheck size={14} /> Classification verified
                            </span>
                          )}
                        </div>
                      </DetailCard>
                    );
                  })}
                </div>
              ) : (
                <DetailCard icon={<UsersRound size={17} />} title="Sector Classifications">
                  <p className={styles.muted}>No sector classification has been recorded for this resident.</p>
                </DetailCard>
              )
            ) : null}

            {tab === "IDs & Booklets" ? (
              <DetailCard icon={<FileBadge2 size={17} />} title="Issued Sector IDs and Booklets">
                <div className={styles.tableWrap}>
                  <table className={styles.table} style={{ minWidth: 820 }}>
                    <thead>
                      <tr>
                        <th>Credential</th>
                        <th>Sector</th>
                        <th>Type</th>
                        <th>Issued</th>
                        <th>Expires</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {credentials.length ? (
                        credentials.map((credential) => {
                          const definition = definitions.find((item) => item.code === credential.sectorCode);
                          return (
                            <tr key={credential.id}>
                              <td className={styles.mono}>{credential.credentialNumber}</td>
                              <td>{definition?.shortName}</td>
                              <td>{credential.credentialType}</td>
                              <td>{credential.issuedAt}</td>
                              <td>{credential.expiresAt}</td>
                              <td>
                                <span className={`${styles.badge} ${statusClass(credential.status)}`}>
                                  {credential.status}
                                </span>
                              </td>
                              <td>
                                <Link
                                  className={styles.secondaryButton}
                                  href={`/barangay-affairs/sectors/id-booklets/${credential.id}`}
                                >
                                  Open
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className={styles.muted}>
                            No sector ID or booklet has been issued.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DetailCard>
            ) : null}

            {tab === "Benefits History" ? (
              <DetailCard icon={<CircleDollarSign size={17} />} title="Connected Benefit Availment">
                <div className={styles.tableWrap}>
                  <table className={styles.table} style={{ minWidth: 760 }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Benefit</th>
                        <th>Sector</th>
                        <th>Provider</th>
                        <th>Amount</th>
                        <th>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {benefits.length ? (
                        benefits.map((benefit) => {
                          const definition = definitions.find((item) => item.code === benefit.sectorCode);
                          return (
                            <tr key={benefit.id}>
                              <td>{benefit.availedAt}</td>
                              <td>
                                <strong>{benefit.benefitName}</strong>
                              </td>
                              <td>{definition?.shortName}</td>
                              <td>{benefit.provider}</td>
                              <td>{benefit.amount ? `₱${benefit.amount.toLocaleString("en-PH")}` : "In kind"}</td>
                              <td className={styles.mono}>{benefit.referenceNumber}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className={styles.muted}>
                            No benefit availment has been recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DetailCard>
            ) : null}

            {tab === "Verification" ? (
              <div className={styles.profileGrid}>
                <DetailCard icon={<ShieldCheck size={17} />} title="Verification Summary">
                  <Rows
                    items={[
                      ["Classifications", memberships.length],
                      ["Barangay certified", certifiedMemberships.length],
                      ["Pending review", pendingMemberships.length],
                      ["Latest update", latestUpdate ? new Date(latestUpdate).toLocaleString("en-PH") : "—"],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<CalendarDays size={17} />} title="Certification Records">
                  {memberships.length ? (
                    <Rows
                      items={memberships.map((membership) => {
                        const definition = definitions.find((item) => item.code === membership.sectorCode);
                        return [
                          definition?.shortName ?? membership.sectorCode,
                          membership.certifiedByBarangay
                            ? `Certified ${membership.certifiedAt ? new Date(membership.certifiedAt).toLocaleDateString("en-PH") : ""}`
                            : "Awaiting barangay certification",
                        ];
                      })}
                    />
                  ) : (
                    <p className={styles.muted}>No certification record is available.</p>
                  )}
                </DetailCard>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
