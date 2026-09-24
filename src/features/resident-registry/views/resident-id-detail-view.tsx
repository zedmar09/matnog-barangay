"use client";

import { type ReactNode, useState } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileClock,
  PackageCheck,
  Printer,
  RefreshCcw,
  Settings2,
  ShieldAlert,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";

import { ResidentIdCardPreview } from "../components/resident-id-card";
import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
import type { ResidentIdStatus } from "../types/resident";
import { formatResidentName } from "../utils/resident-utils";

function statusClass(status: ResidentIdStatus) {
  if (status === "Released") return styles.active;
  if (status === "Expired" || status === "Revoked" || status === "Lost") return styles.danger;
  if (status === "Generated") return styles.info;
  if (status === "Printed" || status === "Pending Generation") return styles.warning;
  return "";
}

function IdDetailCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className={styles.detailCardStyled}>
      <div className={styles.detailCardHeader}>
        <span className={styles.detailCardIcon}>{icon}</span>
        <h3>{title}</h3>
      </div>
      <div className={styles.detailCardBody}>{children}</div>
    </section>
  );
}

export function ResidentIdDetailView({ id }: { id: string }) {
  const card = useResidentRegistryStore((state) => state.residentIds.find((item) => item.id === id));
  const residents = useResidentRegistryStore((state) => state.residents);
  const identityMedia = useResidentRegistryStore((state) => state.identityMedia);
  const updateStatus = useResidentRegistryStore((state) => state.updateResidentIdStatus);
  const params = useSearchParams();
  const [reason, setReason] = useState("");
  const [releasedTo, setReleasedTo] = useState("");
  const [message, setMessage] = useState("");
  const resident = card ? residents.find((item) => item.id === card.residentId) : undefined;
  const media = resident ? identityMedia.find((item) => item.residentId === resident.id) : undefined;

  if (!card || !resident) {
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <ShieldAlert size={34} />
          <h1>Resident ID not found</h1>
          <p className={styles.muted}>The requested card is unavailable in this session.</p>
          <Link className={styles.primaryButton} href="/barangay-affairs/residents/ids">
            Return to ID queue
          </Link>
        </div>
      </div>
    );
  }

  const mutate = (nextStatus: ResidentIdStatus) => {
    if (!reason.trim()) {
      setMessage("Enter a reason before changing the card status.");
      return;
    }
    if (nextStatus === "Released" && !releasedTo.trim()) {
      setMessage("Enter the name of the resident or authorized recipient.");
      return;
    }
    const updated = updateStatus(card.id, nextStatus, reason, releasedTo);
    setMessage(updated ? `Card status changed to ${nextStatus}.` : "The status could not be changed.");
  };
  const barangay = MATNOG_BARANGAYS.find((item) => item.code === card.barangayId)?.name ?? "—";

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <h1>{card.cardNumber}</h1>
            <p>
              {formatResidentName(resident)} · {resident.lrn} · Brgy. {barangay}
            </p>
          </div>
          <div className={styles.heroActions}>
            <button className={styles.btnPrimary} type="button" onClick={() => window.print()}>
              <Printer size={16} /> Print Preview
            </button>
            <Link className={styles.btnSecondary} href="/barangay-affairs/residents/ids">
              <ArrowLeft size={16} /> ID Queue
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        {params.get("created") ? (
          <div className={styles.toast}>Resident ID generated successfully. Review the card before printing.</div>
        ) : null}
        {message ? (
          <div className={message.startsWith("Card status") ? styles.toast : `${styles.toast} ${styles.error}`}>
            {message}
          </div>
        ) : null}

        <section className={`${styles.detailCardStyled} ${styles.idPreviewCard}`}>
          <div className={`${styles.detailCardHeader} ${styles.idPreviewHeader}`}>
            <div>
              <span className={styles.detailCardIcon}>
                <CreditCard size={17} />
              </span>
              <div>
                <h3>Resident ID Preview</h3>
                <p>Review the front and back before printing or release.</p>
              </div>
            </div>
            <span className={`${styles.badge} ${statusClass(card.status)}`}>{card.status}</span>
          </div>
          <div className={`${styles.detailCardBody} ${styles.idPreviewBody}`}>
            <ResidentIdCardPreview resident={resident} card={card} media={media} />
          </div>
        </section>

        <div className={styles.profileGrid}>
          <IdDetailCard icon={<FileClock size={17} />} title="Issuance and Release Record">
            <dl className={styles.dataList}>
              {[
                ["Card number", card.cardNumber],
                ["Status", card.status],
                ["Issue date", card.issueDate],
                ["Expiration date", card.expirationDate],
                ["Generated by", card.generatedBy],
                ["Generated at", card.generatedAt ? new Date(card.generatedAt).toLocaleString("en-PH") : "—"],
                ["Printed by", card.printedBy || "—"],
                ["Printed at", card.printedAt ? new Date(card.printedAt).toLocaleString("en-PH") : "—"],
                ["Released to", card.releasedTo || "—"],
                ["Released by", card.releasedBy || "—"],
                ["Released at", card.releasedAt ? new Date(card.releasedAt).toLocaleString("en-PH") : "—"],
                ["Latest reason", card.actionReason || "—"],
              ].map(([label, value]) => (
                <div className={styles.dataRow} key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </IdDetailCard>

          <IdDetailCard icon={<Settings2 size={17} />} title="Card Actions">
            <div className={styles.idActionCardBody}>
              <p className={styles.muted}>Each action requires a reason and remains in this card’s session history.</p>
              <label className={styles.field}>
                <span>Action reason *</span>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Describe why this action is required"
                />
              </label>
              {card.status === "Printed" ? (
                <label className={styles.field}>
                  <span>Released to *</span>
                  <input
                    value={releasedTo}
                    onChange={(event) => setReleasedTo(event.target.value)}
                    placeholder="Resident or authorized representative"
                  />
                </label>
              ) : null}
              <div className={styles.actionGrid}>
                {card.status === "Pending Generation" ? (
                  <button className={styles.primaryButton} type="button" onClick={() => mutate("Generated")}>
                    <CheckCircle2 size={14} /> Generate
                  </button>
                ) : null}
                {card.status === "Generated" ? (
                  <button className={styles.primaryButton} type="button" onClick={() => mutate("Printed")}>
                    <Printer size={14} /> Mark printed
                  </button>
                ) : null}
                {card.status === "Printed" ? (
                  <button className={styles.primaryButton} type="button" onClick={() => mutate("Released")}>
                    <PackageCheck size={14} /> Release card
                  </button>
                ) : null}
                {["Generated", "Printed", "Released"].includes(card.status) ? (
                  <button className={styles.dangerButton} type="button" onClick={() => mutate("Lost")}>
                    <ShieldAlert size={14} /> Report lost
                  </button>
                ) : null}
                {["Generated", "Printed", "Released"].includes(card.status) ? (
                  <button className={styles.dangerButton} type="button" onClick={() => mutate("Revoked")}>
                    <Ban size={14} /> Revoke
                  </button>
                ) : null}
                {["Released", "Expired", "Revoked", "Lost"].includes(card.status) ? (
                  <Link
                    className={styles.secondaryButton}
                    href={`/barangay-affairs/residents/ids/generate?resident=${resident.id}&replace=${card.id}`}
                  >
                    <RefreshCcw size={14} /> Create replacement
                  </Link>
                ) : null}
              </div>
              <div className={styles.verifyLinkBox}>
                <strong>Public QR Verification</strong>
                <p>The public endpoint returns card validity and issuing details only.</p>
                <Link href={`/verify/resident-id/${card.verificationToken}`}>
                  <ExternalLink size={13} /> Open public verification
                </Link>
              </div>
            </div>
          </IdDetailCard>
        </div>
      </div>
    </div>
  );
}
