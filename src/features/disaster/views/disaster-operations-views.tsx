"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  DoorOpen,
  LogOut,
  Printer,
  QrCode,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useDisasterStore } from "../stores/disaster-store";
import type { EvacuationCentre, ManifestStatus } from "../types/disaster";
import disasterStyles from "./disaster.module.css";

const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;
const dateTime = (value: string) => (value ? new Date(value).toLocaleString("en-PH") : "—");

function CentreSummary({ centres }: { centres: EvacuationCentre[] }) {
  const manifest = useDisasterStore((state) => state.manifest);
  const centreIds = new Set(centres.map((item) => item.id));
  const checkedIn = manifest.filter((item) => centreIds.has(item.centreId) && item.status === "Checked In");
  const occupancy = checkedIn.reduce((sum, item) => sum + item.memberCount, 0);
  const capacity = centres.reduce((sum, item) => sum + item.capacity, 0);
  return (
    <div className={styles.summaryGrid}>
      <div className={styles.summaryCard}>
        <span className={styles.summaryIcon}>
          <Building2 size={18} />
        </span>
        <div>
          <strong>{centres.length}</strong>
          <span>Registered centres</span>
        </div>
      </div>
      <div className={styles.summaryCard}>
        <span className={styles.summaryIcon}>
          <DoorOpen size={18} />
        </span>
        <div>
          <strong>{centres.filter((item) => item.status === "Open").length}</strong>
          <span>Open centres</span>
        </div>
      </div>
      <div className={styles.summaryCard}>
        <span className={styles.summaryIcon}>
          <UsersRound size={18} />
        </span>
        <div>
          <strong>{occupancy}</strong>
          <span>People checked in</span>
        </div>
      </div>
      <div className={styles.summaryCard}>
        <span className={styles.summaryIcon}>
          <ShieldCheck size={18} />
        </span>
        <div>
          <strong>{capacity ? Math.round((occupancy / capacity) * 100) : 0}%</strong>
          <span>{capacity.toLocaleString()} total capacity</span>
        </div>
      </div>
    </div>
  );
}

