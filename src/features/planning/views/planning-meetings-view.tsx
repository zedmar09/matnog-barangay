"use client";

import { useMemo, useState } from "react";

import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileCheck2,
  FileText,
  ListChecks,
  MapPin,
  Paperclip,
  Plus,
  Search,
  UserCheck,
  UsersRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { usePlanningStore } from "../stores/planning-store";
import type { PlanningMeeting, PlanningMeetingStatus } from "../types/planning";
import planningStyles from "./planning.module.css";

type MeetingFilter = "All" | "Scheduled" | "Review" | "Approved";

const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
const formatTime = (value: string) =>
  new Date(`2026-01-01T${value}:00`).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });

function MeetingStatusBadge({ status }: { status: PlanningMeetingStatus }) {
  const badgeClass =
    status === "Approved"
      ? styles.active
      : status === "Scheduled"
        ? styles.info
        : status === "For approval"
          ? styles.warning
          : styles.muted;
  return <span className={`${styles.badge} ${badgeClass}`}>{status}</span>;
}

export function PlanningMeetingsView() {
  const meetings = usePlanningStore((state) => state.meetings);
  const councils = usePlanningStore((state) => state.councils);
  const members = usePlanningStore((state) => state.members);
  const scheduleMeeting = usePlanningStore((state) => state.scheduleMeeting);
  const advanceMeeting = usePlanningStore((state) => state.advanceMeeting);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [filter, setFilter] = useState<MeetingFilter>("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const initialBarangay = selectedBarangay === "all" ? (councils[0]?.barangayId ?? "") : selectedBarangay;
  const [form, setForm] = useState({
    barangayId: initialBarangay,
    title: "BDC Regular Meeting",
    meetingType: "Regular" as PlanningMeeting["meetingType"],
    meetingDate: "2026-11-12",
    startTime: "09:00",
    venue: "Barangay Hall Session Room",
  });

  const residentMap = useMemo(() => new Map(residents.map((resident) => [resident.id, resident])), [residents]);
  const memberMap = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const scoped = meetings.filter((meeting) => selectedBarangay === "all" || meeting.barangayId === selectedBarangay);
  const filtered = scoped.filter((meeting) => {
    const matchesFilter =
      filter === "All" ||
      meeting.status === filter ||
      (filter === "Review" && ["Minutes draft", "For approval"].includes(meeting.status));
    const haystack = `${meeting.title} ${meeting.referenceNumber} ${barangayName(meeting.barangayId)}`.toLowerCase();
    return matchesFilter && haystack.includes(query.trim().toLowerCase());
  });
  const initial = filtered.find((meeting) => meeting.status === "For approval") ?? filtered[0];
  const selected = meetings.find((meeting) => meeting.id === selectedId) ?? initial;
  const presentMembers = selected
    ? selected.presentMemberIds
        .map((memberId) => memberMap.get(memberId))
        .filter((member): member is NonNullable<typeof member> => Boolean(member))
    : [];
  const quorumRequired = selected ? Math.floor(selected.invitedMemberIds.length / 2) + 1 : 0;
  const hasQuorum = presentMembers.length >= quorumRequired;
  const averageAttendance = scoped.length
    ? Math.round(
        (scoped.reduce(
          (total, meeting) =>
            total +
            (meeting.invitedMemberIds.length ? meeting.presentMemberIds.length / meeting.invitedMemberIds.length : 0),
          0,
        ) /
          scoped.length) *
          100,
      )
    : 0;

  const saveMeeting = () => {
    if (!form.barangayId || !form.title.trim()) return;
    const meeting = scheduleMeeting(form);
    setSelectedId(meeting.id);
    setFilter("All");
    setShowForm(false);
    setNotice(`${meeting.referenceNumber} was scheduled for Brgy. ${barangayName(meeting.barangayId)}.`);
  };

  const advance = () => {
    if (!selected) return;
    setSelectedId(selected.id);
    const meeting = advanceMeeting(selected.id);
    if (!meeting) return;
    const message =
      meeting.status === "Minutes draft"
        ? "Attendance was recorded and the minutes workspace is ready."
        : meeting.status === "For approval"
          ? "The minutes were submitted for chairperson approval."
          : "The signed minutes were approved and locked in the meeting record.";
    setNotice(`${meeting.referenceNumber}: ${message}`);
  };

  const actionLabel = selected
    ? selected.status === "Scheduled"
      ? "Record attendance & minutes"
      : selected.status === "Minutes draft"
        ? "Submit minutes for approval"
        : selected.status === "For approval"
          ? "Approve signed minutes"
          : "Minutes approved"
    : "";

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A10 Planning & Development</p>
          <h1>BDC Meetings & Minutes</h1>
          <p>Schedule council sessions, record quorum, and control meeting minutes for {selectedBarangayName}.</p>
        </div>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={() => {
            setShowForm(true);
            setNotice("");
          }}
        >
          <Plus size={15} /> Schedule meeting
        </button>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CalendarDays size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.status === "Scheduled").length}</strong>
            <span>Scheduled meetings</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <FileText size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.status === "Minutes draft").length}</strong>
            <span>Minutes in preparation</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CircleAlert size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.status === "For approval").length}</strong>
            <span>Awaiting approval</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <UserCheck size={18} />
          </span>
          <div>
            <strong>{averageAttendance}%</strong>
            <span>Average attendance</span>
          </div>
        </div>
      </div>

      {notice ? (
        <div className={planningStyles.successNotice}>
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      ) : null}

      {showForm ? (
        <section className={`${styles.card} ${planningStyles.meetingForm}`}>
          <div className={planningStyles.formHeading}>
            <div>
              <strong>Schedule a BDC meeting</strong>
              <small>Create the meeting record and invite the selected barangay council.</small>
            </div>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
          <div className={planningStyles.meetingFormGrid}>
            <label>
              <span>Barangay</span>
              <select
                value={form.barangayId}
                onChange={(event) => setForm({ ...form, barangayId: event.target.value })}
                disabled={selectedBarangay !== "all"}
              >
                {councils.map((council) => (
                  <option key={council.barangayId} value={council.barangayId}>
                    {barangayName(council.barangayId)}
                  </option>
                ))}
              </select>
            </label>
            <label className={planningStyles.formWide}>
              <span>Meeting title</span>
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </label>
            <label>
              <span>Meeting type</span>
              <select
                value={form.meetingType}
                onChange={(event) =>
                  setForm({ ...form, meetingType: event.target.value as PlanningMeeting["meetingType"] })
                }
              >
                <option>Regular</option>
                <option>Special</option>
                <option>Sector consultation</option>
              </select>
            </label>
            <label>
              <span>Date</span>
              <input
                type="date"
                value={form.meetingDate}
                onChange={(event) => setForm({ ...form, meetingDate: event.target.value })}
              />
            </label>
            <label>
              <span>Start time</span>
              <input
                type="time"
                value={form.startTime}
                onChange={(event) => setForm({ ...form, startTime: event.target.value })}
              />
            </label>
            <label>
              <span>Venue</span>
              <input value={form.venue} onChange={(event) => setForm({ ...form, venue: event.target.value })} />
            </label>
          </div>
          <div className={planningStyles.formActions}>
            <span>
              <UsersRound size={15} /> Active BDC members will be added to the invitation list.
            </span>
            <button className={styles.primaryButton} type="button" onClick={saveMeeting}>
              <CalendarDays size={14} /> Save meeting
            </button>
          </div>
        </section>
      ) : null}

      <div className={planningStyles.meetingWorkspace}>
        <section className={styles.card}>
          <div className={planningStyles.meetingToolbar}>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search meeting, reference, or barangay"
              />
            </label>
            <div className={planningStyles.meetingSegments}>
              {(["All", "Scheduled", "Review", "Approved"] as MeetingFilter[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={filter === item ? planningStyles.segmentActive : ""}
                  onClick={() => {
                    setFilter(item);
                    setSelectedId("");
                    setNotice("");
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className={planningStyles.meetingListMeta}>
              <strong>{filtered.length} meeting records</strong>
              <span>{filter}</span>
            </div>
          </div>
          <div className={planningStyles.meetingList}>
            {filtered.map((meeting) => (
              <button
                type="button"
                key={meeting.id}
                className={selected?.id === meeting.id ? planningStyles.meetingSelected : ""}
                onClick={() => {
                  setSelectedId(meeting.id);
                  setNotice("");
                }}
              >
                <span className={planningStyles.meetingDate}>
                  <b>{new Date(`${meeting.meetingDate}T00:00:00`).toLocaleDateString("en-PH", { month: "short" })}</b>
                  <strong>{new Date(`${meeting.meetingDate}T00:00:00`).getDate()}</strong>
                </span>
                <div>
                  <strong>{meeting.title}</strong>
                  <small>
                    {meeting.referenceNumber} · {barangayName(meeting.barangayId)}
                  </small>
                </div>
                <MeetingStatusBadge status={meeting.status} />
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          {selected ? (
            <>
              <div className={planningStyles.meetingHeader}>
                <div>
                  <p className={styles.eyebrow}>{selected.referenceNumber}</p>
                  <h2>{selected.title}</h2>
                  <span>
                    <CalendarDays size={13} /> {formatDate(selected.meetingDate)} · {formatTime(selected.startTime)}{" "}
                    <MapPin size={13} /> {selected.venue}
                  </span>
                </div>
                <MeetingStatusBadge status={selected.status} />
              </div>
              <div className={planningStyles.quorumStrip}>
                <span className={hasQuorum ? planningStyles.quorumMet : planningStyles.quorumPending}>
                  {hasQuorum ? <CheckCircle2 size={17} /> : <Clock3 size={17} />}
                </span>
                <div>
                  <strong>
                    {selected.status === "Scheduled"
                      ? "Attendance opens on meeting day"
                      : hasQuorum
                        ? "Quorum confirmed"
                        : "Quorum not reached"}
                  </strong>
                  <small>
                    {presentMembers.length} present of {selected.invitedMemberIds.length} invited · {quorumRequired}{" "}
                    required
                  </small>
                </div>
                <span>
                  <b>{selected.resolutionsPassed}</b>
                  <small>Resolutions</small>
                </span>
                <span>
                  <b>{selected.attachmentCount}</b>
                  <small>Attachments</small>
                </span>
              </div>

              <div className={planningStyles.meetingDetailGrid}>
                <article>
                  <header>
                    <ListChecks size={16} />
                    <div>
                      <strong>Agenda and decisions</strong>
                      <small>{selected.agenda.length} recorded agenda items</small>
                    </div>
                  </header>
                  <div className={planningStyles.agendaList}>
                    {selected.agenda.map((agenda, index) => (
                      <div key={agenda.id}>
                        <span>{index + 1}</span>
                        <div>
                          <strong>{agenda.title}</strong>
                          <small>{agenda.presenter}</small>
                          <p>{agenda.decision}</p>
                        </div>
                        <b>{agenda.outcome}</b>
                      </div>
                    ))}
                  </div>
                </article>
                <aside>
                  <header>
                    <UsersRound size={16} />
                    <div>
                      <strong>Attendance</strong>
                      <small>Linked to the current BDC composition</small>
                    </div>
                  </header>
                  <div className={planningStyles.attendeeList}>
                    {selected.invitedMemberIds.slice(0, 8).map((memberId) => {
                      const member = memberMap.get(memberId);
                      const resident = member ? residentMap.get(member.residentId) : undefined;
                      const present = selected.presentMemberIds.includes(memberId);
                      return (
                        <div key={memberId}>
                          <span className={present ? planningStyles.present : planningStyles.absent}>
                            {present ? <UserCheck size={13} /> : <Clock3 size={13} />}
                          </span>
                          <div>
                            <strong>{resident ? formatResidentName(resident) : "Council member"}</strong>
                            <small>{member?.role}</small>
                          </div>
                          <b>{selected.status === "Scheduled" ? "Invited" : present ? "Present" : "Absent"}</b>
                        </div>
                      );
                    })}
                  </div>
                </aside>
              </div>

              <div className={planningStyles.minutesPanel}>
                <header>
                  <FileCheck2 size={16} />
                  <div>
                    <strong>Minutes summary</strong>
                    <small>Prepared by {selected.preparedBy || "Barangay Secretary after the meeting"}</small>
                  </div>
                  {selected.approvedBy ? (
                    <span>
                      <BadgeCheck size={13} /> Approved by {selected.approvedBy}
                    </span>
                  ) : null}
                </header>
                <p>{selected.minutesSummary}</p>
                <div>
                  <span>
                    <Paperclip size={13} /> {selected.attachmentCount} supporting files
                  </span>
                  <span>
                    <FileText size={13} /> {selected.resolutionsPassed} resolutions recorded
                  </span>
                </div>
              </div>

              <footer className={planningStyles.meetingFooter}>
                <div>
                  <FileText size={16} />
                  <span>
                    <strong>
                      {selected.status === "Approved" ? "Official minutes record" : "Meeting workflow in progress"}
                    </strong>
                    <small>Attendance and decisions remain linked to this meeting reference.</small>
                  </span>
                </div>
                <button
                  className={styles.primaryButton}
                  type="button"
                  disabled={selected.status === "Approved"}
                  onClick={advance}
                >
                  <FileCheck2 size={14} /> {actionLabel}
                </button>
              </footer>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
