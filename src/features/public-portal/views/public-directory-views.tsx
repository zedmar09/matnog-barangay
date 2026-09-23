"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  FolderKanban,
  House,
  Mail,
  MapPin,
  Phone,
  Search,
  Users,
  UsersRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "../components/public-portal.module.css";
import {
  BARANGAY_OFFICIALS,
  barangayName,
  officialsForScope,
  PUBLIC_BARANGAY_PROFILES,
  type PublicOfficial,
  profileForBarangay,
  publicContentForScope,
} from "../data/public-data";

const number = new Intl.NumberFormat("en-PH");
const currency = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

function initials(name: string) {
  return name
    .replace("Hon. ", "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function OfficialCard({ official, showBarangay = false }: { official: PublicOfficial; showBarangay?: boolean }) {
  return (
    <article className={styles.officialCard}>
      <span className={styles.officialAvatar} aria-hidden="true">
        {initials(official.name)}
      </span>
      <div>
        <span className={styles.officialRole}>{official.role}</span>
        <h3>{official.name}</h3>
        <p>{official.committee}</p>
        {showBarangay && official.scope === "barangay" ? (
          <Link href={`/public/barangays/${official.barangayId}`}>
            <MapPin size={12} /> Brgy. {barangayName(official.barangayId)}
          </Link>
        ) : null}
      </div>
      <span className={styles.termBadge}>{official.term}</span>
    </article>
  );
}

export function BarangayDirectoryView() {
  const { selectedBarangay, selectedBarangayName, setSelectedBarangay } = useBarangayScope();
  const [query, setQuery] = useState("");
  const profiles = useMemo(() => {
    const scoped =
      selectedBarangay === "all"
        ? PUBLIC_BARANGAY_PROFILES
        : PUBLIC_BARANGAY_PROFILES.filter((profile) => profile.code === selectedBarangay);
    const normalized = query.trim().toLowerCase();
    return normalized ? scoped.filter((profile) => profile.name.toLowerCase().includes(normalized)) : scoped;
  }, [query, selectedBarangay]);

  const population = profiles.reduce((sum, profile) => sum + profile.populationEstimate, 0);
  const households = profiles.reduce((sum, profile) => sum + profile.householdEstimate, 0);

  return (
    <div className={styles.directoryPage}>
      <section className={styles.publicPageHeader}>
        <div>
          <span className={styles.eyebrow}>Community directory</span>
          <h1>{selectedBarangay === "all" ? "Matnog Barangays" : selectedBarangayName}</h1>
          <p>
            {selectedBarangay === "all"
              ? "Explore official public profiles for all 40 barangays of Matnog."
              : `Public community profile and office information for ${selectedBarangayName}.`}
          </p>
        </div>
        {selectedBarangay !== "all" ? (
          <button className={styles.outlineButton} type="button" onClick={() => setSelectedBarangay("all")}>
            View all 40 barangays
          </button>
        ) : null}
      </section>

      <section className={styles.directoryMetrics} aria-label="Barangay directory summary">
        <div>
          <Building2 size={18} />
          <span>
            <strong>{profiles.length}</strong>Barangays shown
          </span>
        </div>
        <div>
          <Users size={18} />
          <span>
            <strong>{number.format(population)}</strong>Estimated population
          </span>
        </div>
        <div>
          <House size={18} />
          <span>
            <strong>{number.format(households)}</strong>Estimated households
          </span>
        </div>
        <div>
          <CheckCircle2 size={18} />
          <span>
            <strong>{profiles.length}</strong>Published profiles
          </span>
        </div>
      </section>

      <section className={styles.directoryToolbar}>
        <label>
          <Search size={17} aria-hidden="true" />
          <span className={styles.srOnly}>Search barangays</span>
          <input
            type="search"
            placeholder="Search barangay name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <span>
          {profiles.length} public {profiles.length === 1 ? "profile" : "profiles"}
        </span>
      </section>

      <section className={styles.barangayGrid} aria-label="Barangay public profiles">
        {profiles.map((profile) => {
          const captain = BARANGAY_OFFICIALS.find(
            (official) => official.barangayId === profile.code && official.role === "Punong Barangay",
          );
          const { projects } = publicContentForScope(profile.code);
          return (
            <Link
              className={styles.barangayCard}
              href={`/public/barangays/${profile.code}`}
              key={profile.code}
              onClick={() => setSelectedBarangay(profile.code)}
            >
              <div className={styles.barangayCardTop}>
                <span className={styles.serviceIcon}>
                  <Building2 size={20} />
                </span>
                <span className={styles.classificationBadge}>{profile.classification}</span>
              </div>
              <h2>Brgy. {profile.name}</h2>
              <p>{profile.address}</p>
              <div className={styles.cardFacts}>
                <span>
                  <Users size={14} />
                  <strong>{number.format(profile.populationEstimate)}</strong> population
                </span>
                <span>
                  <House size={14} />
                  <strong>{number.format(profile.householdEstimate)}</strong> households
                </span>
                <span>
                  <FolderKanban size={14} />
                  <strong>{projects.length}</strong> public projects
                </span>
              </div>
              <div className={styles.cardOfficial}>
                <span>{captain ? initials(captain.name) : "PB"}</span>
                <div>
                  <small>Punong Barangay</small>
                  <strong>{captain?.name ?? "Office of the Punong Barangay"}</strong>
                </div>
              </div>
              <div className={styles.cardLink}>
                View public profile <ArrowRight size={15} />
              </div>
            </Link>
          );
        })}
      </section>

      {profiles.length === 0 ? (
        <div className={styles.directoryEmpty}>
          <Search size={24} />
          <h2>No barangay matched your search</h2>
          <p>Try another spelling or clear the search field.</p>
          <button type="button" onClick={() => setQuery("")}>
            Clear search
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function BarangayProfileView({ code }: { code: string }) {
  const router = useRouter();
  const { scopeHydrated, setSelectedBarangay } = useBarangayScope();
  const profile = profileForBarangay(code);

  useEffect(() => {
    if (scopeHydrated && profile) setSelectedBarangay(profile.code);
  }, [profile, scopeHydrated, setSelectedBarangay]);

  if (!profile) {
    return (
      <div className={styles.directoryEmpty}>
        <Building2 size={28} />
        <h1>Barangay profile not found</h1>
        <p>The requested barangay is not part of the Matnog public directory.</p>
        <button type="button" onClick={() => router.push("/public/barangays")}>
          Return to directory
        </button>
      </div>
    );
  }

  const officials = BARANGAY_OFFICIALS.filter((official) => official.barangayId === profile.code);
  const { projects, notices } = publicContentForScope(profile.code);
  const activeProjects = projects.filter((project) => project.status !== "Completed");
  const projectValue = projects.reduce((sum, project) => sum + project.budget, 0);

  return (
    <div className={styles.profilePage}>
      <Link className={styles.backLink} href="/public/barangays">
        <ArrowLeft size={15} /> Barangay directory
      </Link>
      <section className={styles.profileHero}>
        <div>
          <span className={styles.eyebrow}>{profile.classification} barangay</span>
          <h1>Brgy. {profile.name}</h1>
          <p>{profile.about}</p>
          <div className={styles.profileActions}>
            <Link className={styles.primaryButton} href="/public/officials">
              View officials <ArrowRight size={15} />
            </Link>
            <Link className={styles.secondaryButton} href="/public/feedback">
              Send feedback
            </Link>
          </div>
        </div>
        <aside className={styles.officeCard}>
          <span className={styles.serviceIcon}>
            <Building2 size={21} />
          </span>
          <h2>Barangay Hall</h2>
          <p>
            <MapPin size={14} />
            {profile.address}
          </p>
          <p>
            <Phone size={14} />
            {profile.officePhone}
          </p>
          <p>
            <Mail size={14} />
            {profile.officeEmail}
          </p>
          <p>
            <CalendarDays size={14} />
            {profile.officeHours}
          </p>
        </aside>
      </section>

      <section className={styles.profileMetrics}>
        <div>
          <span>Estimated population</span>
          <strong>{number.format(profile.populationEstimate)}</strong>
          <small>Public planning estimate</small>
        </div>
        <div>
          <span>Estimated households</span>
          <strong>{number.format(profile.householdEstimate)}</strong>
          <small>Aggregate count only</small>
        </div>
        <div>
          <span>Land area</span>
          <strong>{number.format(profile.landAreaHectares)} ha</strong>
          <small>{profile.sitios} sitios</small>
        </div>
        <div>
          <span>Public projects</span>
          <strong>{projects.length}</strong>
          <small>
            {activeProjects.length} active · {currency.format(projectValue)}
          </small>
        </div>
      </section>

      <section className={styles.profileContentGrid}>
        <article className={styles.profilePanel}>
          <div className={styles.profilePanelHeader}>
            <div>
              <UsersRound size={18} />
              <h2>Barangay officials</h2>
            </div>
            <Link href="/public/officials">View complete directory</Link>
          </div>
          <div className={styles.compactOfficials}>
            {officials.slice(0, 4).map((official) => (
              <OfficialCard official={official} key={official.id} />
            ))}
          </div>
        </article>

        <article className={styles.profilePanel}>
          <div className={styles.profilePanelHeader}>
            <div>
              <FileText size={18} />
              <h2>Public activity</h2>
            </div>
            <Link href="/public/transparency">Transparency center</Link>
          </div>
          <div className={styles.publicActivityList}>
            <Link href="/public/projects">
              <FolderKanban size={17} />
              <span>
                <strong>{activeProjects.length} active projects</strong>
                <small>{currency.format(projectValue)} published project value</small>
              </span>
              <ArrowRight size={15} />
            </Link>
            <Link href="/public/transparency">
              <FileText size={17} />
              <span>
                <strong>{notices.length} current notices</strong>
                <small>Municipal and barangay publications</small>
              </span>
              <ArrowRight size={15} />
            </Link>
            <Link href="/public/feedback">
              <ExternalLink size={17} />
              <span>
                <strong>Public feedback channel</strong>
                <small>Routes directly to Brgy. {profile.name}</small>
              </span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

export function OfficialsDirectoryView() {
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const officials = officialsForScope(selectedBarangay);
  const allOfficials = [...officials.municipal, ...officials.barangay];
  const roles = [...new Set(allOfficials.map((official) => official.role))].sort();
  const matches = (official: PublicOfficial) => {
    const normalized = query.trim().toLowerCase();
    const queryMatch =
      !normalized ||
      official.name.toLowerCase().includes(normalized) ||
      official.role.toLowerCase().includes(normalized) ||
      official.committee.toLowerCase().includes(normalized);
    return queryMatch && (roleFilter === "all" || official.role === roleFilter);
  };
  const municipalMatches = officials.municipal.filter(matches);
  const barangayMatches = officials.barangay.filter(matches);

  return (
    <div className={styles.directoryPage}>
      <section className={styles.publicPageHeader}>
        <div>
          <span className={styles.eyebrow}>Public officials</span>
          <h1>{selectedBarangay === "all" ? "Officials Directory" : `Officials serving ${selectedBarangayName}`}</h1>
          <p>Published offices, responsibilities, terms, and official contact channels.</p>
        </div>
        <span className={styles.publicDataBadge}>
          <CheckCircle2 size={15} /> Public office information
        </span>
      </section>

      <section className={styles.officialsSummary}>
        <div>
          <strong>{municipalMatches.length}</strong>
          <span>Municipal officials</span>
        </div>
        <div>
          <strong>{barangayMatches.length}</strong>
          <span>{selectedBarangay === "all" ? "Punong Barangays" : "Barangay officials"}</span>
        </div>
        <div>
          <strong>{selectedBarangay === "all" ? MATNOG_BARANGAYS.length : 1}</strong>
          <span>Barangays represented</span>
        </div>
      </section>

      <section className={styles.officialsToolbar}>
        <label>
          <Search size={17} />
          <span className={styles.srOnly}>Search officials</span>
          <input
            type="search"
            placeholder="Search name, role, or committee"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select
          aria-label="Filter officials by role"
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
        >
          <option value="all">All roles</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </section>

      {municipalMatches.length > 0 ? (
        <section className={styles.officialGroup}>
          <div className={styles.groupHeading}>
            <div>
              <Building2 size={18} />
              <span>
                <strong>Municipal officials</strong>
                <small>Municipality-wide public offices</small>
              </span>
            </div>
            <em>{municipalMatches.length}</em>
          </div>
          <div className={styles.officialGrid}>
            {municipalMatches.map((official) => (
              <OfficialCard official={official} key={official.id} />
            ))}
          </div>
        </section>
      ) : null}

      {barangayMatches.length > 0 ? (
        <section className={styles.officialGroup}>
          <div className={styles.groupHeading}>
            <div>
              <UsersRound size={18} />
              <span>
                <strong>
                  {selectedBarangay === "all" ? "Barangay leadership" : `${selectedBarangayName} officials`}
                </strong>
                <small>
                  {selectedBarangay === "all"
                    ? "Punong Barangays across all 40 communities"
                    : "Barangay council and administrative offices"}
                </small>
              </span>
            </div>
            <em>{barangayMatches.length}</em>
          </div>
          <div className={styles.officialGrid}>
            {barangayMatches.map((official) => (
              <OfficialCard official={official} key={official.id} showBarangay={selectedBarangay === "all"} />
            ))}
          </div>
        </section>
      ) : null}

      {municipalMatches.length + barangayMatches.length === 0 ? (
        <div className={styles.directoryEmpty}>
          <Search size={24} />
          <h2>No official matched the filters</h2>
          <p>Change the search or select another role.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setRoleFilter("all");
            }}
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  );
}
