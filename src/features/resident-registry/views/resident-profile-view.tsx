"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  ArrowLeft,
  BriefcaseBusiness,
  Camera,
  Contact,
  CreditCard,
  FileClock,
  MapPin,
  MoveRight,
  Pencil,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";

import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
import { calculateAge, formatResidentAddress, formatResidentName, isSenior } from "../utils/resident-utils";

const tabs = [
  "Overview",
  "Personal Information",
  "Address",
  "Contact & Occupation",
  "Residency History",
  "Life Events",
  "Identity Media",
  "Resident IDs",
] as const;
function statusClass(status: string) {
  return status === "Active"
    ? styles.active
    : status === "Deceased" || status === "Merged"
      ? styles.danger
      : status === "Transferred Out"
        ? styles.warning
        : "";
}
function Rows({ items }: { items: Array<[string, string | number | boolean | undefined]> }) {
  return (
    <dl className={styles.dataList}>
      {items.map(([label, value]) => (
        <div className={styles.dataRow} key={label}>
          <dt>{label}</dt>
          <dd>{value === true ? "Yes" : value === false ? "No" : value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ResidentProfileView({ id }: { id: string }) {
  const resident = useResidentRegistryStore((s) => s.residents.find((r) => r.id === id));
  const allResidencyHistory = useResidentRegistryStore((s) => s.residencyHistory);
  const residencyHistory = allResidencyHistory.filter((entry) => entry.residentId === id);
  const allLifeEvents = useResidentRegistryStore((s) => s.lifeEvents);
  const lifeEvents = allLifeEvents.filter((event) => event.residentId === id || event.generatedResidentId === id);
  const identityMedia = useResidentRegistryStore((s) => s.identityMedia.find((item) => item.residentId === id));
  const allMediaReviews = useResidentRegistryStore((s) => s.mediaReviews);
  const mediaReviews = allMediaReviews.filter((review) => review.residentId === id);
  const allResidentIds = useResidentRegistryStore((s) => s.residentIds);
  const residentIds = allResidentIds.filter((card) => card.residentId === id);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const params = useSearchParams();
  if (!resident)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <UserRound size={34} />
          <h1>Resident not found</h1>
          <p className={styles.muted}>This session record does not exist or the page was reloaded.</p>
          <Link className={styles.primaryButton} href="/barangay-affairs/residents/masterlist">
            Return to masterlist
          </Link>
        </div>
      </div>
    );
  const barangay = MATNOG_BARANGAYS.find((b) => b.code === resident.address.barangayId)?.name ?? "—";
  const age = calculateAge(resident.birthDate);
  return (
    <div className={styles.page}>
      {params.get("saved") && (
        <div className={styles.toast}>
          Resident record saved successfully. Changes remain available for this browser session.
        </div>
      )}
      <div className={styles.pageHeader}>
        <Link className={styles.secondaryButton} href="/barangay-affairs/residents/masterlist">
          <ArrowLeft size={15} /> Masterlist
        </Link>
        <Link className={styles.primaryButton} href={`/barangay-affairs/residents/${resident.id}/edit`}>
          <Pencil size={14} /> Edit resident
        </Link>
      </div>
      <section className={styles.card}>
        <header className={styles.profileHeader}>
          <div className={styles.avatarLg}>
            {resident.photoUrl ? (
              <Image src={resident.photoUrl} alt="" width={76} height={76} unoptimized />
            ) : (
              `${resident.firstName[0]}${resident.lastName[0]}`
            )}
          </div>
          <div className={styles.profileIdentity}>
            <h1>{formatResidentName(resident)}</h1>
            <p>
              {resident.lrn} · Brgy. {barangay} · {age} years old
            </p>
            <div className={styles.badgeRow}>
              <span className={`${styles.badge} ${statusClass(resident.residentStatus)}`}>
                {resident.residentStatus}
              </span>
              {isSenior(resident.birthDate) && <span className={`${styles.badge} ${styles.info}`}>Senior</span>}
              {resident.isPwd && <span className={`${styles.badge} ${styles.warning}`}>PWD</span>}
              <span className={styles.badge}>PhilSys: {resident.philsysStatus}</span>
            </div>
          </div>
        </header>
        <nav className={styles.tabs} aria-label="Resident details">
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
          {tab === "Overview" && (
            <div className={styles.profileGrid}>
              <section className={styles.detailCard}>
                <h3>
                  <ShieldCheck size={15} /> Identity
                </h3>
                <Rows
                  items={[
                    ["Local Resident Number", resident.lrn],
                    ["Full name", formatResidentName(resident)],
                    ["Nickname", resident.nickname],
                    ["Previous / married last name", resident.previousLastName],
                    ["Mother’s maiden name", resident.mothersMaidenName],
                    ["Gender", resident.gender],
                    ["Birth date", resident.birthDate],
                    ["Age", age],
                    ["Senior", isSenior(resident.birthDate)],
                    ["PWD", resident.isPwd],
                  ]}
                />
              </section>
              <section className={styles.detailCard}>
                <h3>
                  <UserRound size={15} /> Civil
                </h3>
                <Rows
                  items={[
                    ["Civil status", resident.civilStatus],
                    ["Primary citizenship", resident.primaryCitizenship],
                    ["Secondary citizenship", resident.secondaryCitizenship],
                    ["PhilSys status", resident.philsysStatus],
                  ]}
                />
              </section>
              <section className={styles.detailCard}>
                <h3>
                  <MapPin size={15} /> Location
                </h3>
                <Rows
                  items={[
                    ["Barangay", barangay],
                    ["Purok", resident.address.purok],
                    ["Sitio", resident.address.sitio],
                    ["Complete address", formatResidentAddress(resident.address)],
                  ]}
                />
              </section>
              <section className={styles.detailCard}>
                <h3>
                  <Contact size={15} /> Contact & occupation
                </h3>
                <Rows
                  items={[
                    ["Primary mobile", resident.contact.primaryMobile],
                    ["Email", resident.contact.email],
                    ["Employment status", resident.employmentStatus],
                    ["Occupation", resident.occupation],
                    ["Employer", resident.employerName],
                  ]}
                />
              </section>
            </div>
          )}
          {tab === "Personal Information" && (
            <div className={styles.profileGrid}>
              <section className={styles.detailCard}>
                <h3>Personal information</h3>
                <Rows
                  items={[
                    ["First name", resident.firstName],
                    ["Middle name", resident.middleName],
                    ["Last name", resident.lastName],
                    ["Suffix", resident.suffix],
                    ["Nickname", resident.nickname],
                    ["Gender", resident.gender],
                    ["Civil status", resident.civilStatus],
                    ["Resident status", resident.residentStatus],
                  ]}
                />
              </section>
              <section className={styles.detailCard}>
                <h3>Birth and citizenship</h3>
                <Rows
                  items={[
                    ["Birth date", resident.birthDate],
                    ["Age", age],
                    ["Birth locality", resident.birthLocality],
                    ["Birth barangay", resident.birthBarangay],
                    ["Birth municipality / city", resident.birthMunicipality],
                    ["Birth province", resident.birthProvince],
                    ["Birth region", resident.birthRegion],
                    ["Birth country", resident.birthCountry],
                    ["Primary citizenship", resident.primaryCitizenship],
                    ["Secondary citizenship", resident.secondaryCitizenship],
                  ]}
                />
              </section>
            </div>
          )}
          {tab === "Address" && (
            <section className={styles.detailCard}>
              <h3>
                <MapPin size={15} /> Current address
              </h3>
              <Rows
                items={[
                  ["Complete address", formatResidentAddress(resident.address)],
                  ["Region", resident.address.region],
                  ["Province", resident.address.province],
                  ["Municipality / city", resident.address.municipality],
                  ["Barangay", barangay],
                  ["District", resident.address.district],
                  ["Purok", resident.address.purok],
                  ["Sitio", resident.address.sitio],
                  ["Zone", resident.address.zone],
                  ["Subdivision / village", resident.address.subdivision],
                  ["Street", resident.address.street],
                  ["Building", resident.address.buildingName],
                  ["House / unit", resident.address.houseUnit],
                  ["Lot", resident.address.lotNumber],
                  ["Block", resident.address.blockNumber],
                  ["Phase", resident.address.phase],
                  ["Postal code", resident.address.postalCode],
                  ["Landmark / notes", resident.address.landmark],
                ]}
              />
            </section>
          )}
          {tab === "Contact & Occupation" && (
            <div className={styles.profileGrid}>
              <section className={styles.detailCard}>
                <h3>
                  <Contact size={15} /> Contact
                </h3>
                <Rows
                  items={[
                    ["Primary mobile", resident.contact.primaryMobile],
                    ["Secondary mobile", resident.contact.secondaryMobile],
                    ["Landline", resident.contact.landline],
                    ["Email", resident.contact.email],
                  ]}
                />
              </section>
              <section className={styles.detailCard}>
                <h3>
                  <BriefcaseBusiness size={15} /> Occupation
                </h3>
                <Rows
                  items={[
                    ["Employment status", resident.employmentStatus],
                    ["Occupation", resident.occupation],
                    ["Employer / business", resident.employerName],
                    ["Workplace / business address", resident.workplaceAddress],
                  ]}
                />
              </section>
            </div>
          )}
          {tab === "Residency History" && (
            <section className={styles.detailCard}>
              <h3>
                <MoveRight size={15} /> Residency periods
              </h3>
              <div className={styles.tableWrap}>
                <table className={styles.table} style={{ minWidth: 850 }}>
                  <thead>
                    <tr>
                      <th>Barangay</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Transfer No.</th>
                      <th>Status</th>
                      <th>Processed By</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residencyHistory
                      .sort((a, b) => b.startDate.localeCompare(a.startDate))
                      .map((entry) => (
                        <tr key={entry.id}>
                          <td>{MATNOG_BARANGAYS.find((item) => item.code === entry.barangayId)?.name ?? "—"}</td>
                          <td>{entry.startDate}</td>
                          <td>{entry.endDate || "Present"}</td>
                          <td className={styles.mono}>{entry.transferId || "Initial registration"}</td>
                          <td>
                            <span className={`${styles.badge} ${entry.status === "Current" ? styles.active : ""}`}>
                              {entry.status}
                            </span>
                          </td>
                          <td>{entry.processedBy}</td>
                          <td>{entry.remarks}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {tab === "Life Events" && (
            <section className={styles.detailCard}>
              <h3>
                <FileClock size={15} /> Life-event timeline
              </h3>
              {lifeEvents.length ? (
                <div className={styles.tableWrap}>
                  <table className={styles.table} style={{ minWidth: 850 }}>
                    <thead>
                      <tr>
                        <th>Event No.</th>
                        <th>Event Type</th>
                        <th>Effective Date</th>
                        <th>Barangay</th>
                        <th>Status</th>
                        <th>Decision</th>
                        <th>Recorded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lifeEvents
                        .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))
                        .map((event) => (
                          <tr key={event.id}>
                            <td>
                              <Link
                                href={`/barangay-affairs/residents/life-events/${event.id}`}
                                className={styles.mono}
                              >
                                {event.referenceNumber}
                              </Link>
                            </td>
                            <td>{event.eventType}</td>
                            <td>{event.effectiveDate}</td>
                            <td>{MATNOG_BARANGAYS.find((item) => item.code === event.barangayId)?.name ?? "—"}</td>
                            <td>
                              <span
                                className={`${styles.badge} ${event.status === "Approved" ? styles.active : event.status === "Rejected" ? styles.danger : event.status === "Clarification Requested" ? styles.warning : ""}`}
                              >
                                {event.status}
                              </span>
                            </td>
                            <td>{event.decisionReason || "Awaiting review"}</td>
                            <td>{event.requestedBy}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.empty}>
                  <div>
                    <FileClock size={28} />
                    <h3>No life events recorded</h3>
                    <p>Approved and pending civil events will appear here.</p>
                  </div>
                </div>
              )}
            </section>
          )}
          {tab === "Identity Media" && (
            <div className={styles.profileGrid}>
              <section className={styles.detailCard}>
                <h3>
                  <Camera size={15} /> Current identity media
                </h3>
                <div className={styles.mediaGrid}>
                  <div>
                    <p className={styles.eyebrow}>Resident photo</p>
                    <div className={styles.mediaPreview}>
                      {identityMedia?.photoUrl ? (
                        <Image
                          src={identityMedia.photoUrl}
                          alt="Resident identity"
                          width={220}
                          height={268}
                          unoptimized
                        />
                      ) : (
                        <span>Missing photo</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className={styles.eyebrow}>Signature</p>
                    <div className={styles.mediaPreview}>
                      {identityMedia?.signatureUrl ? (
                        <Image
                          src={identityMedia.signatureUrl}
                          alt="Resident signature"
                          width={300}
                          height={100}
                          unoptimized
                        />
                      ) : (
                        <span>Missing signature</span>
                      )}
                    </div>
                  </div>
                </div>
                <Rows
                  items={[
                    ["Verification status", identityMedia?.status],
                    ["Captured by", identityMedia?.capturedBy],
                    [
                      "Photo captured",
                      identityMedia?.photoCapturedAt
                        ? new Date(identityMedia.photoCapturedAt).toLocaleDateString("en-PH")
                        : "",
                    ],
                    [
                      "Signature captured",
                      identityMedia?.signatureCapturedAt
                        ? new Date(identityMedia.signatureCapturedAt).toLocaleDateString("en-PH")
                        : "",
                    ],
                    ["Verified by", identityMedia?.verifiedBy],
                    [
                      "Verified at",
                      identityMedia?.verifiedAt ? new Date(identityMedia.verifiedAt).toLocaleString("en-PH") : "",
                    ],
                  ]}
                />
                <Link className={styles.primaryButton} href={`/barangay-affairs/residents/media/capture`}>
                  Capture replacement
                </Link>
              </section>
              <section className={styles.detailCard}>
                <h3>Replacement and review history</h3>
                {mediaReviews.length ? (
                  <div className={styles.tableWrap}>
                    <table className={styles.table} style={{ minWidth: 700 }}>
                      <thead>
                        <tr>
                          <th>Review No.</th>
                          <th>Reason</th>
                          <th>Status</th>
                          <th>Submitted</th>
                          <th>Reviewer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mediaReviews
                          .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
                          .map((review) => (
                            <tr key={review.id}>
                              <td>
                                <Link href={`/barangay-affairs/residents/media/${review.id}`} className={styles.mono}>
                                  {review.referenceNumber}
                                </Link>
                              </td>
                              <td>{review.replacementReason}</td>
                              <td>
                                <span
                                  className={`${styles.badge} ${review.status === "Approved" ? styles.active : review.status === "Recapture Required" ? styles.warning : review.status === "Rejected" ? styles.danger : ""}`}
                                >
                                  {review.status}
                                </span>
                              </td>
                              <td>{new Date(review.requestedAt).toLocaleDateString("en-PH")}</td>
                              <td>{review.reviewedBy || "Awaiting review"}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.empty}>
                    <div>
                      <Camera size={28} />
                      <h3>No replacement history</h3>
                      <p>New capture submissions will appear here.</p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
          {tab === "Resident IDs" && (
            <section className={styles.detailCard}>
              <div className={styles.sectionHeading}>
                <div>
                  <h3>
                    <CreditCard size={15} /> Resident ID history
                  </h3>
                  <p className={styles.muted}>Issued, released, revoked, lost, and replaced cards for this resident.</p>
                </div>
                <Link
                  className={styles.primaryButton}
                  href={`/barangay-affairs/residents/ids/generate?resident=${resident.id}`}
                >
                  Generate ID
                </Link>
              </div>
              {residentIds.length ? (
                <div className={styles.tableWrap}>
                  <table className={styles.table} style={{ minWidth: 900 }}>
                    <thead>
                      <tr>
                        <th>Card No.</th>
                        <th>Issue Date</th>
                        <th>Expiration</th>
                        <th>Status</th>
                        <th>Printed</th>
                        <th>Released To</th>
                        <th>Reason</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {residentIds
                        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                        .map((card) => (
                          <tr key={card.id}>
                            <td className={styles.mono}>{card.cardNumber}</td>
                            <td>{card.issueDate}</td>
                            <td>{card.expirationDate}</td>
                            <td>
                              <span
                                className={`${styles.badge} ${card.status === "Released" ? styles.active : ["Expired", "Revoked", "Lost"].includes(card.status) ? styles.danger : ["Pending Generation", "Generated", "Printed"].includes(card.status) ? styles.warning : ""}`}
                              >
                                {card.status}
                              </span>
                            </td>
                            <td>{card.printedAt ? new Date(card.printedAt).toLocaleDateString("en-PH") : "—"}</td>
                            <td>{card.releasedTo || "—"}</td>
                            <td>{card.actionReason || "—"}</td>
                            <td>
                              <Link
                                className={styles.secondaryButton}
                                href={`/barangay-affairs/residents/ids/${card.id}`}
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.empty}>
                  <div>
                    <CreditCard size={28} />
                    <h3>No resident ID records</h3>
                    <p>Generate the first card after verified identity media is available.</p>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
