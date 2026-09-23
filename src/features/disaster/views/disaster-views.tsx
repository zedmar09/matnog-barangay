"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Home,
  MapPin,
  MapPinned,
  Search,
  Send,
  ShieldAlert,
  Siren,
  UsersRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useHouseholdRegistryStore } from "@/features/household-registry/stores/household-registry-store";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useDisasterStore } from "../stores/disaster-store";
import type {
  EvacuationEntry,
  EvacuationPriority,
  EvacuationStatus,
  HazardSeverity,
  HazardType,
} from "../types/disaster";
import disasterStyles from "./disaster.module.css";

const severityWeight: Record<HazardSeverity, number> = { Low: 1, Moderate: 2, High: 3, Severe: 4 };
const priorityClass = (priority: EvacuationPriority) =>
  priority === "Immediate"
    ? styles.danger
    : priority === "Priority"
      ? styles.warning
      : priority === "Prepare"
        ? styles.info
        : styles.active;
const severityClass = (severity: HazardSeverity) =>
  severity === "Severe"
    ? disasterStyles.severe
    : severity === "High"
      ? disasterStyles.high
      : severity === "Moderate"
        ? disasterStyles.moderate
        : disasterStyles.low;
const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;

export function DisasterDashboardView() {
  const hazards = useDisasterStore((state) => state.hazards);
  const entries = useDisasterStore((state) => state.evacuationEntries);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const scopedHazards = hazards.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const scoped = entries.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const exposedStructures = new Set(scopedHazards.map((item) => item.structureId)).size;
  const residents = scoped.reduce((total, item) => total + item.memberCount, 0);
  return (
    <div className={styles.page}>
      <div className={disasterStyles.advisory}>
        <Siren size={18} />
        <span>
          <strong>Preparedness monitoring active.</strong> Lists below are generated from current household
          vulnerability and structure exposure records.
        </span>
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A6 Disaster & Vulnerability</p>
          <h1>Disaster Operations Dashboard</h1>
          <p>{selectedBarangayName} hazard exposure and pre-emptive evacuation readiness.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/disaster/evacuation">
          <ClipboardList size={15} /> Open evacuation list
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <MapPinned size={18} />
          </span>
          <div>
            <strong>{exposedStructures}</strong>
            <span>Exposed structures</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Home size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>Households assessed</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <AlertTriangle size={18} />
          </span>
          <div>
            <strong>{scoped.filter((item) => item.priority === "Immediate").length}</strong>
            <span>Immediate evacuation</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <UsersRound size={18} />
          </span>
          <div>
            <strong>{residents}</strong>
            <span>Residents on derived list</span>
          </div>
        </div>
      </div>
      <div className={disasterStyles.dashboardGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Highest priority</p>
              <h2>Pre-emptive evacuation queue</h2>
            </div>
            <Link className={styles.secondaryButton} href="/barangay-affairs/disaster/evacuation">
              View all
            </Link>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table} style={{ minWidth: 830 }}>
              <thead>
                <tr>
                  <th>Household</th>
                  <th>Barangay</th>
                  <th>Exposure</th>
                  <th>Vulnerability</th>
                  <th>Members</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {scoped
                  .filter((item) => ["Immediate", "Priority"].includes(item.priority))
                  .slice(0, 12)
                  .map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link href={`/barangay-affairs/households/${item.householdId}`} className={styles.mono}>
                          {item.householdNumber}
                        </Link>
                      </td>
                      <td>{barangayName(item.barangayId)}</td>
                      <td>{item.hazards.join(", ")}</td>
                      <td>{item.vulnerabilityFlags.slice(0, 2).join(", ") || "General population"}</td>
                      <td>{item.memberCount}</td>
                      <td>
                        <span className={`${styles.badge} ${priorityClass(item.priority)}`}>{item.priority}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
        <aside className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Hazard layers</p>
              <h2>Exposure summary</h2>
            </div>
            <Link className={styles.secondaryButton} href="/barangay-affairs/disaster/hazards">
              Open map
            </Link>
          </div>
          <div className={disasterStyles.hazardList}>
            {(["Flood", "Landslide", "Storm Surge"] as HazardType[]).map((type) => {
              const rows = scopedHazards.filter((item) => item.hazardType === type);
              return (
                <div key={type}>
                  <strong>{type}</strong>
                  <strong>{new Set(rows.map((item) => item.structureId)).size}</strong>
                  <span>Exposed structures</span>
                  <small>
                    {rows.filter((item) => ["Severe", "High"].includes(item.severity)).length} high or severe
                  </small>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function HazardExposureMapView() {
  const hazards = useDisasterStore((state) => state.hazards);
  const structures = useHouseholdRegistryStore((state) => state.structures);
  const households = useHouseholdRegistryStore((state) => state.households);
  const { selectedBarangay } = useBarangayScope();
  const [hazardType, setHazardType] = useState<"" | HazardType>("");
  const [selectedId, setSelectedId] = useState("");
  const visibleStructures = structures
    .filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay)
    .filter((structure) =>
      hazards.some((item) => item.structureId === structure.id && (!hazardType || item.hazardType === hazardType)),
    );
  const selected = structures.find((item) => item.id === selectedId) ?? visibleStructures[0];
  const exposures = selected ? hazards.filter((item) => item.structureId === selected.id) : [];
  const selectedHouseholds = selected ? households.filter((item) => item.structureId === selected.id) : [];
  const minLat = Math.min(...visibleStructures.map((item) => item.latitude), 12.54);
  const maxLat = Math.max(...visibleStructures.map((item) => item.latitude), 12.64);
  const minLng = Math.min(...visibleStructures.map((item) => item.longitude), 124.04);
  const maxLng = Math.max(...visibleStructures.map((item) => item.longitude), 124.14);
  const position = (value: number, min: number, max: number) =>
    `${7 + ((value - min) / Math.max(0.0001, max - min)) * 84}%`;
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A6 Hazard Exposure</p>
          <h1>Hazard & Exposure Map</h1>
          <p>Structure coordinates joined to flood, landslide, and storm-surge layers.</p>
        </div>
        <select
          className={styles.compactSelect}
          aria-label="Hazard layer"
          value={hazardType}
          onChange={(event) => {
            setHazardType(event.target.value as "" | HazardType);
            setSelectedId("");
          }}
        >
          <option value="">All hazard layers</option>
          <option>Flood</option>
          <option>Landslide</option>
          <option>Storm Surge</option>
        </select>
      </header>
      <div className={styles.mapLayout}>
        <section className={disasterStyles.hazardMap} aria-label="Hazard exposure plot">
          {visibleStructures.map((structure) => {
            const relevant = hazards.filter(
              (item) => item.structureId === structure.id && (!hazardType || item.hazardType === hazardType),
            );
            const severity = relevant.reduce<HazardSeverity>(
              (current, item) => (severityWeight[item.severity] > severityWeight[current] ? item.severity : current),
              "Low",
            );
            return (
              <button
                type="button"
                key={structure.id}
                aria-label={`${structure.structureCode}, ${severity} exposure`}
                className={`${disasterStyles.hazardMarker} ${severityClass(severity)} ${selected?.id === structure.id ? disasterStyles.selected : ""}`}
                style={{
                  left: position(structure.longitude, minLng, maxLng),
                  bottom: position(structure.latitude, minLat, maxLat),
                }}
                onClick={() => setSelectedId(structure.id)}
              >
                <Home size={11} />
              </button>
            );
          })}
          <div className={disasterStyles.mapLegend}>
            <span>
              <i className={disasterStyles.severe} /> Severe
            </span>
            <span>
              <i className={disasterStyles.high} /> High
            </span>
            <span>
              <i className={disasterStyles.moderate} /> Moderate
            </span>
            <span>
              <i className={disasterStyles.low} /> Low
            </span>
            <strong>{visibleStructures.length} exposed structures</strong>
          </div>
        </section>
        <aside className={`${styles.card} ${styles.mapDetails}`}>
          {selected ? (
            <>
              <div className={styles.mapDetailsHeader}>
                <span>
                  <MapPin size={19} />
                </span>
                <div>
                  <p className={styles.eyebrow}>Selected structure</p>
                  <h2>{selected.structureCode}</h2>
                </div>
              </div>
              <p>
                {selected.houseNumber} {selected.street}, {barangayName(selected.barangayId)}
              </p>
              <dl className={styles.accessFacts}>
                <div>
                  <dt>Coordinates</dt>
                  <dd>
                    {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
                  </dd>
                </div>
                <div>
                  <dt>Households</dt>
                  <dd>{selectedHouseholds.length}</dd>
                </div>
                <div>
                  <dt>Residents</dt>
                  <dd>{selectedHouseholds.reduce((sum, item) => sum + item.members.length, 0)}</dd>
                </div>
              </dl>
              <div className={disasterStyles.hazardList}>
                {exposures.map((item) => (
                  <div key={item.hazardType}>
                    <strong>{item.hazardType}</strong>
                    <span
                      className={`${styles.badge} ${item.severity === "Severe" ? styles.danger : item.severity === "High" ? styles.warning : styles.info}`}
                    >
                      {item.severity}
                    </span>
                  </div>
                ))}
              </div>
              <Link className={styles.primaryButton} href={`/barangay-affairs/structures/${selected.id}`}>
                View structure
              </Link>
            </>
          ) : (
            <div className={styles.empty}>
              <h3>No exposed structure</h3>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function HouseholdOperationalTable({ mode }: { mode: "vulnerable" | "evacuation" }) {
  const entries = useDisasterStore((state) => state.evacuationEntries);
  const updateStatus = useDisasterStore((state) => state.updateEvacuationStatus);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [hazard, setHazard] = useState("");
  const rows = useMemo(
    () =>
      entries.filter(
        (item) =>
          (selectedBarangay === "all" || item.barangayId === selectedBarangay) &&
          (mode === "evacuation" || item.vulnerabilityFlags.length > 0) &&
          (!priority || item.priority === priority) &&
          (!hazard || item.hazards.includes(hazard as HazardType)) &&
          (!search.trim() ||
            `${item.householdNumber} ${item.structureCode} ${item.address}`
              .toLowerCase()
              .includes(search.toLowerCase())),
      ),
    [entries, hazard, mode, priority, search, selectedBarangay],
  );
  const nextStatus = (item: EvacuationEntry): EvacuationStatus =>
    item.status === "For Notification" ? "Notified" : item.status === "Notified" ? "Ready" : "Evacuated";
  return (
    <section className={styles.card}>
      <div className={styles.toolbar}>
        <label className={styles.searchBox}>
          <Search size={15} />
          <input
            aria-label="Search operational households"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search household, structure, or address"
          />
        </label>
        <select
          className={styles.compactSelect}
          aria-label="Evacuation priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
        >
          <option value="">All priorities</option>
          <option>Immediate</option>
          <option>Priority</option>
          <option>Prepare</option>
          <option>Monitor</option>
        </select>
        <select
          className={styles.compactSelect}
          aria-label="Hazard exposure"
          value={hazard}
          onChange={(event) => setHazard(event.target.value)}
        >
          <option value="">All hazards</option>
          <option>Flood</option>
          <option>Landslide</option>
          <option>Storm Surge</option>
        </select>
      </div>
      <div className={styles.resultsMeta}>
        <strong>{rows.length} households</strong>
        <span>Showing the first 60 · generated from live household and structure records</span>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table} style={{ minWidth: 1280 }}>
          <thead>
            <tr>
              <th>Household</th>
              <th>Structure</th>
              <th>Barangay</th>
              <th>Address</th>
              <th>Members</th>
              <th>Vulnerability</th>
              <th>Exposure</th>
              <th>Priority</th>
              {mode === "evacuation" && (
                <>
                  <th>Status</th>
                  <th>Action</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 60).map((item) => (
              <tr key={item.id}>
                <td>
                  <Link className={styles.mono} href={`/barangay-affairs/households/${item.householdId}`}>
                    {item.householdNumber}
                  </Link>
                </td>
                <td className={styles.mono}>{item.structureCode}</td>
                <td>{barangayName(item.barangayId)}</td>
                <td>{item.address}</td>
                <td>{item.memberCount}</td>
                <td>
                  <div className={disasterStyles.flagList}>
                    {item.vulnerabilityFlags.length ? (
                      item.vulnerabilityFlags.map((flag) => <span key={flag}>{flag}</span>)
                    ) : (
                      <span>General population</span>
                    )}
                  </div>
                </td>
                <td>
                  {item.hazards.join(", ")}
                  <br />
                  <small>{item.highestSeverity}</small>
                </td>
                <td>
                  <span className={`${styles.badge} ${priorityClass(item.priority)}`}>{item.priority}</span>
                </td>
                {mode === "evacuation" && (
                  <>
                    <td>
                      <span className={`${styles.badge} ${item.status === "Evacuated" ? styles.active : styles.info}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {item.status !== "Evacuated" && (
                        <button
                          className={styles.primaryButton}
                          type="button"
                          onClick={() => updateStatus(item.id, nextStatus(item))}
                        >
                          {item.status === "Ready" ? <CheckCircle2 size={14} /> : <Send size={14} />}
                          {nextStatus(item)}
                        </button>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function VulnerableHouseholdsView() {
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A6 Derived Operational List</p>
          <h1>Vulnerable Households</h1>
          <p>Households with vulnerability flags, joined to current hazard exposure.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/disaster/evacuation">
          <Siren size={15} /> Evacuation list
        </Link>
      </header>
      <HouseholdOperationalTable mode="vulnerable" />
    </div>
  );
}

export function PreemptiveEvacuationView() {
  return (
    <div className={styles.page}>
      <div className={disasterStyles.advisory}>
        <ShieldAlert size={18} />
        This list updates from household vulnerability and structure hazard exposure; status changes are operational for
        the current activation.
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A6 Pre-emptive Evacuation</p>
          <h1>Evacuation Priority List</h1>
          <p>Notify, prepare, and track households by derived priority.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/disaster/hazards">
          <MapPinned size={15} /> Hazard map
        </Link>
      </header>
      <HouseholdOperationalTable mode="evacuation" />
    </div>
  );
}
