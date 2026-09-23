"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileCheck2,
  FileSearch,
  LockKeyhole,
  MessageSquareText,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "../components/public-portal.module.css";
import { barangayName, PUBLIC_PROJECTS } from "../data/public-data";
import {
  findPublicDocument,
  PUBLIC_FEEDBACK_RECORDS,
  type PublicDocumentRecord,
  type PublicFeedbackRecord,
} from "../data/public-service-data";

const date = new Intl.DateTimeFormat("en-PH", { month: "long", day: "numeric", year: "numeric" });
const dateTime = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatDate(value: string) {
  return date.format(new Date(`${value}T00:00:00`));
}

function readSavedFeedback() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem("matnog-public-feedback") ?? "[]") as PublicFeedbackRecord[];
  } catch {
    return [];
  }
}

export function PublicDocumentVerificationView() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<PublicDocumentRecord | undefined>();

  const verify = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(findPublicDocument(query));
    setSearched(true);
  };

  return (
    <div className={styles.publicServicePage}>
      <section className={styles.servicePageHeader}>
        <span className={styles.serviceHeaderIcon}>
          <FileSearch size={22} />
        </span>
        <div>
          <span className={styles.eyebrow}>Official document check</span>
          <h1>Verify a barangay document</h1>
          <p>Enter the reference printed on the document or the token from its QR code.</p>
        </div>
      </section>

      <section className={styles.verificationGrid}>
        <article className={styles.serviceFormCard}>
          <div className={styles.serviceCardHeading}>
            <div>
              <ShieldCheck size={19} />
              <span>
                <h2>Document verification</h2>
                <p>No personal information is shown.</p>
              </span>
            </div>
          </div>
          <form className={styles.verificationForm} onSubmit={verify}>
            <label>
              <span>Document reference or QR token</span>
              <div className={styles.serviceInputWithIcon}>
                <Search size={16} />
                <input
                  required
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Example: BC-2026-000001"
                />
              </div>
            </label>
            <button className={styles.servicePrimaryButton} type="submit">
              Verify document <ArrowRight size={15} />
            </button>
          </form>
          <div className={styles.demoReference}>
            <span>Sample references</span>
            <button type="button" onClick={() => setQuery("BC-2026-000001")}>
              BC-2026-000001
            </button>
            <button type="button" onClick={() => setQuery("BC-2025-000099")}>
              BC-2025-000099
            </button>
          </div>
        </article>

        <article className={styles.verificationResult} aria-live="polite">
          {!searched ? (
            <div className={styles.resultPlaceholder}>
              <FileCheck2 size={31} />
              <strong>Verification result</strong>
              <p>The document status and issuing office will appear here.</p>
            </div>
          ) : result ? (
            <>
              <div className={result.status === "Valid" ? styles.resultValid : styles.resultWarning}>
                {result.status === "Valid" ? <CheckCircle2 size={22} /> : <CircleAlert size={22} />}
                <span>
                  <small>Verification status</small>
                  <strong>{result.status}</strong>
                </span>
              </div>
              <dl className={styles.verificationFacts}>
                <div>
                  <dt>Reference</dt>
                  <dd>{result.reference}</dd>
                </div>
                <div>
                  <dt>Document type</dt>
                  <dd>{result.type}</dd>
                </div>
                <div>
                  <dt>Issuing office</dt>
                  <dd>Brgy. {barangayName(result.barangayId)}</dd>
                </div>
                <div>
                  <dt>Issue date</dt>
                  <dd>{formatDate(result.issuedAt)}</dd>
                </div>
                <div>
                  <dt>Valid until</dt>
                  <dd>{formatDate(result.validUntil)}</dd>
                </div>
              </dl>
              <p className={styles.resultNote}>{result.note}</p>
            </>
          ) : (
            <div className={styles.resultNotFound}>
              <CircleAlert size={31} />
              <strong>Document not found</strong>
              <p>Check the reference and try again. You may also contact the issuing barangay.</p>
            </div>
          )}
        </article>
      </section>

      <section className={styles.privacyNotice}>
        <LockKeyhole size={19} />
        <div>
          <strong>Privacy-protected verification</strong>
          <p>
            This public check confirms status only. Resident names, addresses, and other personal details remain
            protected.
          </p>
        </div>
      </section>
    </div>
  );
}

