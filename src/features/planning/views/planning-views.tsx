"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  FileText,
  Landmark,
  ListChecks,
  Search,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { BDC_ROLES, BDC_SECTORS } from "../data/planning-data";
import { usePlanningStore } from "../stores/planning-store";
import type { BdcCouncil, BdcMember } from "../types/planning";
import planningStyles from "./planning.module.css";

const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

function CouncilStatus({ status }: { status: BdcCouncil["status"] }) {
  return <span className={`${styles.badge} ${status === "Complete" ? styles.active : styles.warning}`}>{status}</span>;
}

function MemberStatus({ status }: { status: BdcMember["status"] }) {
  return (
    <span
      className={`${styles.badge} ${status === "Active" ? styles.active : status === "Term ending" ? styles.warning : styles.muted}`}
    >
      {status}
    </span>
  );
}

export function PlanningDashboardView() {
  const councils = usePlanningStore((state) => state.councils);
  const members = usePlanningStore((state) => state.members);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const scopedCouncils = councils.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const scopedMembers = members.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const complete = scopedCouncils.filter((item) => item.status === "Complete").length;
  const completion = scopedCouncils.length ? Math.round((complete / scopedCouncils.length) * 100) : 0;
  const sectorRepresentatives = scopedMembers.filter((item) =>
    ["Sectoral Representative", "NGO Representative", "People's Organization Representative"].includes(item.role),
  ).length;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A10 Planning & Development</p>
          <h1>Barangay Planning Dashboard</h1>
          <p>Development council readiness and planning-cycle status for {selectedBarangayName}.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/planning/bdc">
          <UsersRound size={15} /> Manage BDC composition
        </Link>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Landmark size={18} />
          </span>
          <div>
            <strong>{scopedCouncils.length}</strong>
            <span>BDC profiles</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <UsersRound size={18} />
          </span>
          <div>
            <strong>{scopedMembers.length}</strong>
            <span>Appointed members</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <BadgeCheck size={18} />
          </span>
          <div>
            <strong>{completion}%</strong>
            <span>Composition complete</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ListChecks size={18} />
          </span>
          <div>
            <strong>{sectorRepresentatives}</strong>
            <span>Sector and CSO seats</span>
          </div>
        </div>
      </div>

      <div className={planningStyles.dashboardGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Council readiness</p>
              <h2>BDC composition by barangay</h2>
            </div>
            <Link className={styles.secondaryButton} href="/barangay-affairs/planning/bdc">
              View compositions
            </Link>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table} style={{ minWidth: 840 }}>
              <thead>
                <tr>
                  <th>Barangay</th>
                  <th>Planning cycle</th>
                  <th>Members</th>
                  <th>Sector seats</th>
                  <th>Resolution</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {scopedCouncils.map((council) => {
                  const councilMembers = members.filter((item) => item.barangayId === council.barangayId);
                  const sectors = new Set(councilMembers.map((item) => item.sector)).size;
                  return (
                    <tr key={council.barangayId}>
                      <td>
                        <Link href={`/barangay-affairs/planning/bdc?barangay=${council.barangayId}`}>
                          {barangayName(council.barangayId)}
                        </Link>
                      </td>
                      <td>{council.planningCycle}</td>
                      <td>{councilMembers.length}</td>
                      <td>{sectors}</td>
                      <td className={styles.mono}>{council.resolutionNumber}</td>
                      <td>
                        <CouncilStatus status={council.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Phase 1 controls</p>
              <h2>Planning readiness</h2>
            </div>
          </div>
          <div className={planningStyles.readinessList}>
            <Link href="/barangay-affairs/planning/bdc">
              <CheckCircle2 size={17} />
              <span>
                <strong>{complete} complete councils</strong>
                <small>Required roles and sector representation recorded</small>
              </span>
              <ChevronRight size={15} />
            </Link>
            <Link href="/barangay-affairs/planning/bdc?status=Needs%20action">
              <CircleAlert size={17} />
              <span>
                <strong>{scopedCouncils.length - complete} councils need action</strong>
                <small>Review vacant or missing representative seats</small>
              </span>
              <ChevronRight size={15} />
            </Link>
            <div>
              <CalendarClock size={17} />
              <span>
                <strong>{scopedMembers.filter((item) => item.status === "Term ending").length} terms ending</strong>
                <small>Appointment updates due before the next planning cycle</small>
              </span>
            </div>
            <div>
              <ClipboardCheck size={17} />
              <span>
                <strong>2026–2028 planning cycle</strong>
                <small>BDC composition is the approval base for the BDP</small>
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function BdcCompositionView() {
  const councils = usePlanningStore((state) => state.councils);
  const members = usePlanningStore((state) => state.members);
  const appointMember = usePlanningStore((state) => state.appointMember);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [query, setQuery] = useState("");
  const [selectedCouncilId, setSelectedCouncilId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [residentId, setResidentId] = useState("");
  const [role, setRole] = useState<string>(BDC_ROLES[5]);
  const [sector, setSector] = useState<string>(BDC_SECTORS[2]);
  const [committee, setCommittee] = useState("Social Development");

  const availableCouncils = councils.filter(
    (item) => selectedBarangay === "all" || item.barangayId === selectedBarangay,
  );
  const filteredCouncils = availableCouncils.filter((item) =>
    barangayName(item.barangayId).toLowerCase().includes(query.toLowerCase()),
  );
  const selectedCouncil = councils.find((item) => item.barangayId === selectedCouncilId) ?? filteredCouncils[0];
  const councilMembers = selectedCouncil
    ? members.filter((item) => item.barangayId === selectedCouncil.barangayId)
    : [];
  const residentMap = useMemo(() => new Map(residents.map((item) => [item.id, item])), [residents]);
  const eligibleResidents = selectedCouncil
    ? residents.filter(
        (resident) =>
          resident.address.barangayId === selectedCouncil.barangayId &&
          resident.residentStatus === "Active" &&
          !councilMembers.some((member) => member.residentId === resident.id),
      )
    : [];
  const activeSectors = new Set(councilMembers.map((item) => item.sector)).size;
  const averageAttendance = councilMembers.length
    ? Math.round(councilMembers.reduce((sum, item) => sum + item.attendanceRate, 0) / councilMembers.length)
    : 0;

  const saveMember = () => {
    if (!selectedCouncil || !residentId) return;
    const added = appointMember({
      barangayId: selectedCouncil.barangayId,
      residentId,
      role,
      sector,
      committee,
      termStart: "2026-09-23",
      termEnd: "2028-12-31",
      appointmentReference: `EO-${selectedCouncil.barangayId.toUpperCase()}-2026-${String(councilMembers.length + 1).padStart(2, "0")}`,
    });
    const resident = residentMap.get(added.residentId);
    setNotice(
      `${resident ? formatResidentName(resident) : "The resident"} was added to the ${barangayName(added.barangayId)} BDC.`,
    );
    setResidentId("");
    setShowForm(false);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A10 Planning & Development</p>
          <h1>BDC Composition</h1>
          <p>Maintain resident-linked development council membership for {selectedBarangayName}.</p>
        </div>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={() => {
            setShowForm(true);
            setNotice("");
          }}
        >
          <UserPlus size={15} /> Add council member
        </button>
      </header>

      {notice ? (
        <div className={planningStyles.successNotice}>
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      ) : null}

      <div className={planningStyles.bdcWorkspace}>
        <section className={styles.card}>
          <div className={planningStyles.councilToolbar}>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search barangay council"
              />
            </label>
            <div>
              <strong>{filteredCouncils.length} BDC profiles</strong>
              <span>Across the selected barangay scope</span>
            </div>
          </div>
          <div className={planningStyles.councilList}>
            {filteredCouncils.map((council) => {
              const count = members.filter((item) => item.barangayId === council.barangayId).length;
              return (
                <button
                  type="button"
                  key={council.barangayId}
                  className={selectedCouncil?.barangayId === council.barangayId ? planningStyles.councilSelected : ""}
                  onClick={() => {
                    setSelectedCouncilId(council.barangayId);
                    setShowForm(false);
                    setNotice("");
                  }}
                >
                  <span>
                    <Landmark size={16} />
                  </span>
                  <div>
                    <strong>Brgy. {barangayName(council.barangayId)}</strong>
                    <small>{council.resolutionNumber}</small>
                  </div>
                  <div>
                    <b>{count} members</b>
                    <CouncilStatus status={council.status} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.card}>
          {selectedCouncil ? (
            <>
              <div className={planningStyles.councilHeader}>
                <span>
                  <Landmark size={19} />
                </span>
                <div>
                  <p className={styles.eyebrow}>Barangay Development Council</p>
                  <h2>{barangayName(selectedCouncil.barangayId)}</h2>
                  <small>
                    {selectedCouncil.resolutionNumber} · Constituted {formatDate(selectedCouncil.constitutedDate)}
                  </small>
                </div>
                <CouncilStatus status={selectedCouncil.status} />
              </div>
              <div className={planningStyles.compositionMetrics}>
                <div>
                  <strong>{councilMembers.length}</strong>
                  <span>Members</span>
                </div>
                <div>
                  <strong>{activeSectors}</strong>
                  <span>Sectors represented</span>
                </div>
                <div>
                  <strong>{averageAttendance}%</strong>
                  <span>Average attendance</span>
                </div>
                <div>
                  <strong>{councilMembers.filter((item) => item.status === "Term ending").length}</strong>
                  <span>Terms ending</span>
                </div>
              </div>

              {showForm ? (
                <div className={planningStyles.memberForm}>
                  <div className={planningStyles.formHeading}>
                    <div>
                      <strong>Appoint a council member</strong>
                      <small>Select an active resident from Brgy. {barangayName(selectedCouncil.barangayId)}.</small>
                    </div>
                    <button type="button" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                  </div>
                  <div className={planningStyles.formGrid}>
                    <label>
                      <span>Resident</span>
                      <select value={residentId} onChange={(event) => setResidentId(event.target.value)}>
                        <option value="">Select resident</option>
                        {eligibleResidents.slice(0, 80).map((resident) => (
                          <option key={resident.id} value={resident.id}>
                            {formatResidentName(resident)} · {resident.lrn}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Council role</span>
                      <select value={role} onChange={(event) => setRole(event.target.value)}>
                        {BDC_ROLES.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Represented sector</span>
                      <select value={sector} onChange={(event) => setSector(event.target.value)}>
                        {BDC_SECTORS.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Committee</span>
                      <select value={committee} onChange={(event) => setCommittee(event.target.value)}>
                        <option>Social Development</option>
                        <option>Economic Development</option>
                        <option>Infrastructure</option>
                        <option>Environment</option>
                        <option>Peace and Order</option>
                      </select>
                    </label>
                  </div>
                  <div className={planningStyles.formActions}>
                    <span>
                      <FileText size={15} /> Appointment reference will be generated automatically.
                    </span>
                    <button className={styles.primaryButton} type="button" disabled={!residentId} onClick={saveMember}>
                      <UserPlus size={14} /> Save appointment
                    </button>
                  </div>
                </div>
              ) : null}

              <div className={planningStyles.memberTableHeading}>
                <div>
                  <strong>Current composition</strong>
                  <small>Resident-linked appointments for the 2026–2028 planning cycle</small>
                </div>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table} style={{ minWidth: 1020 }}>
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Role</th>
                      <th>Sector</th>
                      <th>Committee</th>
                      <th>Term</th>
                      <th>Attendance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {councilMembers.map((member) => {
                      const resident = residentMap.get(member.residentId);
                      return (
                        <tr key={member.id}>
                          <td>
                            {resident ? (
                              <Link href={`/barangay-affairs/residents/${resident.id}`}>
                                {formatResidentName(resident)}
                              </Link>
                            ) : (
                              "Resident record"
                            )}
                            <small className={planningStyles.tableSubtext}>{resident?.lrn}</small>
                          </td>
                          <td>{member.role}</td>
                          <td>{member.sector}</td>
                          <td>{member.committee}</td>
                          <td>
                            {formatDate(member.termStart)} – {formatDate(member.termEnd)}
                          </td>
                          <td>
                            <span className={planningStyles.attendance}>
                              <i>
                                <b style={{ width: `${member.attendanceRate}%` }} />
                              </i>
                              {member.attendanceRate}%
                            </span>
                          </td>
                          <td>
                            <MemberStatus status={member.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
