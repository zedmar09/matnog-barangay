"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  History,
  Search,
  ShieldAlert,
  SquarePen,
  UsersRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
import { formatResidentName } from "../utils/resident-utils";

function riskClass(risk: string) {
  return risk === "Very High" ? styles.riskHigh : risk === "High" ? styles.riskMedium : "";
}
function statusClass(status: string) {
  return status === "Merged"
    ? styles.active
    : status === "Different People"
      ? styles.info
      : status === "Deferred"
        ? styles.warning
        : status === "Reversed"
          ? styles.danger
          : "";
}

export function DuplicateReviewQueueView() {
  const residents = useResidentRegistryStore((s) => s.residents);
  const candidates = useResidentRegistryStore((s) => s.duplicateCandidates);
  const logs = useResidentRegistryStore((s) => s.mergeLogs);
  const reverse = useResidentRegistryStore((s) => s.reverseMerge);
  const { selectedBarangay } = useBarangayScope();
  const [tab, setTab] = useState<"queue" | "history">("queue");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [risk, setRisk] = useState("");
  const [page, setPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [reversalReasons, setReversalReasons] = useState<Record<string, string>>({});
  const getResident = (id: string) => residents.find((r) => r.id === id);
  const scoped = useMemo(
    () =>
      candidates.filter((c) => {
        const a = residents.find((resident) => resident.id === c.residentAId);
        const b = residents.find((resident) => resident.id === c.residentBId);
        if (!a || !b) return false;
        if (
          selectedBarangay !== "all" &&
          a.address.barangayId !== selectedBarangay &&
          b.address.barangayId !== selectedBarangay
        )
          return false;
        const haystack = `${a.lrn} ${b.lrn} ${formatResidentName(a)} ${formatResidentName(b)}`.toLowerCase();
        return (
          (!search || haystack.includes(search.toLowerCase())) &&
          (!status || c.status === status) &&
          (!risk || c.risk === risk)
        );
      }),
    [candidates, residents, selectedBarangay, search, status, risk],
  );
  const pending = candidates.filter((c) => c.status === "Pending Review").length;
  const high = candidates.filter((c) => c.risk === "Very High" && c.status === "Pending Review").length;
  const reviewed = candidates.filter((c) => ["Merged", "Different People", "Reversed"].includes(c.status)).length;

  const totalPages = Math.max(1, Math.ceil(scoped.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = scoped.slice((safePage - 1) * pageSize, safePage * pageSize);

  const historyTotalPages = Math.max(1, Math.ceil(logs.length / pageSize));
  const safeHistoryPage = Math.min(historyPage, historyTotalPages);
  const historyRows = logs.slice((safeHistoryPage - 1) * pageSize, safeHistoryPage * pageSize);

  function Pagination({ current, total, count, onPrev, onNext }: { current: number; total: number; count: number; onPrev: () => void; onNext: () => void }) {
    return (
      <div className={styles.pagination}>
        <span>Rows per page</span>
        <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); setHistoryPage(1); }}>
          <SelectTrigger className={styles.compactSelect} aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[25, 50, 100].map((n) => (
              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>
          {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, count)} of {count}
        </span>
        <button type="button" disabled={current === 1} onClick={onPrev} aria-label="Previous page">
          <ChevronLeft size={15} />
        </button>
        <button type="button" disabled={current === total} onClick={onNext} aria-label="Next page">
          <ChevronRight size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <h1>Duplicate Review</h1>
            <p>Review possible resident matches across all barangays before any records are combined.</p>
          </div>
          <div className={styles.heroActions}>
            <button type="button" className={styles.btnSecondary}>
              <Download size={16} /> Export Report
            </button>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryIcon}>
              <Clock3 size={18} />
            </span>
            <div>
              <strong>{pending}</strong>
              <span>Pending review</span>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryIcon}>
              <ShieldAlert size={18} />
            </span>
            <div>
              <strong>{high}</strong>
              <span>Very high confidence</span>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryIcon}>
              <CheckCircle2 size={18} />
            </span>
            <div>
              <strong>{reviewed}</strong>
              <span>Reviewed this session</span>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryIcon}>
              <History size={18} />
            </span>
            <div>
              <strong>{logs.length}</strong>
              <span>Merge log entries</span>
            </div>
          </div>
        </div>
        <section className={styles.card}>
            <div className={styles.toolbar}>
              <nav className={styles.queueTabsInline}>
                <button
                  type="button"
                  className={`${styles.queueTab} ${tab === "queue" ? styles.queueTabActive : ""}`}
                  onClick={() => setTab("queue")}
                >
                  <UsersRound size={14} /> Review queue
                </button>
                <button
                  type="button"
                  className={`${styles.queueTab} ${tab === "history" ? styles.queueTabActive : ""}`}
                  onClick={() => setTab("history")}
                >
                  <History size={14} /> Merge &amp; reversal history
                </button>
              </nav>
              {tab === "queue" && (
                <>
                  <label className={styles.searchBox}>
                    <Search size={15} />
                    <input
                      aria-label="Search duplicate queue"
                      placeholder="Search name or LRN"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                  </label>
                  <Select value={risk} onValueChange={(v) => { setRisk(v === "__all__" ? "" : v); setPage(1); }}>
                    <SelectTrigger className={styles.compactSelect} aria-label="Risk filter">
                      <SelectValue placeholder="All risk levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All risk levels</SelectItem>
                      <SelectItem value="Very High">Very High</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Possible">Possible</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={status} onValueChange={(v) => { setStatus(v === "__all__" ? "" : v); setPage(1); }}>
                    <SelectTrigger className={styles.compactSelect} aria-label="Status filter">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All statuses</SelectItem>
                      <SelectItem value="Pending Review">Pending Review</SelectItem>
                      <SelectItem value="Deferred">Deferred</SelectItem>
                      <SelectItem value="Different People">Different People</SelectItem>
                      <SelectItem value="Merged">Merged</SelectItem>
                      <SelectItem value="Reversed">Reversed</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
            {tab === "queue" ? (
              <>
                <div className={styles.resultsMeta}>
                  <strong>{scoped.length} candidate pairs</strong>
                  <span>Confidence supports review; it never merges records automatically.</span>
                </div>
                {rows.length ? (
                  <>
                    <div className={styles.tableWrap}>
                      <table className={styles.table} style={{ minWidth: 1150 }}>
                        <thead>
                          <tr>
                            <th>Confidence</th>
                            <th>Resident A</th>
                            <th>Resident B</th>
                            <th>Barangays</th>
                            <th>Matched signals</th>
                            <th>Risk</th>
                            <th>Detected</th>
                            <th>Status</th>
                            <th>Reviewer</th>
                            <th style={{ width: 48, textAlign: "center" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((c) => {
                            const a = getResident(c.residentAId);
                            const b = getResident(c.residentBId);
                            if (!a || !b) return null;
                            const ab = MATNOG_BARANGAYS.find((x) => x.code === a.address.barangayId)?.name;
                            const bb = MATNOG_BARANGAYS.find((x) => x.code === b.address.barangayId)?.name;
                            const isPending = ["Pending Review", "Deferred"].includes(c.status);
                            return (
                              <tr key={c.id}>
                                <td>
                                  <span className={`${styles.score} ${riskClass(c.risk)}`}>{c.score}%</span>
                                </td>
                                <td>
                                  <div className={styles.nameCell}>
                                    <Link href={`/barangay-affairs/residents/${a.id}`}>{formatResidentName(a)}</Link>
                                    <small>{a.lrn}</small>
                                  </div>
                                </td>
                                <td>
                                  <div className={styles.nameCell}>
                                    <Link href={`/barangay-affairs/residents/${b.id}`}>{formatResidentName(b)}</Link>
                                    <small>{b.lrn}</small>
                                  </div>
                                </td>
                                <td>
                                  {ab} / {bb}
                                </td>
                                <td>
                                  <div className={styles.signals}>
                                    {c.signals.map((signal) => (
                                      <span className={styles.signal} key={signal}>
                                        {signal}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td>
                                  <span className={`${styles.badge} ${riskClass(c.risk)}`}>{c.risk}</span>
                                </td>
                                <td>{new Date(c.detectedAt).toLocaleDateString("en-PH")}</td>
                                <td>
                                  <span className={`${styles.badge} ${statusClass(c.status)}`}>{c.status}</span>
                                </td>
                                <td>{c.reviewer || "Unassigned"}</td>
                                <td style={{ textAlign: "center" }}>
                                  <Link
                                    className={styles.iconAction}
                                    href={`/barangay-affairs/residents/duplicates/${c.id}`}
                                    title={isPending ? "Review match" : "View decision"}
                                  >
                                    {isPending ? <SquarePen size={16} /> : <Eye size={16} />}
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      current={safePage}
                      total={totalPages}
                      count={scoped.length}
                      onPrev={() => setPage((p) => Math.max(1, p - 1))}
                      onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                    />
                  </>
                ) : (
                  <div className={styles.empty}>
                    <div>
                      <CheckCircle2 size={28} />
                      <h3>No candidate pairs found</h3>
                      <p>Adjust the selected scope or filters.</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className={styles.resultsMeta}>
                  <strong>{logs.length} merge records</strong>
                  <span>Every merge retains the original record snapshots for reversal.</span>
                </div>
                {historyRows.length ? (
                  <>
                    <div className={styles.tableWrap}>
                      <table className={styles.table} style={{ minWidth: 1150 }}>
                        <thead>
                          <tr>
                            <th>Merge ID</th>
                            <th>Surviving LRN</th>
                            <th>Retired LRN</th>
                            <th>Reason</th>
                            <th>Reviewer</th>
                            <th>Merged</th>
                            <th>Status</th>
                            <th>Reversal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyRows.map((log) => (
                            <tr key={log.id}>
                              <td className={styles.mono}>{log.id}</td>
                              <td>
                                <Link href={`/barangay-affairs/residents/${log.survivingResidentId}`}>{log.survivingLrn}</Link>
                              </td>
                              <td>{log.retiredLrn}</td>
                              <td>
                                <div className={styles.historyDetail}>
                                  <strong>{log.reason}</strong>
                                  {log.reversalReason && <small>Reversed: {log.reversalReason}</small>}
                                </div>
                              </td>
                              <td>{log.reviewer}</td>
                              <td>{new Date(log.mergedAt).toLocaleString("en-PH")}</td>
                              <td>
                                <span className={`${styles.badge} ${log.reversedAt ? styles.danger : styles.active}`}>
                                  {log.reversedAt ? "Reversed" : "Merged"}
                                </span>
                              </td>
                              <td>
                                {log.reversedAt ? (
                                  <span>{new Date(log.reversedAt).toLocaleDateString("en-PH")}</span>
                                ) : (
                                  <div className={styles.inlineForm}>
                                    <input
                                      aria-label={`Reversal reason for ${log.id}`}
                                      placeholder="Required reversal reason"
                                      value={reversalReasons[log.id] ?? ""}
                                      onChange={(e) => setReversalReasons((v) => ({ ...v, [log.id]: e.target.value }))}
                                    />
                                    <button
                                      type="button"
                                      className={styles.dangerButton}
                                      disabled={!reversalReasons[log.id]?.trim()}
                                      onClick={() => reverse(log.id, reversalReasons[log.id])}
                                    >
                                      Reverse
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      current={safeHistoryPage}
                      total={historyTotalPages}
                      count={logs.length}
                      onPrev={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      onNext={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                    />
                  </>
                ) : (
                  <div className={styles.empty}>
                    <div>
                      <History size={28} />
                      <h3>No merge history yet</h3>
                      <p>Confirmed merges will appear here with their complete reversal record.</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
      </div>
    </div>
  );
}