export function PublicFeedbackView({ linkedProjectId = "" }: { linkedProjectId?: string }) {
  const { scopeHydrated, selectedBarangay } = useBarangayScope();
  const [mode, setMode] = useState<"submit" | "track">("submit");
  const [barangayId, setBarangayId] = useState("");
  const [category, setCategory] = useState(linkedProjectId ? "Project observation" : "Suggestion");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState<PublicFeedbackRecord>();
  const [trackingReference, setTrackingReference] = useState("");
  const [trackingSearched, setTrackingSearched] = useState(false);
  const [tracked, setTracked] = useState<PublicFeedbackRecord>();

  useEffect(() => {
    if (!scopeHydrated) return;
    setBarangayId((current) => current || (selectedBarangay === "all" ? "" : selectedBarangay));
  }, [scopeHydrated, selectedBarangay]);

  const linkedProject = useMemo(
    () => PUBLIC_PROJECTS.find((project) => project.id === linkedProjectId),
    [linkedProjectId],
  );

  const submitFeedback = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const existing = readSavedFeedback();
    const now = new Date();
    const reference = `FB-${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}-${String(existing.length + 3).padStart(5, "0")}`;
    const record: PublicFeedbackRecord = {
      reference,
      barangayId,
      category,
      subject,
      projectId: linkedProject?.id ?? "",
      status: "Received",
      submittedAt: now.toISOString(),
      updatedAt: now.toISOString(),
      update: "Your submission was received and queued for initial review.",
    };
    window.localStorage.setItem("matnog-public-feedback", JSON.stringify([...existing, record]));
    setSubmitted(record);
    setTrackingReference(reference);
    void name;
    void contact;
  };

  const trackFeedback = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = trackingReference.trim().toLowerCase();
    const allRecords = [...PUBLIC_FEEDBACK_RECORDS, ...readSavedFeedback()];
    setTracked(allRecords.find((record) => record.reference.toLowerCase() === normalized));
    setTrackingSearched(true);
  };

  return (
    <div className={styles.publicServicePage}>
      <section className={styles.servicePageHeader}>
        <span className={styles.serviceHeaderIcon}>
          <MessageSquareText size={22} />
        </span>
        <div>
          <span className={styles.eyebrow}>Citizen feedback channel</span>
          <h1>Send or track public feedback</h1>
          <p>Share a concern, suggestion, commendation, or observation with the appropriate barangay.</p>
        </div>
      </section>

      <div className={styles.serviceTabs}>
        <button
          className={mode === "submit" ? styles.activeServiceTab : undefined}
          type="button"
          onClick={() => setMode("submit")}
        >
          <Send size={14} /> Submit feedback
        </button>
        <button
          className={mode === "track" ? styles.activeServiceTab : undefined}
          type="button"
          onClick={() => setMode("track")}
        >
          <Search size={14} /> Track submission
        </button>
      </div>

      {mode === "submit" ? (
        <section className={styles.feedbackLayout}>
          <article className={styles.serviceFormCard}>
            <div className={styles.serviceCardHeading}>
              <div>
                <MessageSquareText size={19} />
                <span>
                  <h2>Feedback details</h2>
                  <p>Required fields are marked with an asterisk.</p>
                </span>
              </div>
            </div>
            {submitted ? (
              <div className={styles.feedbackSuccess}>
                <CheckCircle2 size={34} />
                <span>Feedback submitted</span>
                <strong>{submitted.reference}</strong>
                <p>Save this reference to check the status of your submission.</p>
                <button
                  type="button"
                  onClick={() => {
                    setMode("track");
                    setTracked(submitted);
                    setTrackingSearched(true);
                  }}
                >
                  Track this submission <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <form className={styles.feedbackForm} onSubmit={submitFeedback}>
                <div className={styles.formRow}>
                  <label>
                    <span>Barangay *</span>
                    <select required value={barangayId} onChange={(event) => setBarangayId(event.target.value)}>
                      <option value="">Select barangay</option>
                      {MATNOG_BARANGAYS.map((barangay) => (
                        <option key={barangay.code} value={barangay.code}>
                          {barangay.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Category *</span>
                    <select required value={category} onChange={(event) => setCategory(event.target.value)}>
                      <option>Suggestion</option>
                      <option>Service concern</option>
                      <option>Project observation</option>
                      <option>Commendation</option>
                      <option>Other</option>
                    </select>
                  </label>
                </div>
                {linkedProject ? (
                  <div className={styles.linkedProject}>
                    <strong>Linked project</strong>
                    <span>
                      {linkedProject.id} · {linkedProject.title}
                    </span>
                  </div>
                ) : null}
                <label>
                  <span>Subject *</span>
                  <input
                    required
                    maxLength={120}
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Brief summary of your feedback"
                  />
                </label>
                <label>
                  <span>Message *</span>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Describe your feedback clearly."
                  />
                </label>
                <div className={styles.formRow}>
                  <label>
                    <span>Name (optional)</span>
                    <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
                  </label>
                  <label>
                    <span>Email or mobile (optional)</span>
                    <input
                      value={contact}
                      onChange={(event) => setContact(event.target.value)}
                      placeholder="For follow-up only"
                    />
                  </label>
                </div>
                <label className={styles.consentRow}>
                  <input
                    required
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                  />
                  <span>I consent to the processing of the information above for feedback handling.</span>
                </label>
                <button className={styles.servicePrimaryButton} type="submit">
                  Submit feedback <Send size={15} />
                </button>
              </form>
            )}
          </article>
          <aside className={styles.feedbackAside}>
            <ShieldCheck size={22} />
            <h2>What happens next?</h2>
            <ol>
              <li>
                <strong>Received</strong>
                <span>Your submission gets a tracking reference.</span>
              </li>
              <li>
                <strong>Reviewed</strong>
                <span>The barangay assigns it to the appropriate office.</span>
              </li>
              <li>
                <strong>Updated</strong>
                <span>Track the latest public-safe status here.</span>
              </li>
            </ol>
          </aside>
        </section>
      ) : (
        <section className={styles.trackingPanel}>
          <form onSubmit={trackFeedback}>
            <label>
              <span>Feedback reference</span>
              <div className={styles.serviceInputWithIcon}>
                <Search size={16} />
                <input
                  required
                  value={trackingReference}
                  onChange={(event) => setTrackingReference(event.target.value)}
                  placeholder="Example: FB-2609-00001"
                />
              </div>
            </label>
            <button className={styles.servicePrimaryButton} type="submit">
              Track status
            </button>
          </form>
          <div className={styles.demoReference}>
            <span>Sample reference</span>
            <button type="button" onClick={() => setTrackingReference("FB-2609-00001")}>
              FB-2609-00001
            </button>
          </div>
          {trackingSearched ? (
            tracked ? (
              <div className={styles.trackingResult}>
                <div>
                  <CheckCircle2 size={20} />
                  <span>
                    <small>Current status</small>
                    <strong>{tracked.status}</strong>
                  </span>
                </div>
                <dl>
                  <div>
                    <dt>Reference</dt>
                    <dd>{tracked.reference}</dd>
                  </div>
                  <div>
                    <dt>Barangay</dt>
                    <dd>Brgy. {barangayName(tracked.barangayId)}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{tracked.category}</dd>
                  </div>
                  <div>
                    <dt>Submitted</dt>
                    <dd>{dateTime.format(new Date(tracked.submittedAt))}</dd>
                  </div>
                </dl>
                <div className={styles.trackingUpdate}>
                  <Clock3 size={16} />
                  <span>
                    <strong>Latest update</strong>
                    <p>{tracked.update}</p>
                    <small>{dateTime.format(new Date(tracked.updatedAt))}</small>
                  </span>
                </div>
                {tracked.projectId ? (
                  <Link href={`/public/projects/${tracked.projectId}`}>
                    View linked public project <ArrowRight size={13} />
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className={styles.resultNotFound}>
                <CircleAlert size={28} />
                <strong>Reference not found</strong>
                <p>Check the feedback reference and try again.</p>
              </div>
            )
          ) : null}
        </section>
      )}
    </div>
  );
}