export function EvacuationCentresView() {
  const centres = useDisasterStore((state) => state.centres);
  const manifest = useDisasterStore((state) => state.manifest);
  const updateStatus = useDisasterStore((state) => state.updateCentreStatus);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const rows = centres.filter(
    (item) =>
      (selectedBarangay === "all" || item.barangayId === selectedBarangay) &&
      (!status || item.status === status) &&
      (!search.trim() || `${item.code} ${item.name} ${item.address}`.toLowerCase().includes(search.toLowerCase())),
  );
  const occupancy = (centreId: string) =>
    manifest
      .filter((item) => item.centreId === centreId && item.status === "Checked In")
      .reduce((sum, item) => sum + item.memberCount, 0);
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A6 Facility Readiness</p>
          <h1>Evacuation Centres</h1>
          <p>{selectedBarangayName} capacity, occupancy, facilities, and operating status.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/disaster/manifest">
          <UsersRound size={15} /> Open manifest
        </Link>
      </header>
      <CentreSummary centres={rows} />
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search centre, code, or address"
              aria-label="Search evacuation centres"
            />
          </label>
          <select
            className={styles.compactSelect}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Centre status"
          >
            <option value="">All statuses</option>
            <option>Open</option>
            <option>Standby</option>
            <option>Full</option>
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} centres</strong>
          <span>Occupancy is calculated from checked-in manifest members</span>
        </div>
        <div className={disasterStyles.centreGrid}>
          {rows.map((centre) => {
            const occupants = occupancy(centre.id);
            const percentage = Math.min(100, Math.round((occupants / centre.capacity) * 100));
            return (
              <article className={disasterStyles.centreCard} key={centre.id}>
                <div className={disasterStyles.centreHeader}>
                  <span className={disasterStyles.centreIcon}>
                    <Building2 size={19} />
                  </span>
                  <div>
                    <small>{centre.code}</small>
                    <h2>{centre.name}</h2>
                    <p>{centre.address}</p>
                  </div>
                  <span
                    className={`${styles.badge} ${centre.status === "Open" ? styles.active : centre.status === "Full" ? styles.danger : styles.warning}`}
                  >
                    {centre.status}
                  </span>
                </div>
                <div className={disasterStyles.capacityLine}>
                  <span>
                    <strong>{occupants}</strong> of {centre.capacity} people
                  </span>
                  <span>{percentage}% occupied</span>
                </div>
                <div className={disasterStyles.progressTrack}>
                  <i style={{ width: `${percentage}%` }} />
                </div>
                <dl className={disasterStyles.centreFacts}>
                  <div>
                    <dt>Manager</dt>
                    <dd>{centre.manager}</dd>
                  </div>
                  <div>
                    <dt>Contact</dt>
                    <dd>{centre.contactNumber}</dd>
                  </div>
                </dl>
                <div className={disasterStyles.flagList}>
                  {centre.facilities.map((facility) => (
                    <span key={facility}>{facility}</span>
                  ))}
                </div>
                <div className={disasterStyles.cardActions}>
                  <Link
                    className={styles.secondaryButton}
                    href={`/barangay-affairs/disaster/manifest?centre=${centre.id}`}
                  >
                    View manifest
                  </Link>
                  <button
                    className={styles.primaryButton}
                    type="button"
                    onClick={() => updateStatus(centre.id, centre.status === "Open" ? "Standby" : "Open")}
                  >
                    {centre.status === "Open" ? "Set standby" : "Open centre"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function EvacuationManifestView() {
  const manifest = useDisasterStore((state) => state.manifest);
  const centres = useDisasterStore((state) => state.centres);
  const updateStatus = useDisasterStore((state) => state.updateManifestStatus);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [centre, setCentre] = useState("");
  const [status, setStatus] = useState("");
  useEffect(() => {
    const requestedCentre = new URLSearchParams(window.location.search).get("centre");
    if (requestedCentre && centres.some((item) => item.id === requestedCentre)) setCentre(requestedCentre);
  }, [centres]);
  const rows = useMemo(
    () =>
      manifest.filter(
        (item) =>
          (selectedBarangay === "all" || item.barangayId === selectedBarangay) &&
          (!centre || item.centreId === centre) &&
          (!status || item.status === status) &&
          (!search.trim() || item.householdNumber.toLowerCase().includes(search.toLowerCase())),
      ),
    [centre, manifest, search, selectedBarangay, status],
  );
  const scopedCentres = centres.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const members = (state: ManifestStatus) =>
    rows.filter((item) => item.status === state).reduce((sum, item) => sum + item.memberCount, 0);
  const centreName = (id: string) => centres.find((item) => item.id === id)?.name ?? id;
  return (
    <div className={styles.page}>
      <div className={disasterStyles.advisory}>
        <CheckCircle2 size={18} />
        Check-in marks the connected evacuation household as evacuated. Check-out preserves both timestamps.
      </div>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A6 Live Occupancy</p>
          <h1>Evacuation Manifest</h1>
          <p>{selectedBarangayName} household arrivals, departures, and assigned centres.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/disaster/family-access-cards">
          <CreditCard size={15} /> Family cards
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        {(
          [
            ["Expected", rows.filter((item) => item.status === "Expected").length, "households expected"],
            ["Checked In", members("Checked In"), "people checked in"],
            ["Checked Out", members("Checked Out"), "people checked out"],
            ["Centres", new Set(rows.map((item) => item.centreId)).size, "assigned centres"],
          ] as const
        ).map(([label, value, note]) => (
          <div className={styles.summaryCard} key={label}>
            <span className={styles.summaryIcon}>
              {label === "Expected" ? <Clock3 size={18} /> : <UsersRound size={18} />}
            </span>
            <div>
              <strong>{value}</strong>
              <span>{note}</span>
            </div>
          </div>
        ))}
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search household number"
              aria-label="Search manifest"
            />
          </label>
          <select
            className={styles.compactSelect}
            value={centre}
            onChange={(event) => setCentre(event.target.value)}
            aria-label="Evacuation centre"
          >
            <option value="">All centres</option>
            {scopedCentres.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            className={styles.compactSelect}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Manifest status"
          >
            <option value="">All statuses</option>
            <option>Expected</option>
            <option>Checked In</option>
            <option>Checked Out</option>
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} household records</strong>
          <span>Showing the first 60 records</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1120 }}>
            <thead>
              <tr>
                <th>Household</th>
                <th>Barangay</th>
                <th>Centre</th>
                <th>Members</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Registered by</th>
                <th>Action</th>
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
                  <td>{barangayName(item.barangayId)}</td>
                  <td>{centreName(item.centreId)}</td>
                  <td>{item.memberCount}</td>
                  <td>{item.priority}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${item.status === "Checked In" ? styles.active : item.status === "Checked Out" ? styles.info : styles.warning}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td>{dateTime(item.checkedInAt)}</td>
                  <td>{dateTime(item.checkedOutAt)}</td>
                  <td>{item.registeredBy || "—"}</td>
                  <td>
                    {item.status !== "Checked Out" && (
                      <button
                        className={item.status === "Expected" ? styles.primaryButton : styles.secondaryButton}
                        type="button"
                        onClick={() => updateStatus(item.id, item.status === "Expected" ? "Checked In" : "Checked Out")}
                      >
                        {item.status === "Expected" ? <DoorOpen size={14} /> : <LogOut size={14} />}
                        {item.status === "Expected" ? "Check in" : "Check out"}
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

export function FamilyAccessCardsView() {
  const cards = useDisasterStore((state) => state.familyCards);
  const centres = useDisasterStore((state) => state.centres);
  const markPrinted = useDisasterStore((state) => state.markCardPrinted);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const rows = cards.filter(
    (item) =>
      (selectedBarangay === "all" || item.barangayId === selectedBarangay) &&
      (!search.trim() ||
        `${item.cardNumber} ${item.householdNumber} ${item.headName}`.toLowerCase().includes(search.toLowerCase())),
  );
  const selected = cards.find((item) => item.id === selectedId) ?? rows[0];
  const centre = centres.find((item) => item.id === selected?.centreId);
  const printCard = () => {
    if (!selected) return;
    markPrinted(selected.id);
    window.print();
  };
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A6 Household Identification</p>
          <h1>Family Access Cards</h1>
          <p>{selectedBarangayName} printable household cards for centre admission and relief validation.</p>
        </div>
        <button className={styles.primaryButton} type="button" disabled={!selected} onClick={printCard}>
          <Printer size={15} /> Print selected card
        </button>
      </header>
      <div className={disasterStyles.cardWorkspace}>
        <section className={styles.card}>
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search card, household, or head"
                aria-label="Search family access cards"
              />
            </label>
          </div>
          <div className={styles.resultsMeta}>
            <strong>{rows.length} active cards</strong>
            <span>{rows.filter((item) => item.printedAt).length} printed</span>
          </div>
          <div className={disasterStyles.cardList}>
            {rows.slice(0, 60).map((item) => (
              <button
                className={item.id === selected?.id ? disasterStyles.cardRowSelected : disasterStyles.cardRow}
                type="button"
                key={item.id}
                onClick={() => setSelectedId(item.id)}
              >
                <span className={disasterStyles.listIcon}>
                  <CreditCard size={17} />
                </span>
                <span>
                  <strong>{item.headName}</strong>
                  <small>{item.householdNumber}</small>
                </span>
                <span>
                  <strong>{item.cardNumber}</strong>
                  <small>{item.printedAt ? "Printed" : "Ready to print"}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
        <aside className={disasterStyles.cardPreviewPanel}>
          {selected && (
            <div className={disasterStyles.familyCard} data-family-access-card>
              <div className={disasterStyles.familyCardHeader}>
                <span>
                  <ShieldCheck size={24} />
                </span>
                <div>
                  <strong>MATNOG BRGYS</strong>
                  <small>Municipal Disaster Risk Reduction and Management</small>
                </div>
              </div>
              <div className={disasterStyles.familyCardTitle}>
                <span>FAMILY ACCESS CARD</span>
                <strong>{selected.cardNumber}</strong>
              </div>
              <div className={disasterStyles.familyCardBody}>
                <div>
                  <small>HOUSEHOLD HEAD</small>
                  <h2>{selected.headName}</h2>
                  <dl>
                    <div>
                      <dt>Household</dt>
                      <dd>{selected.householdNumber}</dd>
                    </div>
                    <div>
                      <dt>Barangay</dt>
                      <dd>Brgy. {barangayName(selected.barangayId)}</dd>
                    </div>
                    <div>
                      <dt>Members</dt>
                      <dd>{selected.memberCount} registered</dd>
                    </div>
                    <div>
                      <dt>Assigned centre</dt>
                      <dd>{centre?.name ?? "Barangay Evacuation Centre"}</dd>
                    </div>
                  </dl>
                </div>
                <div className={disasterStyles.qrBlock}>
                  <QrCode size={92} strokeWidth={1.35} />
                  <small>SCAN FOR STATUS</small>
                </div>
              </div>
              <div className={disasterStyles.familyCardFooter}>
                <span>Valid for emergency access and relief verification</span>
                <strong>{selected.status}</strong>
              </div>
            </div>
          )}
          <p className={disasterStyles.printNote}>
            The QR token identifies the card and should return status only when verification is connected to the API.
          </p>
        </aside>
      </div>
    </div>
  );
}
