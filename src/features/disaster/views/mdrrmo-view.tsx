"use client";

import { type CSSProperties, useMemo, useState } from "react";

import Link from "next/link";

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Download,
  HousePlug,
  MapPinned,
  PackageCheck,
  Search,
  ShieldAlert,
  Siren,
  UsersRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";

import { useDisasterStore } from "../stores/disaster-store";
import type { HazardType } from "../types/disaster";
import disasterStyles from "./disaster.module.css";

const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);

type BarangayCommandRow = {
  id: string;
  name: string;
  exposedStructures: number;
  immediateHouseholds: number;
  assessedHouseholds: number;
  checkedInPeople: number;
  expectedHouseholds: number;
  centreStatus: string;
  centreOccupancy: number;
  centreCapacity: number;
  reliefReleases: number;
  duplicateHolds: number;
  destroyedStructures: number;
  pendingAssessments: number;
  estimatedLoss: number;
  readiness: number;
};

export function MdrrmoView() {
  const hazards = useDisasterStore((state) => state.hazards);
  const entries = useDisasterStore((state) => state.evacuationEntries);
  const centres = useDisasterStore((state) => state.centres);
  const manifest = useDisasterStore((state) => state.manifest);
  const relief = useDisasterStore((state) => state.reliefDistributions);
  const assessments = useDisasterStore((state) => state.damageAssessments);
  const [search, setSearch] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(false);

  const rows = useMemo<BarangayCommandRow[]>(
    () =>
      MATNOG_BARANGAYS.map((barangay) => {
        const barangayHazards = hazards.filter((item) => item.barangayId === barangay.code);
        const barangayEntries = entries.filter((item) => item.barangayId === barangay.code);
        const barangayManifest = manifest.filter((item) => item.barangayId === barangay.code);
        const centre = centres.find((item) => item.barangayId === barangay.code);
        const checkedInPeople = barangayManifest
          .filter((item) => item.status === "Checked In")
          .reduce((sum, item) => sum + item.memberCount, 0);
        const expectedHouseholds = barangayManifest.filter((item) => item.status === "Expected").length;
        const barangayRelief = relief.filter((item) => item.barangayId === barangay.code);
        const barangayDamage = assessments.filter((item) => item.barangayId === barangay.code);
        const immediateHouseholds = barangayEntries.filter((item) => item.priority === "Immediate").length;
        const pendingAssessments = barangayDamage.filter((item) => item.status === "Pending Validation").length;
        const duplicateHolds = barangayRelief.filter((item) => item.status === "Held").length;
        const centreCapacity = centre?.capacity ?? 0;
        const occupancyPercent = centreCapacity ? Math.min(100, (checkedInPeople / centreCapacity) * 100) : 0;
        const validationRate = barangayDamage.length
          ? ((barangayDamage.length - pendingAssessments) / barangayDamage.length) * 100
          : 100;
        const notificationRate = barangayEntries.length
          ? (barangayEntries.filter((item) => item.status !== "For Notification").length / barangayEntries.length) * 100
          : 100;
        const readiness = Math.max(
          0,
          Math.round(
            notificationRate * 0.35 +
              validationRate * 0.25 +
              (centre?.status === "Open" ? 25 : 12) +
              Math.min(15, occupancyPercent),
          ),
        );
        return {
          id: barangay.code,
          name: barangay.name,
          exposedStructures: new Set(barangayHazards.map((item) => item.structureId)).size,
          immediateHouseholds,
          assessedHouseholds: barangayEntries.length,
          checkedInPeople,
          expectedHouseholds,
          centreStatus: centre?.status ?? "Unregistered",
          centreOccupancy: checkedInPeople,
          centreCapacity,
          reliefReleases: barangayRelief.filter((item) => item.status === "Released").length,
          duplicateHolds,
          destroyedStructures: barangayDamage.filter((item) => item.damageLevel === "Destroyed").length,
          pendingAssessments,
          estimatedLoss: barangayDamage.reduce((sum, item) => sum + item.estimatedLoss, 0),
          readiness,
        };
      }),
    [assessments, centres, entries, hazards, manifest, relief],
  );

  const filteredRows = rows.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) &&
      (!attentionOnly ||
        item.immediateHouseholds > 0 ||
        item.pendingAssessments > 0 ||
        item.duplicateHolds > 0 ||
        item.centreStatus !== "Open"),
  );
  const checkedInPeople = manifest
    .filter((item) => item.status === "Checked In")
    .reduce((sum, item) => sum + item.memberCount, 0);
  const totalManifestPeople = manifest.reduce((sum, item) => sum + item.memberCount, 0);
  const totalCapacity = centres.reduce((sum, item) => sum + item.capacity, 0);
  const releasedRelief = relief.filter((item) => item.status === "Released");
  const validatedAssessments = assessments.filter((item) => item.status === "Validated").length;
  const hazardsByType = (["Flood", "Landslide", "Storm Surge"] as HazardType[]).map((type) => ({
    type,
    value: new Set(hazards.filter((item) => item.hazardType === type).map((item) => item.structureId)).size,
  }));
  const maxHazard = Math.max(...hazardsByType.map((item) => item.value), 1);
  const urgentHouseholds = entries.filter(
    (item) => item.priority === "Immediate" && item.status !== "Evacuated",
  ).length;
  const pendingAssessments = assessments.length - validatedAssessments;
  const duplicateHolds = relief.filter((item) => item.status === "Held").length;
  const standbyCentres = centres.filter((item) => item.status !== "Open").length;
  const evacuationRate = Math.round((checkedInPeople / Math.max(1, totalManifestPeople)) * 100);

  const exportReport = () => {
    const headers = [
      "Barangay",
      "Exposed Structures",
      "Immediate Households",
      "Checked In People",
      "Expected Households",
      "Centre Status",
      "Centre Occupancy",
      "Centre Capacity",
      "Relief Releases",
      "Duplicate Holds",
      "Destroyed Structures",
      "Pending Assessments",
      "Estimated Loss",
      "Readiness Score",
    ];
    const lines = filteredRows.map((item) =>
      [
        item.name,
        item.exposedStructures,
        item.immediateHouseholds,
        item.checkedInPeople,
        item.expectedHouseholds,
        item.centreStatus,
        item.centreOccupancy,
        item.centreCapacity,
        item.reliefReleases,
        item.duplicateHolds,
        item.destroyedStructures,
        item.pendingAssessments,
        item.estimatedLoss,
        item.readiness,
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    );
    const blob = new Blob([[headers.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "matnog-mdrrmo-barangay-situation-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.page}>
      <div className={disasterStyles.commandBanner}>
        <span className={disasterStyles.commandIcon}>
          <Siren size={22} />
        </span>
        <div>
          <strong>Municipal Emergency Activation ACT-2026-09-23-01</strong>
          <span>Consolidated situation monitoring · All 40 Matnog barangays · Last generated just now</span>
        </div>
        <span className={`${styles.badge} ${styles.active}`}>ACTIVE</span>
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A6 Municipal Command View</p>
          <h1>MDRRMO Consolidated View</h1>
          <p>Municipal operations, resource status, damage intelligence, and barangay readiness in one view.</p>
        </div>
        <button className={styles.primaryButton} type="button" onClick={exportReport}>
          <Download size={15} /> Export situation report
        </button>
      </header>
      <div className={disasterStyles.commandSummary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <MapPinned size={18} />
          </span>
          <div>
            <strong>{new Set(hazards.map((item) => item.structureId)).size}</strong>
            <span>Exposed structures</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <UsersRound size={18} />
          </span>
          <div>
            <strong>{checkedInPeople}</strong>
            <span>People checked in</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Building2 size={18} />
          </span>
          <div>
            <strong>{Math.round((checkedInPeople / totalCapacity) * 100)}%</strong>
            <span>Municipal centre occupancy</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <PackageCheck size={18} />
          </span>
          <div>
            <strong>{releasedRelief.length}</strong>
            <span>Relief releases</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CircleDollarSign size={18} />
          </span>
          <div>
            <strong>{money(assessments.reduce((sum, item) => sum + item.estimatedLoss, 0))}</strong>
            <span>Estimated damage</span>
          </div>
        </div>
      </div>
      <div className={disasterStyles.commandGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Municipal picture</p>
              <h2>Operational progress</h2>
            </div>
          </div>
          <div className={disasterStyles.progressDashboard}>
            <div
              className={disasterStyles.progressRing}
              style={{ "--progress": `${evacuationRate * 3.6}deg` } as CSSProperties}
            >
              <span>
                <strong>{evacuationRate}%</strong>
                <small>evacuation</small>
              </span>
            </div>
            <div className={disasterStyles.progressMetrics}>
              <div>
                <span>Household notifications</span>
                <strong>
                  {entries.filter((item) => item.status !== "For Notification").length} / {entries.length}
                </strong>
              </div>
              <div>
                <span>Assessment validation</span>
                <strong>
                  {validatedAssessments} / {assessments.length}
                </strong>
              </div>
              <div>
                <span>Open evacuation centres</span>
                <strong>
                  {centres.filter((item) => item.status === "Open").length} / {centres.length}
                </strong>
              </div>
              <div>
                <span>Released relief value</span>
                <strong>{money(releasedRelief.reduce((sum, item) => sum + item.estimatedValue, 0))}</strong>
              </div>
            </div>
          </div>
        </section>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Exposure</p>
              <h2>Hazard footprint</h2>
            </div>
            <Link className={styles.secondaryButton} href="/barangay-affairs/disaster/hazards">
              Open map
            </Link>
          </div>
          <div className={disasterStyles.hazardBars}>
            {hazardsByType.map((item) => (
              <div key={item.type}>
                <span>
                  <strong>{item.type}</strong>
                  <small>{item.value} structures</small>
                </span>
                <i>
                  <b style={{ width: `${(item.value / maxHazard) * 100}%` }} />
                </i>
              </div>
            ))}
          </div>
        </section>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Needs action</p>
              <h2>Command alerts</h2>
            </div>
          </div>
          <div className={disasterStyles.commandAlerts}>
            <Link href="/barangay-affairs/disaster/evacuation">
              <AlertTriangle size={17} />
              <span>
                <strong>{urgentHouseholds} immediate households</strong>
                <small>Not yet marked evacuated</small>
              </span>
            </Link>
            <Link href="/barangay-affairs/disaster/damage-assessment">
              <ClipboardCheck size={17} />
              <span>
                <strong>{pendingAssessments} assessments</strong>
                <small>Awaiting municipal validation</small>
              </span>
            </Link>
            <Link href="/barangay-affairs/disaster/relief">
              <ShieldAlert size={17} />
              <span>
                <strong>{duplicateHolds} relief holds</strong>
                <small>Blocked duplicate releases</small>
              </span>
            </Link>
            <Link href="/barangay-affairs/disaster/evacuation-centres">
              <Building2 size={17} />
              <span>
                <strong>{standbyCentres} standby centres</strong>
                <small>Review activation readiness</small>
              </span>
            </Link>
          </div>
        </section>
      </div>
      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>40-barangay situation matrix</p>
            <h2>Barangay readiness and impact</h2>
          </div>
          <span className={disasterStyles.reportTimestamp}>ACT-2026-09-23-01</span>
        </div>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search barangay"
              aria-label="Search barangay situation matrix"
            />
          </label>
          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={attentionOnly}
              onChange={(event) => setAttentionOnly(event.target.checked)}
            />
            Needs attention only
          </label>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{filteredRows.length} barangays</strong>
          <span>Readiness combines notification, validation, centre activation, and occupancy progress</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1450 }}>
            <thead>
              <tr>
                <th>Barangay</th>
                <th>Exposed</th>
                <th>Immediate HH</th>
                <th>Checked-in people</th>
                <th>Expected HH</th>
                <th>Centre</th>
                <th>Occupancy</th>
                <th>Relief releases</th>
                <th>Duplicate holds</th>
                <th>Destroyed</th>
                <th>Pending validation</th>
                <th>Estimated loss</th>
                <th>Readiness</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>{item.exposedStructures}</td>
                  <td>{item.immediateHouseholds}</td>
                  <td>{item.checkedInPeople}</td>
                  <td>{item.expectedHouseholds}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${item.centreStatus === "Open" ? styles.active : styles.warning}`}
                    >
                      {item.centreStatus}
                    </span>
                  </td>
                  <td>
                    {item.centreOccupancy} / {item.centreCapacity}
                  </td>
                  <td>{item.reliefReleases}</td>
                  <td>{item.duplicateHolds || "—"}</td>
                  <td>{item.destroyedStructures}</td>
                  <td>{item.pendingAssessments}</td>
                  <td>{money(item.estimatedLoss)}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${item.readiness >= 70 ? styles.active : item.readiness >= 50 ? styles.warning : styles.danger}`}
                    >
                      {item.readiness}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className={disasterStyles.commandFooter}>
        <CheckCircle2 size={15} /> Data is consolidated from the current A2 household, structure, evacuation, relief,
        and damage records.
        <HousePlug size={15} /> {assessments.filter((item) => item.habitability === "Unsafe").length} unsafe structures.
      </div>
    </div>
  );
}
