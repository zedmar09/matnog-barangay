"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowLeft, CheckCircle2, FileCheck2, Plus, ShieldAlert, UsersRound } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { calculateAge, formatResidentName } from "@/features/resident-registry/utils/resident-utils";

import { useSectorRegistryStore } from "../stores/sector-registry-store";

export function ResidentSectorProfileView({ id }: { id: string }) {
  const resident = useResidentRegistryStore((state) => state.residents.find((item) => item.id === id));
  const allMemberships = useSectorRegistryStore((state) => state.memberships);
  const allCredentials = useSectorRegistryStore((state) => state.credentials);
  const allBenefits = useSectorRegistryStore((state) => state.benefits);
  const memberships = allMemberships.filter((item) => item.residentId === id);
  const credentials = allCredentials.filter((item) => item.residentId === id);
  const benefits = allBenefits.filter((item) => item.residentId === id);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const update = useSectorRegistryStore((state) => state.updateMembershipStatus);
  const [message, setMessage] = useState("");
  if (!resident)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <UsersRound size={34} />
          <h1>Resident not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/sectors/masterlist">
            Return to masterlist
          </Link>
        </div>
      </div>
    );
  return (
    <div className={styles.page}>
      {message ? <div className={styles.toast}>{message}</div> : null}
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A3 Resident Sector Profile</p>
          <h1>{formatResidentName(resident)}</h1>
          <p>
            {resident.lrn} · {calculateAge(resident.birthDate)} years old · Brgy.{" "}
            {MATNOG_BARANGAYS.find((item) => item.code === resident.address.barangayId)?.name}
          </p>
        </div>
        <div className={styles.headerButtonGroup}>
          <Link className={styles.secondaryButton} href="/barangay-affairs/sectors/masterlist">
            <ArrowLeft size={15} /> Masterlist
          </Link>
          <Link className={styles.primaryButton} href={`/barangay-affairs/sectors/assign?resident=${resident.id}`}>
            <Plus size={15} /> Add sector
          </Link>
        </div>
      </header>
      <section className={styles.card}>
        <div className={styles.sectorProfileHeader}>
          <span>
            <UsersRound size={24} />
          </span>
          <div>
            <h2>
              {memberships.length} sector classification{memberships.length === 1 ? "" : "s"}
            </h2>
            <p>A single A1 resident identity is reused across every applicable sector.</p>
          </div>
          <Link className={styles.secondaryButton} href={`/barangay-affairs/residents/${resident.id}`}>
            Open resident profile
          </Link>
        </div>
      </section>
      <div className={styles.membershipGrid}>
        {memberships.map((membership) => {
          const definition = definitions.find((item) => item.code === membership.sectorCode);
          return (
            <article className={styles.detailCard} key={membership.id}>
              <div className={styles.membershipHeader}>
                <span className={styles.membershipIcon} style={{ background: definition?.color }}>
                  <UsersRound size={17} />
                </span>
                <div>
                  <h3>{definition?.name}</h3>
                  <p className={styles.mono}>{membership.referenceNumber}</p>
                </div>
                <span
                  className={`${styles.badge} ${membership.status === "Active" ? styles.active : membership.status === "Expired" ? styles.danger : styles.warning}`}
                >
                  {membership.status}
                </span>
              </div>
              <dl className={styles.dataList}>
                <div className={styles.dataRow}>
                  <dt>Validity</dt>
                  <dd>
                    {membership.validityStart} – {membership.validityEnd || "Age-based"}
                  </dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Issuing office</dt>
                  <dd>{membership.issuingOffice}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Barangay certified</dt>
                  <dd>{membership.certifiedByBarangay ? "Yes" : "Pending"}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Documents</dt>
                  <dd>{membership.supportingDocuments.join(", ")}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Remarks</dt>
                  <dd>{membership.remarks}</dd>
                </div>
              </dl>
              {membership.status === "Pending Review" ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    if (update(membership.id, "Active", "Barangay certification and supporting documents verified."))
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
                  <ShieldAlert size={14} /> Classification verified
                </span>
              )}
            </article>
          );
        })}
      </div>
      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Issued credentials</p>
            <h2>Sector IDs & booklets</h2>
          </div>
          <Link className={styles.secondaryButton} href="/barangay-affairs/sectors/id-booklets">
            Open issuance registry
          </Link>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 760 }}>
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
                        <span
                          className={`${styles.badge} ${credential.status === "Released" ? styles.active : credential.status === "Expired" || credential.status === "Revoked" ? styles.danger : styles.warning}`}
                        >
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
                    No credential has been issued.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Connected service history</p>
            <h2>Benefit availment</h2>
          </div>
          <span className={`${styles.badge} ${styles.info}`}>{benefits.length} records</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 700 }}>
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
                    No benefit availment recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
