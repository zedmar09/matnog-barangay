"use client";

import { type FormEvent, useMemo, useState } from "react";

import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Fingerprint,
  LockKeyhole,
  ScanSearch,
  Search,
  ShieldCheck,
} from "lucide-react";

import { CURRENT_NAV_USER } from "@/components/navigation";
import { MATNOG_BARANGAYS } from "@/data/barangays";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
import {
  EMPTY_SEARCH_CRITERIA,
  maskMobile,
  type ResidentSearchCriteria,
  SEARCH_ACCESS,
  searchResidents,
} from "../utils/resident-search";
import { formatResidentAddress, formatResidentName } from "../utils/resident-utils";

const PAGE_SIZE = 20;

function confidenceClass(value: string) {
  if (value === "Exact") return styles.active;
  if (value === "Strong") return styles.info;
  return styles.warning;
}

export function ResidentSearchView() {
  const residents = useResidentRegistryStore((state) => state.residents);
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [draft, setDraft] = useState<ResidentSearchCriteria>(EMPTY_SEARCH_CRITERIA);
  const [criteria, setCriteria] = useState<ResidentSearchCriteria | null>(null);
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const access = SEARCH_ACCESS[CURRENT_NAV_USER.role];
  const results = useMemo(
    () => (criteria ? searchResidents(residents, criteria, CURRENT_NAV_USER.role, selectedBarangay) : []),
    [criteria, residents, selectedBarangay],
  );
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const visibleResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const setField = (field: keyof ResidentSearchCriteria, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }));

  const selectValue = (value: string) => value || "__all__";
  const fromSelectValue = (value: string) => (value === "__all__" ? "" : value);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!purpose) {
      setMessage("Select an authorized access purpose before searching.");
      return;
    }
    if (
      !draft.query.trim() &&
      !draft.birthDate &&
      !draft.mothersMaidenName.trim() &&
      !draft.mobile.trim() &&
      !draft.gender &&
      !draft.civilStatus &&
      !draft.citizenship.trim() &&
      !draft.occupation.trim() &&
      !draft.addressKeyword.trim()
    ) {
      setMessage("Enter at least one identity or personal information field before searching.");
      return;
    }
    setCriteria({ ...draft });
    setPage(1);
    setMessage("Search recorded in the session access log.");
  };
  const reset = () => {
    setDraft(EMPTY_SEARCH_CRITERIA);
    setCriteria(null);
    setPurpose("");
    setMessage("");
    setPage(1);
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <h1>Advanced Resident Search</h1>
            <p>Find possible resident matches across Matnog using names, identity details, and location signals.</p>
          </div>
        </div>
      </section>

      <div className={`${styles.body} ${styles.searchPageBody}`}>
        <div className={styles.searchLayout}>
          <form className={`${styles.card} ${styles.searchFormCard}`} onSubmit={submit}>
            <div className={styles.searchHero}>
              <div className={styles.searchHeroIcon}>
                <ScanSearch size={22} />
              </div>
              <div>
                <h2>Identity match search</h2>
                <p>Search handles punctuation, suffixes, nicknames, previous names, and minor spelling differences.</p>
              </div>
            </div>
            <div className={styles.formBody}>
              <label className={styles.field}>
                <span>Name or Local Resident Number *</span>
                <div className={styles.inputWithIcon}>
                  <Search size={16} />
                  <input
                    value={draft.query}
                    onChange={(event) => setField("query", event.target.value)}
                    placeholder="Example: Maria Dela Cruz, Marites, or LRN-…"
                  />
                </div>
                <small>Use the other identity fields when a name is incomplete or commonly shared.</small>
              </label>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Birth date</span>
                  <input
                    type="date"
                    value={draft.birthDate}
                    onChange={(event) => setField("birthDate", event.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>Mother’s maiden name</span>
                  <input
                    value={draft.mothersMaidenName}
                    onChange={(event) => setField("mothersMaidenName", event.target.value)}
                    placeholder="Full or partial name"
                  />
                </label>
                <label className={styles.field}>
                  <span>Mobile number</span>
                  <input
                    value={draft.mobile}
                    onChange={(event) => setField("mobile", event.target.value)}
                    placeholder="Full or last digits"
                  />
                </label>
                <div className={styles.field}>
                  <span>Sex</span>
                  <Select
                    value={selectValue(draft.gender)}
                    onValueChange={(value) => setField("gender", fromSelectValue(value))}
                  >
                    <SelectTrigger className={styles.searchSelect} aria-label="Sex">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className={styles.field}>
                  <span>Civil status</span>
                  <Select
                    value={selectValue(draft.civilStatus)}
                    onValueChange={(value) => setField("civilStatus", fromSelectValue(value))}
                  >
                    <SelectTrigger className={styles.searchSelect} aria-label="Civil status">
                      <SelectValue placeholder="All civil statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All civil statuses</SelectItem>
                      {["Single", "Married", "Widowed", "Separated", "Divorced", "Other"].map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className={styles.field}>
                  <span>Citizenship</span>
                  <input
                    value={draft.citizenship}
                    onChange={(event) => setField("citizenship", event.target.value)}
                    placeholder="Example: Filipino"
                  />
                </label>
                <label className={styles.field}>
                  <span>Occupation</span>
                  <input
                    value={draft.occupation}
                    onChange={(event) => setField("occupation", event.target.value)}
                    placeholder="Example: Farmer"
                  />
                </label>
                <label className={styles.field}>
                  <span>Purok, sitio, street, or landmark</span>
                  <input
                    value={draft.addressKeyword}
                    onChange={(event) => setField("addressKeyword", event.target.value)}
                    placeholder="Example: Purok 2 or Rizal Street"
                  />
                </label>
                <div className={styles.field}>
                  <span>Resident status</span>
                  <Select
                    value={selectValue(draft.residentStatus)}
                    onValueChange={(value) => setField("residentStatus", fromSelectValue(value))}
                  >
                    <SelectTrigger className={styles.searchSelect} aria-label="Resident status">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All statuses</SelectItem>
                      {["Active", "Inactive", "Transferred Out", "Deceased", "Merged"].map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {access.scope === "municipality" ? (
                  <div className={styles.field}>
                    <span>Barangay</span>
                    <Select
                      value={selectValue(draft.barangayId)}
                      onValueChange={(value) => setField("barangayId", fromSelectValue(value))}
                    >
                      <SelectTrigger className={styles.searchSelect} aria-label="Barangay">
                        <SelectValue placeholder="All 40 barangays" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All 40 barangays</SelectItem>
                        {MATNOG_BARANGAYS.map((barangay) => (
                          <SelectItem key={barangay.code} value={barangay.code}>
                            {barangay.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                <div className={`${styles.field} ${styles.span2}`}>
                  <span>Authorized access purpose *</span>
                  <Select
                    value={purpose || "__none__"}
                    onValueChange={(value) => setPurpose(value === "__none__" ? "" : value)}
                  >
                    <SelectTrigger className={styles.searchSelect} aria-label="Authorized access purpose">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select purpose</SelectItem>
                      <SelectItem value="Resident registration and duplicate prevention">
                        Resident registration and duplicate prevention
                      </SelectItem>
                      <SelectItem value="Resident record correction">Resident record correction</SelectItem>
                      <SelectItem value="Service eligibility verification">Service eligibility verification</SelectItem>
                      <SelectItem value="Authorized municipal transaction">Authorized municipal transaction</SelectItem>
                    </SelectContent>
                  </Select>
                  <small>The stated purpose is included in the search audit trail.</small>
                </div>
              </div>
            </div>
            <footer className={styles.searchActions}>
              <button type="button" className={styles.secondaryButton} onClick={reset}>
                Clear
              </button>
              <button type="submit" className={styles.primaryButton}>
                <ScanSearch size={15} /> Search residents
              </button>
            </footer>
          </form>

          <aside className={`${styles.card} ${styles.accessPanel}`}>
            <h2>
              <LockKeyhole size={16} /> Your search access
            </h2>
            <p>Permissions are applied before matches are returned.</p>
            <dl className={styles.accessFacts}>
              <div>
                <dt>Search scope</dt>
                <dd>{access.scope === "municipality" ? "All 40 barangays" : selectedBarangayName}</dd>
              </div>
              <div>
                <dt>Resident profile</dt>
                <dd>{access.canViewProfile ? "Allowed" : "Restricted"}</dd>
              </div>
              <div>
                <dt>Contact details</dt>
                <dd>{access.canViewContact ? "Visible" : "Masked"}</dd>
              </div>
              <div>
                <dt>Exact address</dt>
                <dd>{access.canViewExactAddress ? "Visible" : "Restricted"}</dd>
              </div>
            </dl>
            <div className={styles.privacyCallout}>
              <ShieldCheck size={17} />
              <span>
                Every search requires a work purpose. Sensitive identifiers and PhilSys references never appear in
                search results.
              </span>
            </div>
          </aside>
        </div>

        {message ? (
          <div className={message.startsWith("Search recorded") ? styles.toast : `${styles.toast} ${styles.error}`}>
            {message}
          </div>
        ) : null}

        <section className={`${styles.card} ${styles.searchResultsCard}`}>
          <div className={styles.resultsMeta}>
            <strong>
              {criteria ? `${results.length} possible ${results.length === 1 ? "match" : "matches"}` : "Search results"}
            </strong>
            <span>
              {criteria
                ? `${access.scope === "municipality" ? "Municipality-wide" : selectedBarangayName} · ${residents.length.toLocaleString()} indexed residents`
                : "Run an identity search to display matches"}
            </span>
          </div>
          {criteria && results.length ? (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table} style={{ minWidth: 1160 }}>
                  <thead>
                    <tr>
                      <th>Match</th>
                      <th>Resident</th>
                      <th>LRN</th>
                      <th>Barangay</th>
                      <th>Birth Date</th>
                      <th>Mobile</th>
                      <th>Address</th>
                      <th>Status</th>
                      <th>Matched Signals</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleResults.map(({ resident, score, confidence, signals }) => (
                      <tr key={resident.id}>
                        <td>
                          <div className={styles.matchScore}>
                            <strong>{score}</strong>
                            <span className={`${styles.badge} ${confidenceClass(confidence)}`}>{confidence}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.nameCell}>
                            <strong>{formatResidentName(resident)}</strong>
                            <small>
                              {resident.nickname ? `Also known as “${resident.nickname}”` : "Registered legal name"}
                            </small>
                          </div>
                        </td>
                        <td className={styles.mono}>{resident.lrn}</td>
                        <td>
                          {MATNOG_BARANGAYS.find((barangay) => barangay.code === resident.address.barangayId)?.name ??
                            "—"}
                        </td>
                        <td>{access.canViewBirthDate ? resident.birthDate : "Restricted"}</td>
                        <td>
                          {access.canViewContact
                            ? resident.contact.primaryMobile || "—"
                            : maskMobile(resident.contact.primaryMobile)}
                        </td>
                        <td>
                          <span className={styles.truncatedAddress}>
                            {access.canViewExactAddress
                              ? formatResidentAddress(resident.address)
                              : "Restricted by role"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.badge} ${resident.residentStatus === "Active" ? styles.active : resident.residentStatus === "Deceased" || resident.residentStatus === "Merged" ? styles.danger : styles.warning}`}
                          >
                            {resident.residentStatus}
                          </span>
                        </td>
                        <td>
                          <div className={styles.signals}>
                            {signals.map((signal) => (
                              <span className={styles.signal} key={signal}>
                                {signal}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          {access.canViewProfile ? (
                            <Link
                              className={styles.secondaryButton}
                              href={`/barangay-affairs/residents/${resident.id}`}
                            >
                              <Eye size={13} /> View
                            </Link>
                          ) : (
                            <span className={styles.restrictedLabel}>
                              <LockKeyhole size={13} /> Restricted
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.pagination}>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={page === 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={page === totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </>
          ) : (
            <div className={styles.empty}>
              <div>
                {criteria ? <Fingerprint size={30} /> : <ScanSearch size={30} />}
                <h3>{criteria ? "No possible matches" : "Search the municipal registry"}</h3>
                <p>
                  {criteria
                    ? "Try a spelling variation or remove one of the exact identity filters."
                    : "Use at least one identity field and provide an authorized purpose."}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
