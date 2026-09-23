"use client";

import Link from "next/link";

import { AlertTriangle, BellRing, ClipboardList, Layers3, Plus, UsersRound } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useSectorRegistryStore } from "../stores/sector-registry-store";

export function SectorDashboardView() {
  const memberships = useSectorRegistryStore((state) => state.memberships);
  const definitions = useSectorRegistryStore((state) => state.definitions);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const scoped = memberships.filter((membership) => {
    const resident = residents.find((item) => item.id === membership.residentId);
    return resident && (selectedBarangay === "all" || resident.address.barangayId === selectedBarangay);
  });
  const uniqueResidents = new Set(scoped.filter((item) => item.status === "Active").map((item) => item.residentId))
    .size;
  const alerts = scoped.filter((item) => item.status === "Pending Review" || item.status === "Expired");
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A3 Sectoral Registries</p>
          <h1>Sectoral Registry Dashboard</h1>
          <p>{selectedBarangayName} consolidated classifications linked to permanent A1 resident records.</p>
        </div>
        <Link className={styles.primaryButton} href="/barangay-affairs/sectors/assign">
          <Plus size={15} /> Assign sector
        </Link>
      </header>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <UsersRound size={18} />
          </span>
          <div>
            <strong>{uniqueResidents}</strong>
            <span>Classified residents</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Layers3 size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>Total memberships</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <ClipboardList size={18} />
          </span>
          <div>
            <strong>{definitions.length}</strong>
            <span>Configured sectors</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <AlertTriangle size={18} />
          </span>
          <div>
            <strong>{alerts.length}</strong>
            <span>Need attention</span>
          </div>
        </div>
      </div>
      <div className={styles.sectorDashboardGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Configured classifications</p>
              <h2>Sector coverage</h2>
            </div>
            <Link className={styles.secondaryButton} href="/barangay-affairs/sectors/masterlist">
              Open masterlist
            </Link>
          </div>
          <div className={styles.sectorCardGrid}>
            {definitions.map((definition) => {
              const items = scoped.filter((item) => item.sectorCode === definition.code);
              const active = items.filter((item) => item.status === "Active").length;
              const pending = items.filter((item) => item.status === "Pending Review").length;
              return (
                <Link
                  href={`/barangay-affairs/sectors/${definition.code}`}
                  className={styles.sectorCard}
                  key={definition.code}
                >
                  <span style={{ background: definition.color }}>
                    <UsersRound size={18} />
                  </span>
                  <div>
                    <h3>{definition.name}</h3>
                    <p>{definition.description}</p>
                    <strong>{active} active</strong>
                    <small>{pending} pending review</small>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
        <aside className={styles.card}>
          <div className={styles.householdSidePanel}>
            <h2>
              <BellRing size={16} /> Eligibility and review alerts
            </h2>
            <p>Memberships requiring supporting-document review or renewal.</p>
            <div className={styles.priorityList}>
              {alerts.slice(0, 10).map((membership) => {
                const resident = residents.find((item) => item.id === membership.residentId);
                const definition = definitions.find((item) => item.code === membership.sectorCode);
                return (
                  <Link href={`/barangay-affairs/sectors/residents/${membership.residentId}`} key={membership.id}>
                    <span>
                      <strong>{resident ? formatResidentName(resident) : "Unknown resident"}</strong>
                      <small>
                        {definition?.shortName} ·{" "}
                        {resident
                          ? MATNOG_BARANGAYS.find((item) => item.code === resident.address.barangayId)?.name
                          : ""}
                      </small>
                    </span>
                    <span
                      className={`${styles.badge} ${membership.status === "Expired" ? styles.danger : styles.warning}`}
                    >
                      {membership.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
