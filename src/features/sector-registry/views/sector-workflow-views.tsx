"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BellRing,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useSectorRegistryStore } from "../stores/sector-registry-store";
import type { CertificationStatus, CredentialStatus } from "../types/sector";

const statusStyle = (status: string) =>
  status === "Approved" || status === "Released" || status === "Resolved"
    ? styles.active
    : status === "Rejected" || status === "Expired" || status === "Revoked"
      ? styles.danger
      : status === "Municipal Review" || status === "Ready for Release"
        ? styles.info
        : styles.warning;

function SummaryCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className={styles.summaryCard}>
      <span className={styles.summaryIcon}>{icon}</span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function CertificationRequestsView() {
  const requests = useSectorRegistryStore((state) => state.certificationRequests);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const rows = useMemo(
    () =>
      requests.filter((request) => {
        const resident = residents.find((item) => item.id === request.residentId);
        return (
          resident &&
          (selectedBarangay === "all" || request.barangayId === selectedBarangay) &&
          (!status || request.status === status) &&
          (!search.trim() ||
            `${request.requestNumber} ${formatResidentName(resident)} ${resident.lrn}`
              .toLowerCase()
              .includes(search.toLowerCase()))
        );
      }),
    [requests, residents, search, selectedBarangay, status],
  );
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A3 Certification Workflow</p>
          <h1>Certification Requests</h1>
          <p>Barangay certification and municipal approval for sector membership issuance.</p>
        </div>
      </header>
      <div className={styles.summaryGrid}>
        <SummaryCard icon={<FileCheck2 size={18} />} value={rows.length} label="Scoped requests" />
        <SummaryCard
          icon={<Clock3 size={18} />}
          value={rows.filter((item) => item.status === "Submitted").length}
          label="Awaiting barangay"
        />
        <SummaryCard
          icon={<ShieldCheck size={18} />}
          value={rows.filter((item) => item.status === "Municipal Review").length}
          label="Municipal review"
        />
        <SummaryCard
          icon={<BadgeCheck size={18} />}
          value={rows.filter((item) => item.status === "Approved").length}
          label="Approved"
        />
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search certification requests"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search request, resident, or LRN"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="Certification status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {["Submitted", "Barangay Certified", "Municipal Review", "Approved", "Rejected", "Cancelled"].map(
              (item) => (
                <option key={item}>{item}</option>
              ),
            )}
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} requests</strong>
          <span>Showing the latest 25</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th>Request</th>
                <th>Resident</th>
                <th>Barangay</th>
                <th>Sector</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 25).map((request) => {
                const resident = residents.find((item) => item.id === request.residentId);
                const definition = definitions.find((item) => item.code === request.sectorCode);
                return (
                  <tr key={request.id}>
                    <td className={styles.mono}>{request.requestNumber}</td>
                    <td>
                      <strong>{resident ? formatResidentName(resident) : "Unknown"}</strong>
                      <br />
                      <small>{resident?.lrn}</small>
                    </td>
                    <td>{MATNOG_BARANGAYS.find((item) => item.code === request.barangayId)?.name}</td>
                    <td>{definition?.name}</td>
                    <td>{new Date(request.requestedAt).toLocaleDateString("en-PH")}</td>
                    <td>
                      <span className={`${styles.badge} ${statusStyle(request.status)}`}>{request.status}</span>
                    </td>
                    <td>
                      <Link
                        className={styles.secondaryButton}
                        href={`/barangay-affairs/sectors/certification-requests/${request.id}`}
                      >
                        Review
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

export function CertificationRequestDetailView({ id }: { id: string }) {
  const requests = useSectorRegistryStore((state) => state.certificationRequests);
  const memberships = useSectorRegistryStore((state) => state.memberships);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const update = useSectorRegistryStore((state) => state.updateCertificationStatus);
  const createCredential = useSectorRegistryStore((state) => state.createCredential);
  const residents = useResidentRegistryStore((state) => state.residents);
  const request = requests.find((item) => item.id === id);
  const [note, setNote] = useState(request?.decisionNote ?? "");
  const [message, setMessage] = useState("");
  if (!request)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <h1>Request not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/sectors/certification-requests">
            Return to requests
          </Link>
        </div>
      </div>
    );
  const resident = residents.find((item) => item.id === request.residentId);
  const membership = memberships.find((item) => item.id === request.membershipId);
  const definition = definitions.find((item) => item.code === request.sectorCode);
  const move = (status: CertificationStatus) => {
    if (update(request.id, status, note)) setMessage(`Request moved to ${status}.`);
  };
  return (
    <div className={styles.page}>
      {message && <div className={styles.toast}>{message}</div>}
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Certification Request</p>
          <h1>{request.requestNumber}</h1>
          <p>
            {resident ? formatResidentName(resident) : "Unknown resident"} · {definition?.name}
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/sectors/certification-requests">
          <ArrowLeft size={15} /> Requests
        </Link>
      </header>
      <div className={styles.detailGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Current stage</p>
              <h2>
                <span className={`${styles.badge} ${statusStyle(request.status)}`}>{request.status}</span>
              </h2>
            </div>
          </div>
          <dl className={styles.dataList}>
            <div className={styles.dataRow}>
              <dt>Resident</dt>
              <dd>
                {resident ? formatResidentName(resident) : "Unknown"} ({resident?.lrn})
              </dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Barangay</dt>
              <dd>{MATNOG_BARANGAYS.find((item) => item.code === request.barangayId)?.name}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Membership</dt>
              <dd>{membership?.referenceNumber}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Supporting documents</dt>
              <dd>{membership?.supportingDocuments.join(", ")}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Barangay certification</dt>
              <dd>
                {request.barangayCertifiedBy || "Pending"}{" "}
                {request.barangayCertifiedAt
                  ? `· ${new Date(request.barangayCertifiedAt).toLocaleString("en-PH")}`
                  : ""}
              </dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Municipal decision</dt>
              <dd>
                {request.municipalReviewedBy || "Pending"}{" "}
                {request.municipalReviewedAt
                  ? `· ${new Date(request.municipalReviewedAt).toLocaleString("en-PH")}`
                  : ""}
              </dd>
            </div>
          </dl>
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Decision controls</p>
              <h2>Review action</h2>
            </div>
          </div>
          <label className={styles.field}>
            <span>Review note</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={5} />
          </label>
          <div className={styles.headerButtonGroup}>
            {request.status === "Submitted" && (
              <button className={styles.primaryButton} type="button" onClick={() => move("Barangay Certified")}>
                <CheckCircle2 size={15} /> Certify
              </button>
            )}
            {request.status === "Barangay Certified" && (
              <button className={styles.primaryButton} type="button" onClick={() => move("Municipal Review")}>
                <ShieldCheck size={15} /> Send to municipal
              </button>
            )}
            {request.status === "Municipal Review" && (
              <>
                <button className={styles.primaryButton} type="button" onClick={() => move("Approved")}>
                  <BadgeCheck size={15} /> Approve
                </button>
                <button className={styles.secondaryButton} type="button" onClick={() => move("Rejected")}>
                  Reject
                </button>
              </>
            )}
            {request.status === "Approved" && (
              <>
                <button
                  className={styles.primaryButton}
                  type="button"
                  onClick={() => {
                    const value = createCredential(request.membershipId, "Sector ID");
                    if (value) setMessage(`Sector ID ${value.credentialNumber} added to production.`);
                  }}
                >
                  <CreditCard size={15} /> Produce sector ID
                </button>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => {
                    const value = createCredential(request.membershipId, "Booklet");
                    if (value) setMessage(`Booklet ${value.credentialNumber} added to production.`);
                  }}
                >
                  <BookOpenCheck size={15} /> Produce booklet
                </button>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function CredentialsView() {
  const credentials = useSectorRegistryStore((state) => state.credentials);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const rows = credentials.filter((credential) => {
    const resident = residents.find((item) => item.id === credential.residentId);
    return (
      resident &&
      (selectedBarangay === "all" || resident.address.barangayId === selectedBarangay) &&
      (!status || credential.status === status) &&
      (!type || credential.credentialType === type) &&
      (!search ||
        `${credential.credentialNumber} ${formatResidentName(resident)} ${resident.lrn}`
          .toLowerCase()
          .includes(search.toLowerCase()))
    );
  });
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A3 Issuance Registry</p>
          <h1>Sector IDs & Booklets</h1>
          <p>Production, release, validity, and replacement tracking linked to sector memberships.</p>
        </div>
      </header>
      <div className={styles.summaryGrid}>
        <SummaryCard icon={<CreditCard size={18} />} value={rows.length} label="Credentials" />
        <SummaryCard
          icon={<Clock3 size={18} />}
          value={rows.filter((item) => item.status === "Pending Production").length}
          label="For production"
        />
        <SummaryCard
          icon={<PackageCheck size={18} />}
          value={rows.filter((item) => item.status === "Ready for Release").length}
          label="Ready for release"
        />
        <SummaryCard
          icon={<RefreshCw size={18} />}
          value={rows.filter((item) => item.status === "Expired").length}
          label="Expired"
        />
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search credentials"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search credential, resident, or LRN"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="Credential type"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="">All types</option>
            <option>Sector ID</option>
            <option>Booklet</option>
          </select>
          <select
            className={styles.compactSelect}
            aria-label="Credential status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {["Pending Production", "Ready for Release", "Released", "Expired", "Replaced", "Revoked"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} credentials</strong>
          <span>Showing the latest 25</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1000 }}>
            <thead>
              <tr>
                <th>Credential</th>
                <th>Resident</th>
                <th>Sector</th>
                <th>Type</th>
                <th>Issued</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 25).map((credential) => {
                const resident = residents.find((item) => item.id === credential.residentId);
                const definition = definitions.find((item) => item.code === credential.sectorCode);
                return (
                  <tr key={credential.id}>
                    <td className={styles.mono}>{credential.credentialNumber}</td>
                    <td>
                      <strong>{resident ? formatResidentName(resident) : "Unknown"}</strong>
                      <br />
                      <small>{resident?.lrn}</small>
                    </td>
                    <td>{definition?.shortName}</td>
                    <td>{credential.credentialType}</td>
                    <td>{credential.issuedAt}</td>
                    <td>{credential.expiresAt}</td>
                    <td>
                      <span className={`${styles.badge} ${statusStyle(credential.status)}`}>{credential.status}</span>
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
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function CredentialDetailView({ id }: { id: string }) {
  const credentials = useSectorRegistryStore((state) => state.credentials);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const update = useSectorRegistryStore((state) => state.updateCredentialStatus);
  const create = useSectorRegistryStore((state) => state.createCredential);
  const residents = useResidentRegistryStore((state) => state.residents);
  const credential = credentials.find((item) => item.id === id);
  const [message, setMessage] = useState("");
  if (!credential)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <h1>Credential not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/sectors/id-booklets">
            Return to issuance registry
          </Link>
        </div>
      </div>
    );
  const resident = residents.find((item) => item.id === credential.residentId);
  const definition = definitions.find((item) => item.code === credential.sectorCode);
  const move = (status: CredentialStatus) => {
    if (update(credential.id, status)) setMessage(`Credential marked ${status}.`);
  };
  return (
    <div className={styles.page}>
      {message && <div className={styles.toast}>{message}</div>}
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Credential Record</p>
          <h1>{credential.credentialNumber}</h1>
          <p>
            {credential.credentialType} · {definition?.name}
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/sectors/id-booklets">
          <ArrowLeft size={15} /> Issuance registry
        </Link>
      </header>
      <div className={styles.detailGrid}>
        <section className={styles.credentialPreview}>
          <div>
            <span>Republic of the Philippines</span>
            <strong>Municipality of Matnog</strong>
            <small>{definition?.name}</small>
          </div>
          <CreditCard size={42} />
          <h2>{resident ? formatResidentName(resident) : "Unknown resident"}</h2>
          <p>{resident?.lrn}</p>
          <strong>{credential.credentialNumber}</strong>
          <small>Valid until {credential.expiresAt}</small>
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Issuance status</p>
              <h2>
                <span className={`${styles.badge} ${statusStyle(credential.status)}`}>{credential.status}</span>
              </h2>
            </div>
          </div>
          <dl className={styles.dataList}>
            <div className={styles.dataRow}>
              <dt>Issued</dt>
              <dd>{credential.issuedAt}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Expires</dt>
              <dd>{credential.expiresAt}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Released by</dt>
              <dd>{credential.releasedBy || "Pending"}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Reason</dt>
              <dd>{credential.reason}</dd>
            </div>
          </dl>
          <div className={styles.headerButtonGroup}>
            {credential.status === "Pending Production" && (
              <button className={styles.primaryButton} type="button" onClick={() => move("Ready for Release")}>
                <PackageCheck size={15} /> Mark ready
              </button>
            )}
            {credential.status === "Ready for Release" && (
              <button className={styles.primaryButton} type="button" onClick={() => move("Released")}>
                <CheckCircle2 size={15} /> Release
              </button>
            )}
            {(credential.status === "Released" || credential.status === "Expired") && (
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => {
                  const value = create(credential.membershipId, credential.credentialType, credential.id);
                  if (value) setMessage(`Replacement ${value.credentialNumber} sent to production.`);
                }}
              >
                <RefreshCw size={15} /> Create replacement
              </button>
            )}
            {!["Revoked", "Replaced"].includes(credential.status) && (
              <button className={styles.secondaryButton} type="button" onClick={() => move("Revoked")}>
                Revoke
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function EligibilityAlertsView() {
  const alerts = useSectorRegistryStore((state) => state.alerts);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const update = useSectorRegistryStore((state) => state.updateAlertStatus);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay } = useBarangayScope();
  const [status, setStatus] = useState("Open");
  const [severity, setSeverity] = useState("");
  const rows = alerts.filter((alert) => {
    const resident = residents.find((item) => item.id === alert.residentId);
    return (
      resident &&
      (selectedBarangay === "all" || resident.address.barangayId === selectedBarangay) &&
      (!status || alert.status === status) &&
      (!severity || alert.severity === severity)
    );
  });
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A3 Automated Monitoring</p>
          <h1>Eligibility Alerts</h1>
          <p>Rule-based reminders for eligibility, missing documents, expiry, and renewal.</p>
        </div>
      </header>
      <div className={styles.summaryGrid}>
        <SummaryCard
          icon={<BellRing size={18} />}
          value={alerts.filter((item) => item.status === "Open").length}
          label="Open alerts"
        />
        <SummaryCard
          icon={<AlertTriangle size={18} />}
          value={alerts.filter((item) => item.status === "Open" && item.severity === "High").length}
          label="High priority"
        />
        <SummaryCard
          icon={<Clock3 size={18} />}
          value={alerts.filter((item) => item.alertType.includes("Expiring")).length}
          label="Expiry alerts"
        />
        <SummaryCard
          icon={<CheckCircle2 size={18} />}
          value={alerts.filter((item) => item.status === "Resolved").length}
          label="Resolved"
        />
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <select
            className={styles.compactSelect}
            aria-label="Alert status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            <option>Open</option>
            <option>Resolved</option>
            <option>Dismissed</option>
          </select>
          <select
            className={styles.compactSelect}
            aria-label="Alert severity"
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
          >
            <option value="">All priorities</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} alerts</strong>
          <span>Showing the latest 25</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1050 }}>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Resident</th>
                <th>Sector</th>
                <th>Alert</th>
                <th>Due date</th>
                <th>Details</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 25).map((alert) => {
                const resident = residents.find((item) => item.id === alert.residentId);
                const definition = definitions.find((item) => item.code === alert.sectorCode);
                return (
                  <tr key={alert.id}>
                    <td>
                      <span
                        className={`${styles.badge} ${alert.severity === "High" ? styles.danger : alert.severity === "Medium" ? styles.warning : styles.info}`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td>
                      <Link href={`/barangay-affairs/sectors/residents/${alert.residentId}`}>
                        <strong>{resident ? formatResidentName(resident) : "Unknown"}</strong>
                      </Link>
                      <br />
                      <small>{resident?.lrn}</small>
                    </td>
                    <td>{definition?.shortName}</td>
                    <td>{alert.alertType}</td>
                    <td>{alert.dueDate}</td>
                    <td>{alert.detail}</td>
                    <td>
                      <span className={`${styles.badge} ${statusStyle(alert.status)}`}>{alert.status}</span>
                    </td>
                    <td>
                      {alert.status === "Open" ? (
                        <div className={styles.headerButtonGroup}>
                          <button
                            className={styles.primaryButton}
                            type="button"
                            onClick={() => update(alert.id, "Resolved")}
                          >
                            Resolve
                          </button>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => update(alert.id, "Dismissed")}
                          >
                            Dismiss
                          </button>
                        </div>
                      ) : (
                        "—"
                      )}
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

export function ExpiringCredentialsView() {
  const credentials = useSectorRegistryStore((state) => state.credentials);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay } = useBarangayScope();
  const cutoff = "2027-03-31";
  const rows = credentials
    .filter((credential) => {
      const resident = residents.find((item) => item.id === credential.residentId);
      return (
        resident &&
        (selectedBarangay === "all" || resident.address.barangayId === selectedBarangay) &&
        (credential.status === "Expired" || (credential.status === "Released" && credential.expiresAt <= cutoff))
      );
    })
    .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A3 Renewal Worklist</p>
          <h1>Expiring IDs & Booklets</h1>
          <p>Expired credentials and credentials due within the next six months.</p>
        </div>
      </header>
      <div className={styles.summaryGrid}>
        <SummaryCard icon={<AlertTriangle size={18} />} value={rows.length} label="Renewal worklist" />
        <SummaryCard
          icon={<CreditCard size={18} />}
          value={rows.filter((item) => item.credentialType === "Sector ID").length}
          label="Sector IDs"
        />
        <SummaryCard
          icon={<BookOpenCheck size={18} />}
          value={rows.filter((item) => item.credentialType === "Booklet").length}
          label="Booklets"
        />
        <SummaryCard
          icon={<Clock3 size={18} />}
          value={rows.filter((item) => item.status === "Expired").length}
          label="Already expired"
        />
      </div>
      <section className={styles.card}>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} credentials require attention</strong>
          <span>Sorted by expiry date</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>Expires</th>
                <th>Credential</th>
                <th>Resident</th>
                <th>Barangay</th>
                <th>Sector</th>
                <th>Type</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 30).map((credential) => {
                const resident = residents.find((item) => item.id === credential.residentId);
                const definition = definitions.find((item) => item.code === credential.sectorCode);
                return (
                  <tr key={credential.id}>
                    <td>{credential.expiresAt}</td>
                    <td className={styles.mono}>{credential.credentialNumber}</td>
                    <td>
                      <strong>{resident ? formatResidentName(resident) : "Unknown"}</strong>
                    </td>
                    <td>{MATNOG_BARANGAYS.find((item) => item.code === resident?.address.barangayId)?.name}</td>
                    <td>{definition?.shortName}</td>
                    <td>{credential.credentialType}</td>
                    <td>
                      <span className={`${styles.badge} ${statusStyle(credential.status)}`}>{credential.status}</span>
                    </td>
                    <td>
                      <Link
                        className={styles.secondaryButton}
                        href={`/barangay-affairs/sectors/id-booklets/${credential.id}`}
                      >
                        Renew / replace
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
