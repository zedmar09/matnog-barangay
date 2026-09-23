"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, CheckCircle2, FilePlus2, MapPin, Scale, Search, ShieldAlert } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { usePeaceOrderStore } from "../stores/peace-order-store";
import type { BlotterStatus, IncidentParty, IncidentType } from "../types/blotter";
import peaceStyles from "./peace-order.module.css";

const blankParty: IncidentParty = { kind: "Resident", residentId: "", fullName: "", contact: "", address: "" };
function PartyPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: IncidentParty;
  onChange: (party: IncidentParty) => void;
}) {
  const residents = useResidentRegistryStore((state) => state.residents);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<IncidentParty["kind"]>(value.kind);
  const matches =
    search.trim().length < 2
      ? []
      : residents
          .filter((item) =>
            `${formatResidentName(item)} ${item.lrn} ${item.contact.primaryMobile}`
              .toLowerCase()
              .includes(search.toLowerCase()),
          )
          .slice(0, 6);
  return (
    <div className={peaceStyles.partyPicker}>
      <strong>{label}</strong>
      <div className={peaceStyles.partyTabs}>
        <button
          className={kind === "Resident" ? peaceStyles.activeTab : ""}
          type="button"
          onClick={() => {
            setKind("Resident");
            onChange({ ...blankParty, kind: "Resident" });
          }}
        >
          Registered resident
        </button>
        <button
          className={kind === "Non-Resident" ? peaceStyles.activeTab : ""}
          type="button"
          onClick={() => {
            setKind("Non-Resident");
            onChange({ ...blankParty, kind: "Non-Resident" });
          }}
        >
          Non-resident
        </button>
      </div>
      {kind === "Resident" ? (
        value.residentId ? (
          <div className={peaceStyles.partySelected}>
            <strong>{value.fullName}</strong>
            <br />
            <small>{value.address}</small>
          </div>
        ) : (
          <>
            <label className={styles.searchBox}>
              <Search size={14} />
              <input
                aria-label={`Search ${label}`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search resident name, LRN, or mobile"
              />
            </label>
            {matches.length > 0 && (
              <div className={peaceStyles.partyResults}>
                {matches.map((resident) => (
                  <button
                    key={resident.id}
                    type="button"
                    onClick={() => {
                      onChange({
                        kind: "Resident",
                        residentId: resident.id,
                        fullName: formatResidentName(resident),
                        contact: resident.contact.primaryMobile,
                        address:
                          `${resident.address.houseUnit} ${resident.address.street}, Brgy. ${MATNOG_BARANGAYS.find((item) => item.code === resident.address.barangayId)?.name}`.trim(),
                      });
                      setSearch("");
                    }}
                  >
                    <strong>{formatResidentName(resident)}</strong>
                    <small>
                      {resident.lrn} · {resident.contact.primaryMobile}
                    </small>
                  </button>
                ))}
              </div>
            )}
          </>
        )
      ) : (
        <div className={styles.filterGrid}>
          <label className={styles.field}>
            <span>Full name</span>
            <input
              value={value.fullName}
              onChange={(event) => onChange({ ...value, kind: "Non-Resident", fullName: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span>Contact</span>
            <input
              value={value.contact}
              onChange={(event) => onChange({ ...value, kind: "Non-Resident", contact: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span>Address</span>
            <input
              value={value.address}
              onChange={(event) => onChange({ ...value, kind: "Non-Resident", address: event.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  );
}

export function BlotterFormView() {
  const create = usePeaceOrderStore((state) => state.createBlotter);
  const { selectedBarangay } = useBarangayScope();
  const router = useRouter();
  const [barangayId, setBarangayId] = useState(
    selectedBarangay === "all" ? MATNOG_BARANGAYS[0].code : selectedBarangay,
  );
  const [incidentType, setIncidentType] = useState<IncidentType>("Other");
  const [incidentAt, setIncidentAt] = useState("2026-09-23T10:00");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("12.587");
  const [longitude, setLongitude] = useState("124.082");
  const [priority, setPriority] = useState<"High" | "Standard">("Standard");
  const [complainant, setComplainant] = useState<IncidentParty>(blankParty);
  const [respondent, setRespondent] = useState<IncidentParty>(blankParty);
  const [narrative, setNarrative] = useState("");
  const [error, setError] = useState("");
  const types: IncidentType[] = [
    "Physical Injury",
    "Threats",
    "Property Dispute",
    "Noise Complaint",
    "Theft",
    "Public Disturbance",
    "Domestic Dispute",
    "Other",
  ];
  const submit = () => {
    if (!complainant.fullName.trim() || !respondent.fullName.trim() || !location.trim() || !narrative.trim()) {
      setError("Complete both parties, the incident location, and narrative.");
      return;
    }
    const record = create({
      barangayId,
      incidentType,
      incidentAt: new Date(incidentAt).toISOString(),
      location,
      latitude: Number(latitude) || 0,
      longitude: Number(longitude) || 0,
      complainant,
      respondent,
      narrative,
      priority,
    });
    router.push(`/barangay-affairs/peace-order/blotter/${record.id}`);
  };
  return (
    <div className={styles.page}>
      {error && <div className={styles.toast}>{error}</div>}
      <div className={peaceStyles.restrictedBanner}>
        <ShieldAlert size={17} />
        This incident record is restricted to authorized peace and order personnel. Access and status changes are
        logged.
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A5 Incident Intake</p>
          <h1>File Blotter Incident</h1>
          <p>Record the incident, parties, location, and initial narrative.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/peace-order/blotter">
          <ArrowLeft size={15} /> Blotter
        </Link>
      </header>
      <div className={styles.detailGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Incident information</p>
              <h2>Event and location</h2>
            </div>
          </div>
          <div className={styles.filterGrid}>
            <label className={styles.field}>
              <span>Barangay</span>
              <select value={barangayId} onChange={(event) => setBarangayId(event.target.value)}>
                {MATNOG_BARANGAYS.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Incident type</span>
              <select value={incidentType} onChange={(event) => setIncidentType(event.target.value as IncidentType)}>
                {types.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Date and time</span>
              <input type="datetime-local" value={incidentAt} onChange={(event) => setIncidentAt(event.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Priority</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value as "High" | "Standard")}>
                <option>Standard</option>
                <option>High</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Specific location</span>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Purok, street, or landmark"
              />
            </label>
            <label className={styles.field}>
              <span>Latitude</span>
              <input value={latitude} onChange={(event) => setLatitude(event.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Longitude</span>
              <input value={longitude} onChange={(event) => setLongitude(event.target.value)} />
            </label>
          </div>
          <label className={styles.field}>
            <span>Incident narrative</span>
            <textarea
              rows={8}
              value={narrative}
              onChange={(event) => setNarrative(event.target.value)}
              placeholder="Record the initial account objectively and in chronological order."
            />
          </label>
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Parties</p>
              <h2>People involved</h2>
            </div>
          </div>
          <PartyPicker label="Complainant" value={complainant} onChange={setComplainant} />
          <PartyPicker label="Respondent" value={respondent} onChange={setRespondent} />
          <button className={styles.primaryButton} type="button" onClick={submit}>
            <FilePlus2 size={15} /> File incident
          </button>
        </aside>
      </div>
    </div>
  );
}

export function BlotterDetailView({ id }: { id: string }) {
  const records = usePeaceOrderStore((state) => state.blotterRecords);
  const update = usePeaceOrderStore((state) => state.updateBlotterStatus);
  const record = records.find((item) => item.id === id);
  const [note, setNote] = useState("Initial assessment completed and party statements reviewed.");
  const [message, setMessage] = useState("");
  if (!record)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <h1>Blotter record not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/peace-order/blotter">
            Return to blotter
          </Link>
        </div>
      </div>
    );
  const move = (status: BlotterStatus) => {
    const value = update(record.id, status, note);
    setMessage(value ? `Case moved to ${status}.` : "Enter a case note.");
  };
  return (
    <div className={styles.page}>
      {message && <div className={styles.toast}>{message}</div>}
      <div className={peaceStyles.restrictedBanner}>
        <ShieldAlert size={17} />
        Viewing this restricted case body is recorded in the audit log.
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A5 Blotter Case</p>
          <h1>{record.caseNumber}</h1>
          <p>
            {record.incidentType} · {MATNOG_BARANGAYS.find((item) => item.code === record.barangayId)?.name}
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/peace-order/blotter">
          <ArrowLeft size={15} /> Blotter
        </Link>
      </header>
      <div className={styles.detailGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Incident record</p>
              <h2>Case information</h2>
            </div>
            <span
              className={`${styles.badge} ${record.status === "Closed" ? styles.active : record.priority === "High" ? styles.danger : styles.warning}`}
            >
              {record.status}
            </span>
          </div>
          <dl className={styles.dataList}>
            <div className={styles.dataRow}>
              <dt>Incident</dt>
              <dd>
                {record.incidentType} · {new Date(record.incidentAt).toLocaleString("en-PH")}
              </dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Location</dt>
              <dd>
                <MapPin size={13} /> {record.location} ({record.latitude.toFixed(4)}, {record.longitude.toFixed(4)})
              </dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Complainant</dt>
              <dd>
                {record.complainant.fullName} · {record.complainant.kind}
                <br />
                {record.complainant.address}
              </dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Respondent</dt>
              <dd>
                {record.respondent.fullName} · {record.respondent.kind}
                <br />
                {record.respondent.address}
              </dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Assigned officer</dt>
              <dd>{record.assignedOfficer}</dd>
            </div>
            <div className={styles.dataRow}>
              <dt>Narrative</dt>
              <dd>{record.narrative}</dd>
            </div>
            {record.resolution && (
              <div className={styles.dataRow}>
                <dt>Resolution</dt>
                <dd>{record.resolution}</dd>
              </div>
            )}
          </dl>
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Case controls</p>
              <h2>Update status</h2>
            </div>
          </div>
          {record.status !== "Closed" && (
            <>
              <label className={styles.field}>
                <span>Case note</span>
                <textarea rows={5} value={note} onChange={(event) => setNote(event.target.value)} />
              </label>
              <div className={styles.headerButtonGroup}>
                {record.status === "Filed" && (
                  <button className={styles.primaryButton} type="button" onClick={() => move("Under Investigation")}>
                    <Search size={15} /> Start investigation
                  </button>
                )}
                {record.status === "Under Investigation" && (
                  <button className={styles.primaryButton} type="button" onClick={() => move("Referred to Lupon")}>
                    <Scale size={15} /> Refer to Lupon
                  </button>
                )}
                <button className={styles.secondaryButton} type="button" onClick={() => move("Closed")}>
                  <CheckCircle2 size={15} /> Close case
                </button>
              </div>
            </>
          )}
          {record.status === "Closed" && (
            <div className={peaceStyles.partySelected}>
              <CheckCircle2 size={18} /> Case closed
              <br />
              <small>{record.resolution}</small>
            </div>
          )}
        </aside>
      </div>
      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Accountability</p>
            <h2>Case audit trail</h2>
          </div>
          <span className={`${styles.badge} ${styles.info}`}>{record.auditTrail.length} events</span>
        </div>
        <div className={peaceStyles.caseTimeline}>
          {[...record.auditTrail].reverse().map((event) => (
            <article key={event.id}>
              <strong>{event.action}</strong>
              <p>{event.note}</p>
              <small>
                {event.actor} · {new Date(event.occurredAt).toLocaleString("en-PH")}
              </small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
