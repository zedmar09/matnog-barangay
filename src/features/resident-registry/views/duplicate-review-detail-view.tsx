"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  GitMerge,
  ShieldCheck,
  UserCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
import type { MergeFieldKey, Resident } from "../types/resident";
import { calculateAge, formatResidentAddress, formatResidentName } from "../utils/resident-utils";

const REVIEWERS = [
  "Maria Santos",
  "Juan Dela Cruz",
  "Barangay Admin",
  "Ana Reyes",
  "Pedro Aquino",
];

type Field = { key: MergeFieldKey; label: string; value: (resident: Resident) => string };
const fields: Field[] = [
  { key: "firstName", label: "First name", value: (r) => r.firstName },
  { key: "middleName", label: "Middle name", value: (r) => r.middleName },
  { key: "lastName", label: "Last name", value: (r) => r.lastName },
  { key: "suffix", label: "Suffix", value: (r) => r.suffix },
  { key: "nickname", label: "Nickname / alias", value: (r) => r.nickname },
  { key: "previousLastName", label: "Previous / married last name", value: (r) => r.previousLastName },
  { key: "mothersMaidenName", label: "Mother's maiden name", value: (r) => r.mothersMaidenName },
  { key: "birthDate", label: "Birth date / age", value: (r) => `${r.birthDate} · ${calculateAge(r.birthDate)} years` },
  { key: "gender", label: "Gender", value: (r) => r.gender },
  { key: "civilStatus", label: "Civil status", value: (r) => r.civilStatus },
  { key: "primaryCitizenship", label: "Primary citizenship", value: (r) => r.primaryCitizenship },
  { key: "primaryMobile", label: "Primary mobile", value: (r) => r.contact.primaryMobile },
  { key: "email", label: "Email", value: (r) => r.contact.email },
  {
    key: "barangayId",
    label: "Barangay",
    value: (r) => MATNOG_BARANGAYS.find((b) => b.code === r.address.barangayId)?.name ?? "",
  },
  { key: "purok", label: "Purok", value: (r) => r.address.purok },
  { key: "sitio", label: "Sitio", value: (r) => r.address.sitio },
  { key: "street", label: "Street", value: (r) => r.address.street },
  { key: "houseUnit", label: "House / unit", value: (r) => r.address.houseUnit },
];

