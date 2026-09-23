"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

import { Building2 } from "lucide-react";
import QRCode from "qrcode";

import { MATNOG_BARANGAYS } from "@/data/barangays";

import type { Resident, ResidentIdCard as ResidentIdCardType, ResidentIdentityMedia } from "../types/resident";
import { formatResidentAddress, formatResidentName } from "../utils/resident-utils";
import styles from "./resident-registry.module.css";

export function ResidentIdCardPreview({
  resident,
  card,
  media,
}: {
  resident: Resident;
  card: ResidentIdCardType;
  media?: ResidentIdentityMedia;
}) {
  const [qr, setQr] = useState("");
  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3010";
    QRCode.toDataURL(`${origin}/verify/resident-id/${card.verificationToken}`, {
      width: 220,
      margin: 1,
      color: { dark: "#173d39", light: "#ffffff" },
    }).then(setQr);
  }, [card.verificationToken]);
  const barangay = MATNOG_BARANGAYS.find((item) => item.code === card.barangayId)?.name ?? "—";
  return (
    <div className={styles.idCardGrid}>
      <article className={styles.idCard}>
        <header className={styles.idCardHeader}>
          <strong>
            <Building2 size={15} /> MATNOG RESIDENT ID
          </strong>
          <span>
            Municipality of Matnog
            <br />
            Province of Sorsogon
          </span>
        </header>
        <div className={styles.idCardBody}>
          <div className={styles.idPhoto}>
            {media?.photoUrl || resident.photoUrl ? (
              <Image src={media?.photoUrl || resident.photoUrl} alt="Resident" width={92} height={112} unoptimized />
            ) : null}
          </div>
          <div className={styles.idDetails}>
            <b>Resident name</b>
            <h2>{formatResidentName(resident)}</h2>
            <b>Local Resident Number</b>
            <p>{resident.lrn}</p>
            <b>Birth date</b>
            <p>{resident.birthDate}</p>
            <b>Address</b>
            <p>{formatResidentAddress(resident.address)}</p>
          </div>
        </div>
        <footer className={styles.idFooter}>
          {media?.signatureUrl ? (
            <Image
              className={styles.idSignature}
              src={media.signatureUrl}
              alt="Resident signature"
              width={120}
              height={38}
              unoptimized
            />
          ) : (
            <span />
          )}
          <div className={styles.idDetails}>
            <b>Barangay</b>
            <p>{barangay}</p>
          </div>
        </footer>
      </article>
      <article className={`${styles.idCard} ${styles.idBack}`}>
        <header className={styles.idCardHeader}>
          <strong>MATNOG BRGYS</strong>
          <span>{card.cardNumber}</span>
        </header>
        <div className={styles.idBackBody}>
          <div className={styles.idDetails}>
            <b>Emergency contact</b>
            <h2>{card.emergencyContactName}</h2>
            <p>{card.emergencyContactNumber}</p>
            <br />
            <b>Issued</b>
            <p>{card.issueDate}</p>
            <b>Expires</b>
            <p>{card.expirationDate}</p>
            <b>Issuing authority</b>
            <p>{card.issuingAuthority}</p>
          </div>
          <div className={styles.qrBox}>
            {qr && <Image src={qr} alt="Resident ID verification QR" width={94} height={94} unoptimized />}
          </div>
        </div>
        <p className={styles.privacyText}>
          Scan the QR code to verify this card’s status. The public verification page returns validity information only
          and does not expose the resident record. If found, return this card to the Municipality of Matnog.
        </p>
      </article>
    </div>
  );
}
