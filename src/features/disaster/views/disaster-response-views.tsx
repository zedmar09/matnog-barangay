"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  BadgeCheck,
  Boxes,
  Camera,
  CircleDollarSign,
  ClipboardCheck,
  HousePlug,
  PackageCheck,
  Search,
  ShieldAlert,
  TriangleAlert,
  UsersRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useDisasterStore } from "../stores/disaster-store";
import type { DamageAssessment, ReliefDistribution } from "../types/disaster";
import disasterStyles from "./disaster.module.css";

const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
const dateTime = (value: string) => (value ? new Date(value).toLocaleString("en-PH") : "—");

function ReliefBadge({ status }: { status: ReliefDistribution["status"] }) {
  return (
    <span
      className={`${styles.badge} ${status === "Released" ? styles.active : status === "Held" ? styles.danger : styles.warning}`}
    >
      {status}
    </span>
  );
}

export function ReliefDistributionView() {
  const distributions = useDisasterStore((state) => state.reliefDistributions);
  const centres = useDisasterStore((state) => state.centres);
  const releaseRelief = useDisasterStore((state) => state.releaseRelief);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [assistanceType, setAssistanceType] = useState("");
  const [message, setMessage] = useState("");
  const rows = useMemo(
    () =>
      distributions.filter(
        (item) =>
          (selectedBarangay === "all" || item.barangayId === selectedBarangay) &&
          (!status || item.status === status) &&
          (!assistanceType || item.assistanceType === assistanceType) &&
          (!search.trim() ||
            `${item.referenceNumber} ${item.householdNumber}`.toLowerCase().includes(search.toLowerCase())),
      ),
    [assistanceType, distributions, search, selectedBarangay, status],
  );
  const centreName = (id: string) => centres.find((item) => item.id === id)?.name ?? id;
  const released = rows.filter((item) => item.status === "Released");
  const totalValue = released.reduce((sum, item) => sum + item.estimatedValue, 0);
  return (
    <div className={styles.page}>
      {message && (
        <div className={message.startsWith("Blocked") ? disasterStyles.warningNotice : disasterStyles.successNotice}>
          {message.startsWith("Blocked") ? <ShieldAlert size={18} /> : <BadgeCheck size={18} />}
          {message}
        </div>
      )}
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A6 Accountable Assistance</p>
          <h1>Relief Distribution</h1>
          <p>{selectedBarangayName} releases with household-level duplicate blocking and audit details.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/disaster/manifest">
          <UsersRound size={15} /> Evacuation manifest
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <PackageCheck size={18} />
          </span>
          <div>
            <strong>{released.length}</strong>
            <span>Completed releases</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Boxes size={18} />
          </span>
          <div>
            <strong>{rows.filter((item) => item.status === "Scheduled").length}</strong>
            <span>Scheduled distributions</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ShieldAlert size={18} />
          </span>
          <div>
            <strong>{rows.filter((item) => item.status === "Held").length}</strong>
            <span>Duplicate holds</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CircleDollarSign size={18} />
          </span>
          <div>
            <strong>{money(totalValue)}</strong>
            <span>Released assistance value</span>
          </div>
        </div>
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reference or household"
              aria-label="Search relief ledger"
            />
          </label>
          <select
            className={styles.compactSelect}
            value={assistanceType}
            onChange={(event) => setAssistanceType(event.target.value)}
            aria-label="Assistance type"
          >
            <option value="">All assistance</option>
            <option>Food Pack</option>
            <option>Hygiene Kit</option>
            <option>Water</option>
            <option>Sleeping Kit</option>
            <option>Medical Kit</option>
          </select>
          <select
            className={styles.compactSelect}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Relief status"
          >
            <option value="">All statuses</option>
            <option>Scheduled</option>
            <option>Released</option>
            <option>Held</option>
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} ledger entries</strong>
          <span>Duplicate rule: activation + household + assistance type</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1300 }}>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Household</th>
                <th>Barangay</th>
                <th>Centre</th>
                <th>Assistance</th>
                <th>Quantity</th>
                <th>Value</th>
                <th>Status</th>
                <th>Released</th>
                <th>Released by / Hold reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 60).map((item) => (
                <tr key={item.id}>
                  <td className={styles.mono}>{item.referenceNumber}</td>
                  <td>
                    <Link className={styles.mono} href={`/barangay-affairs/households/${item.householdId}`}>
                      {item.householdNumber}
                    </Link>
                  </td>
                  <td>{barangayName(item.barangayId)}</td>
                  <td>{centreName(item.centreId)}</td>
                  <td>{item.assistanceType}</td>
                  <td>
                    {item.quantity} {item.unit}
                  </td>
                  <td>{money(item.estimatedValue)}</td>
                  <td>
                    <ReliefBadge status={item.status} />
                  </td>
                  <td>{dateTime(item.releasedAt)}</td>
                  <td>{item.holdReason || item.releasedBy || "—"}</td>
                  <td>
                    {item.status === "Scheduled" && (
                      <button
                        className={styles.primaryButton}
                        type="button"
                        onClick={() => setMessage(releaseRelief(item.id).message)}
                      >
                        <PackageCheck size={14} /> Release
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const damageBadge = (item: DamageAssessment) =>
  item.damageLevel === "Destroyed" ? styles.danger : item.damageLevel === "Major" ? styles.warning : styles.info;

export function DamageAssessmentView() {
  const assessments = useDisasterStore((state) => state.damageAssessments);
  const validate = useDisasterStore((state) => state.validateDamageAssessment);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [damageLevel, setDamageLevel] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const rows = useMemo(
    () =>
      assessments.filter(
        (item) =>
          (selectedBarangay === "all" || item.barangayId === selectedBarangay) &&
          (!damageLevel || item.damageLevel === damageLevel) &&
          (!status || item.status === status) &&
          (!search.trim() ||
            `${item.referenceNumber} ${item.structureCode} ${item.householdNumber}`
              .toLowerCase()
              .includes(search.toLowerCase())),
      ),
    [assessments, damageLevel, search, selectedBarangay, status],
  );
  const selected = assessments.find((item) => item.id === selectedId) ?? rows[0];
  const totalLoss = rows.reduce((sum, item) => sum + item.estimatedLoss, 0);
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A6 Rapid Damage Assessment</p>
          <h1>Damage Assessment</h1>
          <p>{selectedBarangayName} structure damage, habitability decisions, evidence, and validation.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/disaster/hazards">
          <TriangleAlert size={15} /> Hazard exposure
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ClipboardCheck size={18} />
          </span>
          <div>
            <strong>{rows.length}</strong>
            <span>Structures assessed</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <HousePlug size={18} />
          </span>
          <div>
            <strong>{rows.filter((item) => item.damageLevel === "Destroyed").length}</strong>
            <span>Destroyed structures</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ShieldAlert size={18} />
          </span>
          <div>
            <strong>{rows.filter((item) => item.habitability === "Unsafe").length}</strong>
            <span>Unsafe for occupancy</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CircleDollarSign size={18} />
          </span>
          <div>
            <strong>{money(totalLoss)}</strong>
            <span>Estimated structural loss</span>
          </div>
        </div>
      </div>
      <div className={disasterStyles.responseWorkspace}>
        <section className={styles.card}>
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reference, structure, or household"
                aria-label="Search damage assessments"
              />
            </label>
            <select
              className={styles.compactSelect}
              value={damageLevel}
              onChange={(event) => setDamageLevel(event.target.value)}
              aria-label="Damage level"
            >
              <option value="">All damage</option>
              <option>Minor</option>
              <option>Major</option>
              <option>Destroyed</option>
            </select>
            <select
              className={styles.compactSelect}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Assessment status"
            >
              <option value="">All statuses</option>
              <option>Pending Validation</option>
              <option>Validated</option>
            </select>
          </div>
          <div className={styles.resultsMeta}>
            <strong>{rows.length} assessments</strong>
            <span>Showing the first 60 records</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table} style={{ minWidth: 990 }}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Structure</th>
                  <th>Household</th>
                  <th>Barangay</th>
                  <th>Hazard</th>
                  <th>Damage</th>
                  <th>Habitability</th>
                  <th>Loss</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 60).map((item) => (
                  <tr key={item.id}>
                    <td className={styles.mono}>{item.referenceNumber}</td>
                    <td>
                      <Link className={styles.mono} href={`/barangay-affairs/structures/${item.structureId}`}>
                        {item.structureCode}
                      </Link>
                    </td>
                    <td>{item.householdNumber}</td>
                    <td>{barangayName(item.barangayId)}</td>
                    <td>{item.hazardType}</td>
                    <td>
                      <span className={`${styles.badge} ${damageBadge(item)}`}>{item.damageLevel}</span>
                    </td>
                    <td>{item.habitability}</td>
                    <td>{money(item.estimatedLoss)}</td>
                    <td>{item.status}</td>
                    <td>
                      <button className={styles.secondaryButton} type="button" onClick={() => setSelectedId(item.id)}>
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        {selected && (
          <aside className={disasterStyles.assessmentPanel}>
            <div className={disasterStyles.assessmentHero}>
              <span>
                <HousePlug size={22} />
              </span>
              <div>
                <small>{selected.referenceNumber}</small>
                <h2>{selected.structureCode}</h2>
                <p>Brgy. {barangayName(selected.barangayId)}</p>
              </div>
            </div>
            <div className={disasterStyles.assessmentBadges}>
              <span className={`${styles.badge} ${damageBadge(selected)}`}>{selected.damageLevel}</span>
              <span className={`${styles.badge} ${selected.habitability === "Unsafe" ? styles.danger : styles.info}`}>
                {selected.habitability}
              </span>
              <span className={`${styles.badge} ${selected.status === "Validated" ? styles.active : styles.warning}`}>
                {selected.status}
              </span>
            </div>
            <dl className={disasterStyles.assessmentFacts}>
              <div>
                <dt>Household</dt>
                <dd>{selected.householdNumber}</dd>
              </div>
              <div>
                <dt>Cause</dt>
                <dd>{selected.hazardType}</dd>
              </div>
              <div>
                <dt>Estimated loss</dt>
                <dd>{money(selected.estimatedLoss)}</dd>
              </div>
              <div>
                <dt>Evidence</dt>
                <dd>
                  <Camera size={13} /> {selected.evidenceCount} files
                </dd>
              </div>
              <div>
                <dt>Assessed by</dt>
                <dd>{selected.assessedBy}</dd>
              </div>
              <div>
                <dt>Assessed</dt>
                <dd>{dateTime(selected.assessedAt)}</dd>
              </div>
            </dl>
            <div className={disasterStyles.assessmentNotes}>
              <strong>Field notes</strong>
              <p>{selected.notes}</p>
            </div>
            {selected.status === "Validated" ? (
              <div className={disasterStyles.validationStamp}>
                <BadgeCheck size={18} />
                <span>
                  <strong>Validated</strong>
                  <small>
                    {selected.validatedBy} · {dateTime(selected.validatedAt)}
                  </small>
                </span>
              </div>
            ) : (
              <button className={styles.primaryButton} type="button" onClick={() => validate(selected.id)}>
                <BadgeCheck size={15} /> Validate assessment
              </button>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
