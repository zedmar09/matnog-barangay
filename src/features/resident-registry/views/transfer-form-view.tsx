"use client";

import { type FormEvent, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, CalendarDays, FileText, MapPin, Search, Send, UserRound } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
import { formatResidentAddress, formatResidentName } from "../utils/resident-utils";

export function TransferFormView() {
  const residents = useResidentRegistryStore((s) => s.residents);
  const initiate = useResidentRegistryStore((s) => s.initiateTransfer);
  const { selectedBarangay } = useBarangayScope();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [residentId, setResidentId] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("2026-09-23");
  const [reason, setReason] = useState("");
  const [documents, setDocuments] = useState(0);
  const [error, setError] = useState("");
  const selected = residents.find((r) => r.id === residentId);
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return residents
      .filter(
        (r) =>
          (selectedBarangay === "all" || r.address.barangayId === selectedBarangay) &&
          r.residentStatus === "Active" &&
          `${r.lrn} ${formatResidentName(r)} ${r.contact.primaryMobile}`.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [residents, query, selectedBarangay]);
  const barangay = (id: string) => MATNOG_BARANGAYS.find((b) => b.code === id)?.name ?? "—";
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !destination || destination === selected.address.barangayId || !date || !reason.trim()) {
      setError("Select a resident, a different destination barangay, an effective date, and a transfer reason.");
      return;
    }
    const transfer = initiate({
      residentId: selected.id,
      destinationBarangayId: destination,
      requestedEffectiveDate: date,
      reason,
      supportingDocumentCount: documents,
    });
    if (transfer) router.push(`/barangay-affairs/residents/transfers/${transfer.id}?created=1`);
  };
  return (
    <div className={`${styles.page} ${styles.formShell}`}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A1 Residency Management</p>
          <h1>Initiate inter-barangay transfer</h1>
          <p>The resident keeps the same permanent LRN throughout the transfer.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/residents/transfers">
          <ArrowLeft size={15} /> Transfer queue
        </Link>
      </header>
      {error && <div className={`${styles.toast} ${styles.error}`}>{error}</div>}
      <form className={styles.card} onSubmit={submit}>
        <div className={styles.formBody}>
          <h2 className={styles.sectionTitle}>Select resident</h2>
          <p className={styles.sectionHelp}>
            Search active residents by name, LRN, or mobile number. The current barangay becomes the origin.
          </p>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Find resident"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Start typing a resident name or LRN"
            />
          </label>
          {query && !selected && (
            <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
              {results.map((r) => (
                <button
                  type="button"
                  className={styles.decisionOption}
                  key={r.id}
                  onClick={() => {
                    setResidentId(r.id);
                    setQuery(formatResidentName(r));
                  }}
                >
                  <span className={styles.avatarSm}>
                    {r.firstName[0]}
                    {r.lastName[0]}
                  </span>
                  <span>
                    <strong>{formatResidentName(r)}</strong>
                    <small>
                      {r.lrn} · Brgy. {barangay(r.address.barangayId)}
                    </small>
                  </span>
                </button>
              ))}
              {results.length === 0 && (
                <p className={styles.sectionHelp}>No matching active residents found in the current scope.</p>
              )}
            </div>
          )}
          {selected && (
            <div className={styles.reviewGrid} style={{ marginTop: 16 }}>
              <section className={styles.reviewCard}>
                <h3>
                  <UserRound size={15} /> Resident identity
                </h3>
                <dl className={styles.dataList}>
                  <div className={styles.dataRow}>
                    <dt>Full name</dt>
                    <dd>{formatResidentName(selected)}</dd>
                  </div>
                  <div className={styles.dataRow}>
                    <dt>Permanent LRN</dt>
                    <dd className={styles.mono}>{selected.lrn}</dd>
                  </div>
                  <div className={styles.dataRow}>
                    <dt>Current address</dt>
                    <dd>{formatResidentAddress(selected.address)}</dd>
                  </div>
                </dl>
              </section>
              <section className={styles.reviewCard}>
                <h3>
                  <MapPin size={15} /> Transfer route
                </h3>
                <div className={styles.formGrid} style={{ gridTemplateColumns: "1fr" }}>
                  <label className={styles.field}>
                    <span>Origin barangay</span>
                    <input value={barangay(selected.address.barangayId)} readOnly />
                  </label>
                  <label className={styles.field}>
                    <span>Destination barangay *</span>
                    <select
                      aria-label="Destination barangay"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      required
                    >
                      <option value="">Select destination</option>
                      {MATNOG_BARANGAYS.filter((b) => b.code !== selected.address.barangayId).map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>
            </div>
          )}
          <h2 className={styles.sectionTitle} style={{ marginTop: 22 }}>
            Transfer details
          </h2>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Requested effective date *</span>
              <input
                aria-label="Requested effective date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Supporting documents</span>
              <input
                aria-label="Supporting documents"
                type="number"
                min="0"
                max="20"
                value={documents}
                onChange={(e) => setDocuments(Number(e.target.value))}
              />
              <small>Temporary document count for this UI phase.</small>
            </label>
            <label className={`${styles.field} ${styles.span3}`}>
              <span>Transfer reason *</span>
              <textarea
                aria-label="Transfer reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why the resident is transferring"
                required
              />
            </label>
          </div>
          <div className={styles.mergeBanner} style={{ marginTop: 16 }}>
            <FileText size={18} />
            <div>
              <strong>Origin release and destination acceptance are both required.</strong>
              <span>Submitting creates a request only. It does not change the resident’s active barangay.</span>
            </div>
          </div>
        </div>
        <footer className={styles.formFooter}>
          <span className={styles.sectionHelp}>
            <CalendarDays size={13} /> Session-only transaction
          </span>
          <button type="submit" className={styles.primaryButton}>
            <Send size={14} /> Submit transfer request
          </button>
        </footer>
      </form>
    </div>
  );
}
