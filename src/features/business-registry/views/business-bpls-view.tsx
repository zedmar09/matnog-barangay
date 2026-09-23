"use client";

import { useMemo, useState } from "react";

import {
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  Link2,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import styles from "@/features/resident-registry/components/resident-registry.module.css";
import { useResidentRegistryStore } from "@/features/resident-registry/stores/resident-registry-store";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import { useBusinessRegistryStore } from "../stores/business-store";
import type { BusinessRecord } from "../types/business";
import businessStyles from "./business.module.css";

type SyncFilter = "Needs review" | "Pending" | "Synced" | "All";

const barangayName = (id: string) => MATNOG_BARANGAYS.find((item) => item.code === id)?.name ?? id;

function reviewReason(record: BusinessRecord) {
  const sequence = Number(record.id.match(/\d+$/)?.[0] ?? 0);
  if (!record.bplsPermitNumber) return "No municipal permit link";
  if (sequence % 3 === 0) return "Business name requires confirmation";
  if (sequence % 2 === 0) return "Owner match requires confirmation";
  return "Clearance status differs";
}

function SyncPill({ status }: { status: BusinessRecord["bplsSyncStatus"] }) {
  const className =
    status === "Synced"
      ? businessStyles.successPill
      : status === "Needs review"
        ? businessStyles.dangerPill
        : businessStyles.warningPill;
  return <span className={className}>{status}</span>;
}

export function BusinessBplsView() {
  const businesses = useBusinessRegistryStore((state) => state.businesses);
  const syncWithBpls = useBusinessRegistryStore((state) => state.syncWithBpls);
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [filter, setFilter] = useState<SyncFilter>("Needs review");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("");

  const residentMap = useMemo(() => new Map(residents.map((item) => [item.id, formatResidentName(item)])), [residents]);
  const scoped = businesses.filter((item) => selectedBarangay === "all" || item.barangayId === selectedBarangay);
  const filtered = scoped.filter((item) => {
    const matchesFilter = filter === "All" || item.bplsSyncStatus === filter;
    const haystack = `${item.businessName} ${item.businessNumber} ${item.bplsPermitNumber}`.toLowerCase();
    return matchesFilter && haystack.includes(query.trim().toLowerCase());
  });
  const initial = filtered[0] ?? scoped[0];
  const selected = businesses.find((item) => item.id === selectedId) ?? initial;
  const synced = scoped.filter((item) => item.bplsSyncStatus === "Synced").length;
  const pending = scoped.filter((item) => item.bplsSyncStatus === "Pending").length;
  const needsReview = scoped.filter((item) => item.bplsSyncStatus === "Needs review").length;
  const coverage = scoped.length ? Math.round((synced / scoped.length) * 100) : 0;

  const synchronize = () => {
    if (!selected) return;
    setSelectedId(selected.id);
    const result = syncWithBpls(selected.id);
    if (!result) return;
    setNotice(`${result.businessNumber} is now linked to ${result.bplsPermitNumber} and synchronized with BPLS.`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A9 Business Registry</p>
          <h1>BPLS Integration</h1>
          <p>Reconcile barangay business records with the municipal permitting system for {selectedBarangayName}.</p>
        </div>
        <div className={businessStyles.integrationHealth}>
          <span>
            <Server size={15} />
          </span>
          <div>
            <strong>Municipal BPLS connected</strong>
            <small>Last exchange: Sep 23, 2026 · 9:42 AM</small>
          </div>
          <i>Online</i>
        </div>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Database size={18} />
          </span>
          <div>
            <strong>{scoped.length}</strong>
            <span>Barangay records</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CheckCircle2 size={18} />
          </span>
          <div>
            <strong>{synced}</strong>
            <span>Synced with BPLS</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <Clock3 size={18} />
          </span>
          <div>
            <strong>{pending}</strong>
            <span>Pending submission</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CircleAlert size={18} />
          </span>
          <div>
            <strong>{needsReview}</strong>
            <span>Need reconciliation</span>
          </div>
        </div>
      </div>

      {notice ? (
        <div className={businessStyles.successNotice}>
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      ) : null}

      <section className={businessStyles.syncOverview}>
        <div>
          <span
            className={businessStyles.syncGauge}
            style={{ "--sync-progress": `${coverage}%` } as React.CSSProperties}
          >
            <b>{coverage}%</b>
          </span>
          <div>
            <strong>Municipal record coverage</strong>
            <small>
              {synced} of {scoped.length} barangay records have a confirmed BPLS link.
            </small>
          </div>
        </div>
        <div className={businessStyles.syncFlow}>
          <span>
            <Building2 size={16} /> Barangay registry
          </span>
          <ArrowRightLeft size={16} />
          <span>
            <ShieldCheck size={16} /> Municipal BPLS
          </span>
        </div>
      </section>

      <div className={businessStyles.bplsWorkspace}>
        <section className={styles.card}>
          <div className={businessStyles.renewalToolbar}>
            <div className={businessStyles.recordSearch}>
              <Search size={14} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search business, registry, or permit number"
              />
            </div>
            <div className={businessStyles.bplsSegments}>
              {(["Needs review", "Pending", "Synced", "All"] as SyncFilter[]).map((item) => (
                <button
                  type="button"
                  key={item}
                  className={filter === item ? businessStyles.segmentActive : ""}
                  onClick={() => {
                    setFilter(item);
                    setSelectedId("");
                    setNotice("");
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className={businessStyles.listMeta}>
              <span>{filtered.length} integration records</span>
              <b>{filter}</b>
            </div>
          </div>
          <div className={businessStyles.bplsList}>
            {filtered.map((item) => (
              <button
                type="button"
                key={item.id}
                className={selected?.id === item.id ? businessStyles.selectedRecord : ""}
                onClick={() => {
                  setSelectedId(item.id);
                  setNotice("");
                }}
              >
                <span className={businessStyles.businessIcon}>
                  <Building2 size={15} />
                </span>
                <div>
                  <strong>{item.businessName}</strong>
                  <small>
                    {item.businessNumber} · {barangayName(item.barangayId)}
                  </small>
                </div>
                <SyncPill status={item.bplsSyncStatus} />
                <span className={businessStyles.permitReference}>{item.bplsPermitNumber || "No permit"}</span>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <div className={businessStyles.panelHeading}>
            <Link2 size={18} />
            <div>
              <strong>Record reconciliation</strong>
              <small>Compare the local registry with the municipal permit record</small>
            </div>
          </div>
          {selected ? (
            <>
              <div className={businessStyles.reconciliationHeader}>
                <div>
                  <span>Selected business</span>
                  <strong>{selected.businessName}</strong>
                  <small>
                    {selected.businessNumber} · Brgy. {barangayName(selected.barangayId)}
                  </small>
                </div>
                <SyncPill status={selected.bplsSyncStatus} />
              </div>
              {selected.bplsSyncStatus === "Needs review" ? (
                <div className={businessStyles.reconciliationAlert}>
                  <CircleAlert size={16} />
                  <div>
                    <strong>{reviewReason(selected)}</strong>
                    <span>Confirm both records refer to the same business before syncing.</span>
                  </div>
                </div>
              ) : selected.bplsSyncStatus === "Pending" ? (
                <div className={businessStyles.pendingSyncBanner}>
                  <Clock3 size={16} />
                  <div>
                    <strong>Ready for municipal submission</strong>
                    <span>The barangay record has not yet received a confirmed BPLS link.</span>
                  </div>
                </div>
              ) : (
                <div className={businessStyles.reconciledBanner}>
                  <CheckCircle2 size={16} />
                  <div>
                    <strong>Records are synchronized</strong>
                    <span>The barangay record is linked to the current municipal permit.</span>
                  </div>
                </div>
              )}

              <div className={businessStyles.comparisonGrid}>
                <article>
                  <header>
                    <Building2 size={15} />
                    <span>
                      <strong>Barangay registry</strong>
                      <small>Local source record</small>
                    </span>
                  </header>
                  <dl>
                    <div>
                      <dt>Business name</dt>
                      <dd>{selected.businessName}</dd>
                    </div>
                    <div>
                      <dt>Registered owner</dt>
                      <dd>{residentMap.get(selected.ownerResidentId) ?? "Resident record"}</dd>
                    </div>
                    <div>
                      <dt>Business activity</dt>
                      <dd>{selected.businessType}</dd>
                    </div>
                    <div>
                      <dt>Clearance</dt>
                      <dd>{selected.clearanceNumber || "Not issued"}</dd>
                    </div>
                    <div>
                      <dt>Local status</dt>
                      <dd>{selected.status}</dd>
                    </div>
                  </dl>
                </article>
                <article>
                  <header>
                    <ShieldCheck size={15} />
                    <span>
                      <strong>Municipal BPLS</strong>
                      <small>Permit source record</small>
                    </span>
                  </header>
                  <dl>
                    <div>
                      <dt>Permit number</dt>
                      <dd>{selected.bplsPermitNumber || "Awaiting assignment"}</dd>
                    </div>
                    <div>
                      <dt>Business name</dt>
                      <dd>{selected.businessName}</dd>
                    </div>
                    <div>
                      <dt>Owner match</dt>
                      <dd>{selected.bplsSyncStatus === "Needs review" ? "For confirmation" : "Confirmed"}</dd>
                    </div>
                    <div>
                      <dt>Permit year</dt>
                      <dd>2026</dd>
                    </div>
                    <div>
                      <dt>Municipal status</dt>
                      <dd>{selected.status === "Lapsed" ? "For renewal" : "Current"}</dd>
                    </div>
                  </dl>
                </article>
              </div>

              <footer className={businessStyles.renewalFooter}>
                <div>
                  <RefreshCw size={16} />
                  <span>
                    <strong>
                      {selected.bplsSyncStatus === "Synced"
                        ? "Linked record available"
                        : "Synchronization action required"}
                    </strong>
                    <small>Updates the integration status while preserving the barangay business record.</small>
                  </span>
                </div>
                <button className={styles.primaryButton} type="button" onClick={synchronize}>
                  <RefreshCw size={14} />
                  {selected.bplsSyncStatus === "Needs review"
                    ? "Confirm match & sync"
                    : selected.bplsSyncStatus === "Pending"
                      ? "Send to BPLS"
                      : "Refresh synchronization"}
                </button>
              </footer>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
