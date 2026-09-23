"use client";

import { type FormEvent, useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, CheckCircle2, CreditCard, Search, ShieldCheck } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { ResidentIdCardPreview } from "../components/resident-id-card";
import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
import type { ResidentIdCard } from "../types/resident";
import { formatResidentName } from "../utils/resident-utils";

export function ResidentIdGenerateView({
  initialResidentId = "",
  initialReplacementId = "",
}: {
  initialResidentId?: string;
  initialReplacementId?: string;
}) {
  const residents = useResidentRegistryStore((state) => state.residents);
  const media = useResidentRegistryStore((state) => state.identityMedia);
  const cards = useResidentRegistryStore((state) => state.residentIds);
  const createResidentId = useResidentRegistryStore((state) => state.createResidentId);
  const { selectedBarangay } = useBarangayScope();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [residentId, setResidentId] = useState(initialResidentId);
  const [issueDate, setIssueDate] = useState("2026-09-23");
  const [expirationDate, setExpirationDate] = useState("2031-09-23");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyNumber, setEmergencyNumber] = useState("");
  const [replacementForId, setReplacementForId] = useState(initialReplacementId);
  const [reason, setReason] = useState(initialReplacementId ? "Replacement ID issuance" : "First resident ID issuance");
  const [error, setError] = useState("");

  const eligible = useMemo(
    () =>
      residents.filter((resident) => {
        const identityMedia = media.find((item) => item.residentId === resident.id);
        return (
          resident.residentStatus === "Active" &&
          identityMedia?.status === "Verified" &&
          Boolean(identityMedia.photoUrl) &&
          Boolean(identityMedia.signatureUrl)
        );
      }),
    [media, residents],
  );
  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return eligible
      .filter(
        (resident) =>
          (selectedBarangay === "all" || resident.address.barangayId === selectedBarangay) &&
          `${resident.lrn} ${formatResidentName(resident)} ${resident.contact.primaryMobile}`
            .toLowerCase()
            .includes(value),
      )
      .slice(0, 8);
  }, [eligible, query, selectedBarangay]);
  const resident = eligible.find((item) => item.id === residentId);
  const identityMedia = media.find((item) => item.residentId === residentId);
  const priorCards = cards.filter((card) => card.residentId === residentId);
  const preview: ResidentIdCard | undefined = resident
    ? {
        id: "preview",
        cardNumber: "MID-2026-PREVIEW",
        residentId: resident.id,
        barangayId: resident.address.barangayId,
        verificationToken: "preview",
        status: "Generated",
        issueDate,
        expirationDate,
        emergencyContactName: emergencyName || "Emergency contact",
        emergencyContactNumber: emergencyNumber || "09XX XXX XXXX",
        issuingAuthority: "Municipality of Matnog",
        generatedBy: "Municipal ID Officer",
        generatedAt: "",
        printedBy: "",
        printedAt: "",
        releasedTo: "",
        releasedBy: "",
        releasedAt: "",
        replacementForId,
        actionReason: reason,
        updatedAt: "",
      }
    : undefined;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !resident ||
      !issueDate ||
      !expirationDate ||
      !emergencyName.trim() ||
      !emergencyNumber.trim() ||
      !reason.trim()
    ) {
      setError("Select an eligible resident and complete all issuance fields.");
      return;
    }
    if (expirationDate <= issueDate) {
      setError("The expiration date must be after the issue date.");
      return;
    }
    const card = createResidentId({
      residentId: resident.id,
      issueDate,
      expirationDate,
      emergencyContactName: emergencyName,
      emergencyContactNumber: emergencyNumber,
      replacementForId,
      actionReason: reason,
    });
    if (!card) {
      setError("The resident is no longer eligible. Confirm active status and verified identity media.");
      return;
    }
    router.push(`/barangay-affairs/residents/ids/${card.id}?created=1`);
  };

  return (
    <div className={`${styles.page} ${styles.formShell}`}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A1 Resident IDs</p>
          <h1>Generate resident ID</h1>
          <p>Confirm eligibility, issuance details, and the card preview before generation.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/residents/ids">
          <ArrowLeft size={15} /> ID queue
        </Link>
      </header>
      {error ? <div className={`${styles.toast} ${styles.error}`}>{error}</div> : null}
      <form onSubmit={submit}>
        <section className={styles.card}>
          <div className={styles.formBody}>
            <h2 className={styles.sectionTitle}>Eligible resident</h2>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input
                aria-label="Find eligible resident"
                placeholder="Search active resident by name, LRN, or mobile"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            {query && !resident ? (
              <div className={styles.searchResults}>
                {results.map((item) => (
                  <button
                    type="button"
                    className={styles.decisionOption}
                    key={item.id}
                    onClick={() => {
                      setResidentId(item.id);
                      setQuery(formatResidentName(item));
                      setEmergencyName(`${item.middleName || "Emergency"} ${item.lastName}`);
                      setEmergencyNumber(item.contact.secondaryMobile || item.contact.primaryMobile);
                    }}
                  >
                    <span className={styles.avatarSm}>
                      {item.photoUrl ? (
                        <Image src={item.photoUrl} alt="" width={30} height={30} unoptimized />
                      ) : (
                        `${item.firstName[0]}${item.lastName[0]}`
                      )}
                    </span>
                    <span>
                      <strong>{formatResidentName(item)}</strong>
                      <small>
                        {item.lrn} ·{" "}
                        {MATNOG_BARANGAYS.find((barangay) => barangay.code === item.address.barangayId)?.name}
                      </small>
                    </span>
                  </button>
                ))}
                {!results.length ? (
                  <p className={styles.muted}>No eligible residents found in the selected barangay.</p>
                ) : null}
              </div>
            ) : null}
            {resident ? (
              <div className={styles.eligibilityBanner}>
                <CheckCircle2 size={18} />
                <div>
                  <strong>{formatResidentName(resident)}</strong>
                  <span>Active resident · Verified photo and signature · {resident.lrn}</span>
                </div>
              </div>
            ) : null}

            <h2 className={styles.sectionTitle}>Issuance details</h2>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Issue date *</span>
                <input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Expiration date *</span>
                <input type="date" value={expirationDate} onChange={(event) => setExpirationDate(event.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Emergency contact *</span>
                <input
                  value={emergencyName}
                  onChange={(event) => setEmergencyName(event.target.value)}
                  placeholder="Full name"
                />
              </label>
              <label className={styles.field}>
                <span>Emergency contact number *</span>
                <input
                  value={emergencyNumber}
                  onChange={(event) => setEmergencyNumber(event.target.value)}
                  placeholder="09XX XXX XXXX"
                />
              </label>
              <label className={`${styles.field} ${styles.span2}`}>
                <span>Replacement for</span>
                <select value={replacementForId} onChange={(event) => setReplacementForId(event.target.value)}>
                  <option value="">First issuance / no replacement</option>
                  {priorCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.cardNumber} · {card.status}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`${styles.field} ${styles.span2}`}>
                <span>Issuance reason *</span>
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} />
              </label>
            </div>
          </div>
        </section>

        {resident && preview ? (
          <section className={`${styles.card} ${styles.previewSection}`}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Card preview</p>
                <h2>Front and back</h2>
              </div>
              <span className={`${styles.badge} ${styles.active}`}>
                <ShieldCheck size={13} /> Status-only QR
              </span>
            </div>
            <ResidentIdCardPreview resident={resident} card={preview} media={identityMedia} />
          </section>
        ) : null}

        <div className={styles.formActions}>
          <Link className={styles.secondaryButton} href="/barangay-affairs/residents/ids">
            Cancel
          </Link>
          <button className={styles.primaryButton} type="submit">
            <CreditCard size={15} /> Generate resident ID
          </button>
        </div>
      </form>
    </div>
  );
}
