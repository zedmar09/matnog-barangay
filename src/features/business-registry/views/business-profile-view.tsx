"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Download,
  MapPin,
  Pencil,
  Store,
  UserRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useHouseholdRegistryStore } from "@/features/household-registry/stores/household-registry-store";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";

import { useBusinessRegistryStore } from "../stores/business-store";
import type { BusinessRecord } from "../types/business";
import businessStyles from "./business.module.css";

const tabs = ["Overview", "Owner & Location", "Clearance & Fees", "BPLS & Renewal"] as const;
const money = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
const displayDate = (value: string) =>
  value
    ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";

function Rows({ items }: { items: Array<[string, string | number | undefined]> }) {
  return (
    <dl className={styles.dataList}>
      {items.map(([label, value]) => (
        <div className={styles.dataRow} key={label}>
          <dt>{label}</dt>
          <dd>{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function DetailCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
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

function StatusBadge({ record }: { record: BusinessRecord }) {
  const className =
    record.status === "Active"
      ? styles.active
      : record.status === "For renewal"
        ? styles.warning
        : record.status === "Lapsed"
          ? styles.danger
          : styles.info;
  return <span className={`${styles.badge} ${className}`}>{record.status}</span>;
}

export function BusinessProfileView({ id }: { id: string }) {
  const business = useBusinessRegistryStore((state) => state.businesses.find((item) => item.id === id));
  const allPayments = useBusinessRegistryStore((state) => state.payments);
  const residents = useResidentRegistryStore((state) => state.residents);
  const structures = useHouseholdRegistryStore((state) => state.structures);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const payments = useMemo(() => allPayments.filter((item) => item.businessId === id), [allPayments, id]);

  if (!business)
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <Store size={34} />
          <h1>Business not found</h1>
          <p className={styles.muted}>The requested business record is unavailable.</p>
          <Link className={styles.primaryButton} href="/barangay-affairs/businesses/masterlist">
            Return to masterlist
          </Link>
        </div>
      </div>
    );

  const owner = residents.find((item) => item.id === business.ownerResidentId);
  const structure = structures.find((item) => item.id === business.structureId);
  const barangay = MATNOG_BARANGAYS.find((item) => item.code === business.barangayId)?.name ?? "—";
  const address = structure
    ? [structure.houseNumber, structure.street, structure.purok, structure.sitio].filter(Boolean).join(", ")
    : "—";
  const balance = Math.max(0, business.assessedFee - business.amountPaid);

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${businessStyles.businessHero}`}>
        <div className={styles.heroInner}>
          <div>
            <h1>{business.businessName}</h1>
            <p>
              {business.businessNumber} · {business.businessType} · Brgy. {barangay}
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href={`/barangay-affairs/businesses/${business.id}/edit`}>
              <Pencil size={16} /> Update Business
            </Link>
            <button type="button" className={styles.btnSecondary}>
              <Download size={16} /> Export Record
            </button>
            <Link className={styles.btnSecondary} href="/barangay-affairs/businesses/masterlist">
              <ArrowLeft size={16} /> Masterlist
            </Link>
          </div>
        </div>
      </section>
      <div className={styles.body}>
        <section className={styles.card}>
          <header className={styles.profileHeader}>
            <div className={styles.avatarLg}>
              <Store size={30} />
            </div>
            <div className={styles.profileIdentity}>
              <h1>{business.businessName}</h1>
              <p>
                {business.tradeName || "No trade name"} · {business.businessNumber}
              </p>
              <div className={styles.badgeRow}>
                <StatusBadge record={business} />
                <span
                  className={`${styles.badge} ${business.clearanceStatus === "Valid" ? styles.active : business.clearanceStatus === "Expired" ? styles.danger : styles.warning}`}
                >
                  {business.clearanceStatus} clearance
                </span>
                <span
                  className={`${styles.badge} ${business.bplsSyncStatus === "Synced" ? styles.active : styles.warning}`}
                >
                  {business.bplsSyncStatus} with BPLS
                </span>
              </div>
            </div>
          </header>
          <nav className={styles.tabs} aria-label="Business details">
            {tabs.map((value) => (
              <button
                type="button"
                key={value}
                className={`${styles.tab} ${tab === value ? styles.tabActive : ""}`}
                onClick={() => setTab(value)}
              >
                {value}
              </button>
            ))}
          </nav>
          <div className={styles.profileBody}>
            {tab === "Overview" && (
              <div className={styles.profileGrid}>
                <DetailCard icon={<BriefcaseBusiness size={17} />} title="Business Information">
                  <Rows
                    items={[
                      ["Registry number", business.businessNumber],
                      ["Registered name", business.businessName],
                      ["Trade name", business.tradeName],
                      ["Activity", business.businessType],
                      ["Ownership", business.ownership],
                      ["Employees", business.employeeCount],
                      ["Gross sales bracket", business.grossSalesBracket],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<CalendarClock size={17} />} title="Registry Timeline">
                  <Rows
                    items={[
                      ["Registration date", displayDate(business.registrationDate)],
                      ["Renewal due", displayDate(business.renewalDueDate)],
                      ["Last updated", displayDate(business.updatedAt)],
                      ["Current status", business.status],
                    ]}
                  />
                </DetailCard>
              </div>
            )}
            {tab === "Owner & Location" && (
              <div className={styles.profileGrid}>
                <DetailCard icon={<UserRound size={17} />} title="Registered Owner">
                  <Rows
                    items={[
                      ["Owner", owner ? formatResidentName(owner) : "—"],
                      ["LRN", owner?.lrn],
                      ["Contact number", business.contactNumber],
                      ["Email", business.email],
                    ]}
                  />
                  {owner && (
                    <Link className={styles.secondaryButton} href={`/barangay-affairs/residents/${owner.id}`}>
                      View resident profile
                    </Link>
                  )}
                </DetailCard>
                <DetailCard icon={<MapPin size={17} />} title="Business Location">
                  <Rows
                    items={[
                      ["Barangay", barangay],
                      ["Address", address],
                      ["Structure code", structure?.structureCode],
                      ["GPS", structure ? `${structure.latitude.toFixed(6)}, ${structure.longitude.toFixed(6)}` : "—"],
                    ]}
                  />
                  {structure && (
                    <Link className={styles.secondaryButton} href={`/barangay-affairs/structures/${structure.id}`}>
                      View structure
                    </Link>
                  )}
                </DetailCard>
              </div>
            )}
            {tab === "Clearance & Fees" && (
              <div className={styles.profileGrid}>
                <DetailCard icon={<BadgeCheck size={17} />} title="Barangay Clearance">
                  <Rows
                    items={[
                      ["Clearance status", business.clearanceStatus],
                      ["Clearance number", business.clearanceNumber],
                      ["Valid until", displayDate(business.clearanceValidUntil)],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<Banknote size={17} />} title="Assessment and Collections">
                  <Rows
                    items={[
                      ["Assessed fee", money(business.assessedFee)],
                      ["Amount paid", money(business.amountPaid)],
                      ["Outstanding balance", money(balance)],
                      ["Last payment", displayDate(business.lastPaymentDate)],
                      ["Payment transactions", payments.length],
                    ]}
                  />
                </DetailCard>
              </div>
            )}
            {tab === "BPLS & Renewal" && (
              <div className={styles.profileGrid}>
                <DetailCard icon={<Building2 size={17} />} title="BPLS Integration">
                  <Rows
                    items={[
                      ["Synchronization status", business.bplsSyncStatus],
                      ["BPLS permit number", business.bplsPermitNumber],
                      [
                        "Last synchronized",
                        business.bplsSyncStatus === "Synced" ? displayDate(business.updatedAt) : "—",
                      ],
                    ]}
                  />
                </DetailCard>
                <DetailCard icon={<CalendarClock size={17} />} title="Renewal Readiness">
                  <Rows
                    items={[
                      ["Registry status", business.status],
                      ["Renewal due date", displayDate(business.renewalDueDate)],
                      ["Clearance validity", displayDate(business.clearanceValidUntil)],
                      ["Outstanding balance", money(balance)],
                    ]}
                  />
                </DetailCard>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
