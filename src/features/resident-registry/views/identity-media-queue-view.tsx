"use client";

import { useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { Camera, CheckCircle2, Clock3, ImageOff, PenLine, Plus, Search } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
import { formatResidentName } from "../utils/resident-utils";

function statusClass(status: string) {
  return status === "Approved"
    ? styles.active
    : status === "Rejected"
      ? styles.danger
      : status === "Recapture Required"
        ? styles.warning
        : "";
}
export function IdentityMediaQueueView() {
  const reviews = useResidentRegistryStore((s) => s.mediaReviews);
  const media = useResidentRegistryStore((s) => s.identityMedia);
  const residents = useResidentRegistryStore((s) => s.residents);
  const { selectedBarangay } = useBarangayScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const rows = useMemo(
    () =>
      reviews.filter((review) => {
        const resident = residents.find((r) => r.id === review.residentId);
        if (!resident) return false;
        if (selectedBarangay !== "all" && resident.address.barangayId !== selectedBarangay) return false;
        if (status && review.status !== status) return false;
        const hay = `${review.referenceNumber} ${resident.lrn} ${formatResidentName(resident)}`.toLowerCase();
        return !search || hay.includes(search.toLowerCase());
      }),
    [reviews, residents, selectedBarangay, status, search],
  );
  const photos = media.filter((item) => item.photoUrl).length;
  const signatures = media.filter((item) => item.signatureUrl).length;
  const verified = media.filter((item) => item.status === "Verified").length;
  const pending = reviews.filter((item) => item.status === "Pending Review").length;
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A1 Identity Media</p>
          <h1>Photo & Signature</h1>
          <p>Capture, verify, and replace resident identity media with a complete review history.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/residents/media/capture">
          <Plus size={15} /> New capture
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Camera size={18} />
          </span>
          <div>
            <strong>{photos}</strong>
            <span>Residents with photos</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <PenLine size={18} />
          </span>
          <div>
            <strong>{signatures}</strong>
            <span>Residents with signatures</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CheckCircle2 size={18} />
          </span>
          <div>
            <strong>{verified}</strong>
            <span>Verified media sets</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Clock3 size={18} />
          </span>
          <div>
            <strong>{pending}</strong>
            <span>Pending review</span>
          </div>
        </div>
      </div>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Search identity media"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search review number, resident, or LRN"
            />
          </label>
          <select
            className={styles.compactSelect}
            aria-label="Media review status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {["Pending Review", "Approved", "Recapture Required", "Rejected"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className={styles.resultsMeta}>
          <strong>{rows.length} identity-media reviews</strong>
          <span>780 photos · 600 signatures in the dummy resident set</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: 1150 }}>
            <thead>
              <tr>
                <th>Review No.</th>
                <th>Photo</th>
                <th>Resident</th>
                <th>Barangay</th>
                <th>Signature</th>
                <th>Quality</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((review) => {
                const resident = residents.find((r) => r.id === review.residentId);
                if (!resident) return null;
                return (
                  <tr key={review.id}>
                    <td className={styles.mono}>{review.referenceNumber}</td>
                    <td>
                      {review.proposedPhotoUrl ? (
                        <span className={styles.avatarSm}>
                          <Image src={review.proposedPhotoUrl} alt="" width={30} height={30} unoptimized />
                        </span>
                      ) : (
                        <ImageOff size={17} />
                      )}
                    </td>
                    <td>
                      <div className={styles.nameCell}>
                        <Link href={`/barangay-affairs/residents/${resident.id}`}>{formatResidentName(resident)}</Link>
                        <small>{resident.lrn}</small>
                      </div>
                    </td>
                    <td>{MATNOG_BARANGAYS.find((b) => b.code === resident.address.barangayId)?.name}</td>
                    <td>
                      {review.proposedSignatureUrl ? (
                        <span className={`${styles.badge} ${styles.active}`}>On file</span>
                      ) : (
                        <span className={styles.badge}>Missing</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.signals}>
                        {review.qualityNotes.map((note) => (
                          <span className={styles.signal} key={note}>
                            {note}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{review.replacementReason}</td>
                    <td>
                      <span className={`${styles.badge} ${statusClass(review.status)}`}>{review.status}</span>
                    </td>
                    <td>{new Date(review.requestedAt).toLocaleDateString("en-PH")}</td>
                    <td>
                      <Link className={styles.secondaryButton} href={`/barangay-affairs/residents/media/${review.id}`}>
                        {review.status === "Pending Review" ? "Review" : "View"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