export function DuplicateReviewDetailView({ id }: { id: string }) {
  const candidate = useResidentRegistryStore((s) => s.duplicateCandidates.find((c) => c.id === id));
  const residents = useResidentRegistryStore((s) => s.residents);
  const updateStatus = useResidentRegistryStore((s) => s.updateDuplicateStatus);
  const merge = useResidentRegistryStore((s) => s.mergeDuplicate);
  const a = candidate ? residents.find((r) => r.id === candidate.residentAId) : undefined;
  const b = candidate ? residents.find((r) => r.id === candidate.residentBId) : undefined;
  const [survivor, setSurvivor] = useState<"a" | "b">("a");
  const [selections, setSelections] = useState<Partial<Record<MergeFieldKey, "a" | "b">>>({});
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [selectedReviewer, setSelectedReviewer] = useState("");
  const [assignedReviewer, setAssignedReviewer] = useState(candidate?.reviewer || "");
  const effective = useMemo(
    () =>
      Object.fromEntries(fields.map((f) => [f.key, selections[f.key] ?? survivor])) as Partial<
        Record<MergeFieldKey, "a" | "b">
      >,
    [selections, survivor],
  );
  if (!candidate || !a || !b)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <UsersRound size={34} />
          <h1>Duplicate candidate not found</h1>
          <Link className={styles.primaryButton} href="/barangay-affairs/residents/duplicates">
            Return to duplicate review
          </Link>
        </div>
      </div>
    );
  const resolved = !["Pending Review", "Deferred"].includes(candidate.status);
  const decide = (status: "Deferred" | "Different People") => {
    if (!reason.trim()) {
      setMessage("Enter a review note before saving this decision.");
      return;
    }
    updateStatus(candidate.id, status, reason);
    setMessage(status === "Deferred" ? "Review deferred with a note." : "The pair was marked as two different people.");
  };
  const confirmMerge = () => {
    if (!reason.trim()) {
      setMessage("A merge reason is required.");
      return;
    }
    const survivorId = survivor === "a" ? a.id : b.id;
    const log = merge(candidate.id, survivorId, effective, reason);
    if (log) setMessage(`Merge completed. ${log.survivingLrn} remains active; ${log.retiredLrn} is retired.`);
  };
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <h1>Compare Resident Records</h1>
            <p>
              {candidate.id} · {candidate.score}% confidence · {candidate.risk} risk
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnSecondary} href="/barangay-affairs/residents/duplicates">
              <ArrowLeft size={16} /> Review Queue
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        {message && (
          <div className={styles.mergeBanner}>
            {candidate.status === "Merged" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <div>
              <strong>{message}</strong>
              <span>All decisions are retained in the current session audit history.</span>
            </div>
          </div>
        )}
        <div className={styles.reviewLayout}>
          <section className={styles.card}>
            <div className={styles.resultsMeta}>
              <strong>Field-by-field comparison</strong>
              <span>Select the value that should remain if these records are merged.</span>
            </div>
            <div className={styles.comparisonWrap}>
              <div className={styles.comparisonHeader}>
                <div>Identity field</div>
                {[a, b].map((person, index) => (
                  <div className={styles.comparisonPerson} key={person.id}>
                    <span className={styles.avatarSm}>
                      {person.firstName[0]}
                      {person.lastName[0]}
                    </span>
                    <div>
                      <strong>{formatResidentName(person)}</strong>
                      <span>
                        Record {index === 0 ? "A" : "B"} · {person.lrn}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.comparisonTable}>
                {fields.map((field) => {
                  const av = field.value(a) || "—";
                  const bv = field.value(b) || "—";
                  const match = av.toLowerCase() === bv.toLowerCase();
                  return (
                    <div className={styles.comparisonRow} key={field.key}>
                      <div>{field.label}</div>
                      <div className={`${styles.valueChoice} ${match ? styles.valueMatch : styles.valueConflict}`}>
                        <input
                          type="radio"
                          name={field.key}
                          aria-label={`Use Record A ${field.label}`}
                          checked={effective[field.key] === "a"}
                          disabled={resolved}
                          onChange={() => setSelections((v) => ({ ...v, [field.key]: "a" }))}
                        />
                        <span>{av}</span>
                      </div>
                      <div className={`${styles.valueChoice} ${match ? styles.valueMatch : styles.valueConflict}`}>
                        <input
                          type="radio"
                          name={field.key}
                          aria-label={`Use Record B ${field.label}`}
                          checked={effective[field.key] === "b"}
                          disabled={resolved}
                          onChange={() => setSelections((v) => ({ ...v, [field.key]: "b" }))}
                        />
                        <span>{bv}</span>
                      </div>
                    </div>
                  );
                })}
                <div className={styles.comparisonRow}>
                  <div>Complete address</div>
                  <div
                    className={
                      formatResidentAddress(a.address) === formatResidentAddress(b.address)
                        ? styles.valueMatch
                        : styles.valueConflict
                    }
                  >
                    {formatResidentAddress(a.address)}
                  </div>
                  <div
                    className={
                      formatResidentAddress(a.address) === formatResidentAddress(b.address)
                        ? styles.valueMatch
                        : styles.valueConflict
                    }
                  >
                    {formatResidentAddress(b.address)}
                  </div>
                </div>
              </div>
            </div>
          </section>
          <aside className={`${styles.card} ${styles.decisionPanel}`}>
            <h2>Review Decision</h2>
            <p>Confidence scores are decision support only. A staff reviewer must save the final outcome.</p>

            <div className={styles.reviewerAssign}>
              <label className={styles.reviewerLabel}>Assign reviewer</label>
              <div className={styles.reviewerRow}>
                <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
                  <SelectTrigger className={styles.reviewerSelect} aria-label="Select reviewer">
                    <SelectValue placeholder="Select a reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {REVIEWERS.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={!selectedReviewer}
                  onClick={() => { setAssignedReviewer(selectedReviewer); }}
                  style={{ whiteSpace: "nowrap" }}
                >
                  <UserCheck size={14} /> Assign
                </button>
              </div>
              {assignedReviewer && (
                <span className={styles.assignedBadge}>
                  <UserRound size={13} /> {assignedReviewer}
                </span>
              )}
            </div>

            <hr style={{ border: 0, borderTop: "1px solid #e4ecea", margin: "14px 0" }} />

            <div className={styles.signals}>
              {candidate.signals.map((signal) => (
                <span className={styles.signal} key={signal}>
                  {signal}
                </span>
              ))}
            </div>
            <hr style={{ border: 0, borderTop: "1px solid #e4ecea", margin: "14px 0" }} />
            <label className={styles.decisionOption}>
              <input
                type="radio"
                name="survivor"
                checked={survivor === "a"}
                disabled={resolved}
                onChange={() => setSurvivor("a")}
              />
              <span>
                <strong>Keep Record A and its LRN</strong>
                <small>{a.lrn} remains permanent</small>
              </span>
            </label>
            <label className={styles.decisionOption}>
              <input
                type="radio"
                name="survivor"
                checked={survivor === "b"}
                disabled={resolved}
                onChange={() => setSurvivor("b")}
              />
              <span>
                <strong>Keep Record B and its LRN</strong>
                <small>{b.lrn} remains permanent</small>
              </span>
            </label>
            <textarea
              className={styles.noteArea}
              aria-label="Decision reason"
              placeholder="Required decision or merge reason"
              value={reason}
              disabled={resolved}
              onChange={(e) => setReason(e.target.value)}
            />
            {resolved ? (
              <div className={styles.mergeBanner}>
                <ShieldCheck size={17} />
                <div>
                  <strong>Decision: {candidate.status}</strong>
                  <span>
                    {candidate.note || "No note provided"} · {candidate.reviewer}
                  </span>
                </div>
              </div>
            ) : (
              <div className={styles.buttonStack}>
                <button type="button" className={styles.primaryButton} onClick={confirmMerge}>
                  <GitMerge size={14} /> Confirm merge
                </button>
                <button type="button" className={styles.secondaryButton} onClick={() => decide("Different People")}>
                  <UserRound size={14} /> Mark as different people
                </button>
                <button type="button" className={styles.secondaryButton} onClick={() => decide("Deferred")}>
                  <Clock3 size={14} /> Defer review
                </button>
              </div>
            )}
            <div className={styles.auditTimeline} style={{ marginTop: 16 }}>
              <div className={styles.auditItem}>
                <span className={styles.auditDot} />
                <div>
                  <strong>Candidate detected</strong>
                  <p>{new Date(candidate.detectedAt).toLocaleString("en-PH")}</p>
                </div>
              </div>
              {candidate.reviewedAt && (
                <div className={styles.auditItem}>
                  <span className={styles.auditDot} />
                  <div>
                    <strong>{candidate.status}</strong>
                    <p>
                      {new Date(candidate.reviewedAt).toLocaleString("en-PH")} by {candidate.reviewer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
