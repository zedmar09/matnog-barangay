"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Landmark,
  Search,
  TrendingUp,
  X,
} from "lucide-react";

import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "../components/public-portal.module.css";
import { barangayName, type PublicTransparencyDocument, transparencyForScope } from "../data/public-data";

type TransparencyTab = "overview" | "documents" | "procurement";

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});
const date = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" });

function formatDate(value: string) {
  return date.format(new Date(`${value}T00:00:00`));
}

function downloadDocument(document: PublicTransparencyDocument) {
  const content = [
    "MATNOG BRGYS PUBLIC TRANSPARENCY RECORD",
    `Reference: ${document.id}`,
    `Barangay: ${barangayName(document.barangayId)}`,
    `Title: ${document.title}`,
    `Type: ${document.type}`,
    `Period: ${document.period}`,
    `Published: ${document.publishedAt}`,
    `Status: ${document.status}`,
    "",
    "This demonstration file represents a public document download. Production deployment will serve the approved source file from secure public storage.",
  ].join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = `${document.id}-${document.type.toLowerCase().replaceAll(" ", "-")}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function PublicTransparencyView() {
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [fiscalYear, setFiscalYear] = useState(2026);
  const [tab, setTab] = useState<TransparencyTab>("overview");
  const [query, setQuery] = useState("");
  const [documentType, setDocumentType] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState<PublicTransparencyDocument | null>(null);
  const { funds, documents, procurement } = transparencyForScope(selectedBarangay, fiscalYear);

  const totals = funds.reduce(
    (result, fund) => ({
      appropriated: result.appropriated + fund.appropriated,
      obligated: result.obligated + fund.obligated,
      disbursed: result.disbursed + fund.disbursed,
    }),
    { appropriated: 0, obligated: 0, disbursed: 0 },
  );
  const utilization = totals.appropriated ? Math.round((totals.disbursed / totals.appropriated) * 100) : 0;

  const groupedFunds = useMemo(() => {
    const grouped = new Map<string, { appropriated: number; obligated: number; disbursed: number }>();
    for (const record of funds) {
      const current = grouped.get(record.fund) ?? { appropriated: 0, obligated: 0, disbursed: 0 };
      grouped.set(record.fund, {
        appropriated: current.appropriated + record.appropriated,
        obligated: current.obligated + record.obligated,
        disbursed: current.disbursed + record.disbursed,
      });
    }
    return [...grouped.entries()].map(([fund, values]) => ({ fund, ...values }));
  }, [funds]);

  const filteredDocuments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return documents.filter(
      (document) =>
        (documentType === "all" || document.type === documentType) &&
        (!normalized ||
          document.title.toLowerCase().includes(normalized) ||
          document.id.toLowerCase().includes(normalized) ||
          barangayName(document.barangayId).toLowerCase().includes(normalized)),
    );
  }, [documentType, documents, query]);

  const latestDocuments = [...documents]
    .filter((document) => document.status === "Published")
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
    .slice(0, 5);
  const openProcurement = procurement.filter((notice) => notice.status === "Open");

  return (
    <div className={styles.transparencyPage}>
      <section className={styles.publicPageHeader}>
        <div>
          <span className={styles.eyebrow}>Open government</span>
          <h1>Transparency Center</h1>
          <p>Budgets, financial statements, procurement notices, and fund utilization for {selectedBarangayName}.</p>
        </div>
        <label className={styles.yearSelector}>
          <CalendarDays size={16} />
          <span>Fiscal year</span>
          <select value={fiscalYear} onChange={(event) => setFiscalYear(Number(event.target.value))}>
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </label>
      </section>

      <section className={styles.transparencyMetrics} aria-label="Transparency summary">
        <div>
          <span className={styles.metricIcon}>
            <CircleDollarSign size={19} />
          </span>
          <span>
            <small>Approved appropriations</small>
            <strong>{currency.format(totals.appropriated)}</strong>
            <em>FY {fiscalYear}</em>
          </span>
        </div>
        <div>
          <span className={styles.metricIcon}>
            <FileCheck2 size={19} />
          </span>
          <span>
            <small>Total obligated</small>
            <strong>{currency.format(totals.obligated)}</strong>
            <em>
              {totals.appropriated ? Math.round((totals.obligated / totals.appropriated) * 100) : 0}% obligation rate
            </em>
          </span>
        </div>
        <div>
          <span className={styles.metricIcon}>
            <TrendingUp size={19} />
          </span>
          <span>
            <small>Total disbursed</small>
            <strong>{currency.format(totals.disbursed)}</strong>
            <em>{utilization}% utilization</em>
          </span>
        </div>
        <div>
          <span className={styles.metricIcon}>
            <FolderOpen size={19} />
          </span>
          <span>
            <small>Published records</small>
            <strong>{documents.length + procurement.length}</strong>
            <em>{openProcurement.length} open notices</em>
          </span>
        </div>
      </section>

      <div className={styles.transparencyTabs} role="tablist" aria-label="Transparency sections">
        <button
          className={tab === "overview" ? styles.activeTab : undefined}
          type="button"
          role="tab"
          aria-selected={tab === "overview"}
          onClick={() => setTab("overview")}
        >
          Overview
        </button>
        <button
          className={tab === "documents" ? styles.activeTab : undefined}
          type="button"
          role="tab"
          aria-selected={tab === "documents"}
          onClick={() => setTab("documents")}
        >
          Published documents <span>{documents.length}</span>
        </button>
        <button
          className={tab === "procurement" ? styles.activeTab : undefined}
          type="button"
          role="tab"
          aria-selected={tab === "procurement"}
          onClick={() => setTab("procurement")}
        >
          Procurement notices <span>{procurement.length}</span>
        </button>
      </div>

      {tab === "overview" ? (
        <section className={styles.transparencyOverview} role="tabpanel">
          <article className={styles.utilizationPanel}>
            <div className={styles.transparencyPanelHeader}>
              <div>
                <Landmark size={18} />
                <span>
                  <h2>Fund utilization</h2>
                  <p>Disbursement against approved appropriation</p>
                </span>
              </div>
              <strong>{utilization}% overall</strong>
            </div>
            <div className={styles.fundList}>
              {groupedFunds.map((fund) => {
                const percent = fund.appropriated ? Math.round((fund.disbursed / fund.appropriated) * 100) : 0;
                return (
                  <div className={styles.fundRow} key={fund.fund}>
                    <div>
                      <strong>{fund.fund}</strong>
                      <span>
                        {currency.format(fund.disbursed)} of {currency.format(fund.appropriated)}
                      </span>
                    </div>
                    <div className={styles.fundProgress}>
                      <span>
                        <i style={{ width: `${percent}%` }} />
                      </span>
                      <strong>{percent}%</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className={styles.latestPublications}>
            <div className={styles.transparencyPanelHeader}>
              <div>
                <FileText size={18} />
                <span>
                  <h2>Latest publications</h2>
                  <p>Recently approved public records</p>
                </span>
              </div>
              <button type="button" onClick={() => setTab("documents")}>
                View all
              </button>
            </div>
            <div className={styles.publicationList}>
              {latestDocuments.map((document) => (
                <button type="button" key={document.id} onClick={() => setSelectedDocument(document)}>
                  <span className={styles.documentIcon}>
                    {document.format === "XLSX" ? <FileSpreadsheet size={17} /> : <FileText size={17} />}
                  </span>
                  <span>
                    <small>
                      {document.type} · {barangayName(document.barangayId)}
                    </small>
                    <strong>{document.title}</strong>
                    <em>Published {formatDate(document.publishedAt)}</em>
                  </span>
                  <ArrowRight size={15} />
                </button>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      {tab === "documents" ? (
        <section className={styles.documentWorkspace} role="tabpanel">
          <div className={styles.transparencyToolbar}>
            <label>
              <Search size={16} />
              <span className={styles.srOnly}>Search public documents</span>
              <input
                type="search"
                placeholder="Search title, barangay, or reference"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <select
              aria-label="Filter public document type"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
            >
              <option value="all">All document types</option>
              <option value="Annual Budget">Annual Budget</option>
              <option value="Financial Statement">Financial Statement</option>
              <option value="Fund Utilization">Fund Utilization</option>
              <option value="Procurement Plan">Procurement Plan</option>
              <option value="Accomplishment Report">Accomplishment Report</option>
            </select>
            <span>{filteredDocuments.length} records</span>
          </div>
          <div className={styles.documentTableWrap}>
            <table className={styles.publicTable}>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Barangay</th>
                  <th>Period</th>
                  <th>Published</th>
                  <th>Status</th>
                  <th>
                    <span className={styles.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <button
                        className={styles.documentTitleButton}
                        type="button"
                        onClick={() => setSelectedDocument(document)}
                      >
                        <span className={styles.documentIcon}>
                          {document.format === "XLSX" ? <FileSpreadsheet size={16} /> : <FileText size={16} />}
                        </span>
                        <span>
                          <strong>{document.title}</strong>
                          <small>
                            {document.id} · {document.format}
                          </small>
                        </span>
                      </button>
                    </td>
                    <td>Brgy. {barangayName(document.barangayId)}</td>
                    <td>{document.period}</td>
                    <td>{formatDate(document.publishedAt)}</td>
                    <td>
                      <span
                        className={document.status === "Published" ? styles.statusPublished : styles.statusSuperseded}
                      >
                        {document.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.downloadButton}
                        type="button"
                        aria-label={`Download ${document.title}`}
                        onClick={() => downloadDocument(document)}
                      >
                        <Download size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "procurement" ? (
        <section className={styles.procurementGrid} role="tabpanel">
          {procurement.map((notice) => (
            <article className={styles.procurementCard} key={notice.id}>
              <div>
                <span className={notice.status === "Open" ? styles.statusOpen : styles.statusPublished}>
                  {notice.status}
                </span>
                <small>{notice.stage}</small>
              </div>
              <h2>{notice.title}</h2>
              <p>
                <Building2 size={14} /> Brgy. {barangayName(notice.barangayId)}
              </p>
              <dl>
                <div>
                  <dt>Reference</dt>
                  <dd>{notice.reference}</dd>
                </div>
                <div>
                  <dt>Mode</dt>
                  <dd>{notice.procurementMode}</dd>
                </div>
                <div>
                  <dt>Approved budget</dt>
                  <dd>{currency.format(notice.approvedBudget)}</dd>
                </div>
                <div>
                  <dt>{notice.status === "Open" ? "Closes" : "Closing date"}</dt>
                  <dd>{formatDate(notice.closingAt)}</dd>
                </div>
              </dl>
              <Link href="/public/feedback">
                Ask about this notice <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </section>
      ) : null}

      {selectedDocument ? (
        <div className={styles.documentDialogBackdrop} role="presentation">
          <section
            className={styles.documentDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-dialog-title"
          >
            <button
              className={styles.dialogClose}
              type="button"
              aria-label="Close document details"
              onClick={() => setSelectedDocument(null)}
            >
              <X size={18} />
            </button>
            <span className={styles.documentDialogIcon}>
              {selectedDocument.format === "XLSX" ? <FileSpreadsheet size={24} /> : <FileText size={24} />}
            </span>
            <span className={styles.eyebrow}>{selectedDocument.type}</span>
            <h2 id="document-dialog-title">{selectedDocument.title}</h2>
            <p>Published public record for Brgy. {barangayName(selectedDocument.barangayId)}.</p>
            <dl>
              <div>
                <dt>Reference</dt>
                <dd>{selectedDocument.id}</dd>
              </div>
              <div>
                <dt>Fiscal period</dt>
                <dd>{selectedDocument.period}</dd>
              </div>
              <div>
                <dt>Published</dt>
                <dd>{formatDate(selectedDocument.publishedAt)}</dd>
              </div>
              <div>
                <dt>File</dt>
                <dd>
                  {selectedDocument.format} · {selectedDocument.pages}{" "}
                  {selectedDocument.pages === 1 ? "sheet" : "pages"}
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <CheckCircle2 size={14} /> {selectedDocument.status}
                </dd>
              </div>
            </dl>
            <button className={styles.primaryDownload} type="button" onClick={() => downloadDocument(selectedDocument)}>
              <Download size={16} /> Download public document
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
