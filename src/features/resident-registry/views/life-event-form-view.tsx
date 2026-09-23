"use client";

import { type FormEvent, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Baby, FileText, Search, Send } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
import type { LifeEventDetails, LifeEventType } from "../types/resident";
import { formatResidentName } from "../utils/resident-utils";

const blankDetails: LifeEventDetails = {
  proposedFirstName: "",
  proposedMiddleName: "",
  proposedLastName: "",
  proposedGender: "",
  proposedCivilStatus: "",
  proposedMarriedName: "",
  motherName: "",
  destination: "",
  causeOrBasis: "",
};
export function LifeEventFormView() {
  const residents = useResidentRegistryStore((s) => s.residents);
  const create = useResidentRegistryStore((s) => s.createLifeEvent);
  const { selectedBarangay } = useBarangayScope();
  const router = useRouter();
  const [eventType, setEventType] = useState<LifeEventType>("Marriage");
  const [query, setQuery] = useState("");
  const [residentId, setResidentId] = useState("");
  const [barangayId, setBarangayId] = useState(selectedBarangay === "all" ? "" : selectedBarangay);
  const [effectiveDate, setEffectiveDate] = useState("2026-09-23");
  const [registrationDate, setRegistrationDate] = useState("2026-09-23");
  const [documents, setDocuments] = useState(1);
  const [details, setDetails] = useState(blankDetails);
  const [error, setError] = useState("");
  const selected = residents.find((r) => r.id === residentId);
  const birth = eventType === "Birth";
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return residents
      .filter(
        (r) =>
          (selectedBarangay === "all" || r.address.barangayId === selectedBarangay) &&
          `${r.lrn} ${formatResidentName(r)} ${r.contact.primaryMobile}`.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, residents, selectedBarangay]);
  const setDetail = (key: keyof LifeEventDetails, value: string) => setDetails((v) => ({ ...v, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const birthNames = details.proposedFirstName.trim() && details.proposedLastName.trim() && details.proposedGender;
    if ((!birth && !selected) || !barangayId || !effectiveDate || !registrationDate || (birth && !birthNames)) {
      setError("Complete the required resident, event date, barangay, and event-specific fields.");
      return;
    }
    const created = create({
      residentId: birth ? "" : residentId,
      eventType,
      effectiveDate,
      registrationDate,
      barangayId,
      supportingDocumentCount: documents,
      details,
    });
    if (created) router.push(`/barangay-affairs/residents/life-events/${created.id}?created=1`);
  };
  return (
    <div className={`${styles.page} ${styles.formShell}`}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A1 Life Events</p>
          <h1>Record life event</h1>
          <p>Create a reviewable civil event. Resident information changes only after approval.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/residents/life-events">
          <ArrowLeft size={15} /> Life Events
        </Link>
      </header>
      {error && <div className={`${styles.toast} ${styles.error}`}>{error}</div>}
      <form className={styles.card} onSubmit={submit}>
        <div className={styles.formBody}>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Event type *</span>
              <select
                aria-label="Event type"
                value={eventType}
                onChange={(e) => {
                  setEventType(e.target.value as LifeEventType);
                  setResidentId("");
                  setQuery("");
                  setDetails(blankDetails);
                }}
              >
                {["Birth", "Death", "Marriage", "Civil Status Change", "Migration In", "Migration Out"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Effective date *</span>
              <input
                aria-label="Effective date"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Registration date *</span>
              <input
                aria-label="Registration date"
                type="date"
                value={registrationDate}
                onChange={(e) => setRegistrationDate(e.target.value)}
              />
            </label>
          </div>
          {!birth ? (
            <>
              <h2 className={styles.sectionTitle} style={{ marginTop: 22 }}>
                Resident
              </h2>
              <label className={styles.searchBox}>
                <Search size={15} />
                <input
                  aria-label="Find resident"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search resident by name, LRN, or mobile"
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
                        setBarangayId(r.address.barangayId);
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
                          {r.lrn} · {MATNOG_BARANGAYS.find((b) => b.code === r.address.barangayId)?.name}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className={styles.mergeBanner} style={{ marginTop: 18 }}>
              <Baby size={18} />
              <div>
                <strong>Birth approval creates a permanent resident identity.</strong>
                <span>The LRN is generated only after the reviewer approves this event.</span>
              </div>
            </div>
          )}
          <h2 className={styles.sectionTitle} style={{ marginTop: 22 }}>
            Event information
          </h2>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Barangay *</span>
              <select aria-label="Event barangay" value={barangayId} onChange={(e) => setBarangayId(e.target.value)}>
                <option value="">Select barangay</option>
                {MATNOG_BARANGAYS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
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
            </label>
            {birth && (
              <>
                <label className={styles.field}>
                  <span>Child first name *</span>
                  <input
                    aria-label="Child first name"
                    value={details.proposedFirstName}
                    onChange={(e) => setDetail("proposedFirstName", e.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>Child middle name</span>
                  <input
                    aria-label="Child middle name"
                    value={details.proposedMiddleName}
                    onChange={(e) => setDetail("proposedMiddleName", e.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>Child last name *</span>
                  <input
                    aria-label="Child last name"
                    value={details.proposedLastName}
                    onChange={(e) => setDetail("proposedLastName", e.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>Gender *</span>
                  <select
                    aria-label="Child gender"
                    value={details.proposedGender}
                    onChange={(e) => setDetail("proposedGender", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Mother’s maiden name</span>
                  <input
                    aria-label="Mother's maiden name"
                    value={details.motherName}
                    onChange={(e) => setDetail("motherName", e.target.value)}
                  />
                </label>
              </>
            )}
            {eventType === "Marriage" && (
              <label className={styles.field}>
                <span>Proposed married last name</span>
                <input
                  aria-label="Proposed married last name"
                  value={details.proposedMarriedName}
                  onChange={(e) => setDetail("proposedMarriedName", e.target.value)}
                />
                <small>Optional. The former surname remains in identity history.</small>
              </label>
            )}
            {eventType === "Civil Status Change" && (
              <label className={styles.field}>
                <span>New civil status *</span>
                <select
                  aria-label="New civil status"
                  value={details.proposedCivilStatus}
                  onChange={(e) => setDetail("proposedCivilStatus", e.target.value)}
                >
                  <option value="">Select</option>
                  {["Single", "Married", "Widowed", "Separated", "Divorced", "Other"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            )}
            {(eventType === "Migration In" || eventType === "Migration Out") && (
              <label className={styles.field}>
                <span>{eventType === "Migration In" ? "Previous location" : "Destination"}</span>
                <input
                  aria-label="Migration location"
                  value={details.destination}
                  onChange={(e) => setDetail("destination", e.target.value)}
                />
              </label>
            )}
            <label className={`${styles.field} ${styles.span3}`}>
              <span>Cause, legal basis, or remarks</span>
              <textarea
                aria-label="Event basis"
                value={details.causeOrBasis}
                onChange={(e) => setDetail("causeOrBasis", e.target.value)}
                placeholder="Reference the supporting civil registry record or explain the event"
              />
            </label>
          </div>
        </div>
        <footer className={styles.formFooter}>
          <span className={styles.sectionHelp}>
            <FileText size={13} /> Changes require reviewer approval
          </span>
          <button type="submit" className={styles.primaryButton}>
            <Send size={14} /> Submit for review
          </button>
        </footer>
      </form>
    </div>
  );
}
