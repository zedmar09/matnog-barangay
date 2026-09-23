"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Filter,
  FolderKanban,
  Landmark,
  MapPin,
  MessageSquareText,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";

import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "../components/public-portal.module.css";
import { barangayName, PUBLIC_PROJECTS, type PublicProject } from "../data/public-data";

const currency = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-PH");
const date = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" });

function formatDate(value: string) {
  return date.format(new Date(`${value}T00:00:00`));
}

function statusClass(status: PublicProject["status"]) {
  if (status === "Completed") return styles.projectCompleted;
  if (status === "In progress") return styles.projectActive;
  if (status === "Procurement") return styles.projectProcurement;
  return styles.projectPlanning;
}

function ProjectCard({ project }: { project: PublicProject }) {
  return (
    <Link className={styles.publicProjectCard} href={`/public/projects/${project.id}`}>
      <div className={styles.projectVisual}>
        <span>
          <Building2 size={28} />
        </span>
        <em>{project.category}</em>
        <strong className={statusClass(project.status)}>{project.status}</strong>
      </div>
      <div className={styles.projectCardBody}>
        <small>
          <MapPin size={12} /> Brgy. {barangayName(project.barangayId)} · FY {project.fiscalYear}
        </small>
        <h2>{project.title}</h2>
        <p>{project.description}</p>
        <div className={styles.projectCardFacts}>
          <span>
            <small>Budget</small>
            <strong>{currency.format(project.budget)}</strong>
          </span>
          <span>
            <small>Beneficiaries</small>
            <strong>{number.format(project.beneficiaries)}</strong>
          </span>
        </div>
        <div className={styles.projectProgress}>
          <div>
            <span>Physical progress</span>
            <strong>{project.completion}%</strong>
          </div>
          <span>
            <i style={{ width: `${project.completion}%` }} />
          </span>
        </div>
        <div className={styles.cardLink}>
          View project details <ArrowRight size={15} />
        </div>
      </div>
    </Link>
  );
}

export function PublicProjectsDirectoryView() {
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [fiscalYear, setFiscalYear] = useState("all");
  const categories = [...new Set(PUBLIC_PROJECTS.map((project) => project.category))].sort();

  const scopedProjects = useMemo(
    () => PUBLIC_PROJECTS.filter((project) => selectedBarangay === "all" || project.barangayId === selectedBarangay),
    [selectedBarangay],
  );
  const projects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return scopedProjects.filter(
      (project) =>
        (!normalized ||
          project.title.toLowerCase().includes(normalized) ||
          project.id.toLowerCase().includes(normalized) ||
          barangayName(project.barangayId).toLowerCase().includes(normalized) ||
          project.contractor.toLowerCase().includes(normalized)) &&
        (status === "all" || project.status === status) &&
        (category === "all" || project.category === category) &&
        (fiscalYear === "all" || project.fiscalYear === Number(fiscalYear)),
    );
  }, [category, fiscalYear, query, scopedProjects, status]);

  const totalInvestment = scopedProjects.reduce((sum, project) => sum + project.budget, 0);
  const active = scopedProjects.filter((project) => project.status === "In progress").length;
  const completed = scopedProjects.filter((project) => project.status === "Completed").length;
  const averageProgress = scopedProjects.length
    ? Math.round(scopedProjects.reduce((sum, project) => sum + project.completion, 0) / scopedProjects.length)
    : 0;

  return (
    <div className={styles.projectsPage}>
      <section className={styles.publicPageHeader}>
        <div>
          <span className={styles.eyebrow}>Public project monitoring</span>
          <h1>Public Projects</h1>
          <p>
            Track budgets, contractors, status, completion, and approved progress evidence for {selectedBarangayName}.
          </p>
        </div>
        <span className={styles.publicDataBadge}>
          <CheckCircle2 size={15} /> Published project information
        </span>
      </section>

      <section className={styles.projectMetrics}>
        <div>
          <span className={styles.metricIcon}>
            <FolderKanban size={19} />
          </span>
          <span>
            <small>Published projects</small>
            <strong>{scopedProjects.length}</strong>
            <em>{selectedBarangayName}</em>
          </span>
        </div>
        <div>
          <span className={styles.metricIcon}>
            <CircleDollarSign size={19} />
          </span>
          <span>
            <small>Total investment</small>
            <strong>{currency.format(totalInvestment)}</strong>
            <em>Published approved budgets</em>
          </span>
        </div>
        <div>
          <span className={styles.metricIcon}>
            <TrendingUp size={19} />
          </span>
          <span>
            <small>Average completion</small>
            <strong>{averageProgress}%</strong>
            <em>{active} currently in progress</em>
          </span>
        </div>
        <div>
          <span className={styles.metricIcon}>
            <CheckCircle2 size={19} />
          </span>
          <span>
            <small>Completed projects</small>
            <strong>{completed}</strong>
            <em>Public completion records</em>
          </span>
        </div>
      </section>

      <section className={styles.projectFilters}>
        <label>
          <Search size={16} />
          <span className={styles.srOnly}>Search public projects</span>
          <input
            type="search"
            placeholder="Search project, barangay, contractor, or reference"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select aria-label="Filter project status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="Planning">Planning</option>
          <option value="Procurement">Procurement</option>
          <option value="In progress">In progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select
          aria-label="Filter project category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="all">All project types</option>
          {categories.map((item) => (
            <option value={item} key={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter project fiscal year"
          value={fiscalYear}
          onChange={(event) => setFiscalYear(event.target.value)}
        >
          <option value="all">All fiscal years</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
        </select>
      </section>

      <div className={styles.projectResultsHeading}>
        <span>
          <Filter size={14} /> {projects.length} matching {projects.length === 1 ? "project" : "projects"}
        </span>
        <small>Latest public update first</small>
      </div>

      <section className={styles.publicProjectGrid} aria-label="Public projects">
        {projects.map((project) => (
          <ProjectCard project={project} key={project.id} />
        ))}
      </section>

      {projects.length === 0 ? (
        <div className={styles.directoryEmpty}>
          <Search size={24} />
          <h2>No project matched the filters</h2>
          <p>Change or clear the project filters to see more results.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatus("all");
              setCategory("all");
              setFiscalYear("all");
            }}
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function PublicProjectDetailView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { scopeHydrated, setSelectedBarangay } = useBarangayScope();
  const project = PUBLIC_PROJECTS.find((candidate) => candidate.id === projectId);

  useEffect(() => {
    if (scopeHydrated && project) setSelectedBarangay(project.barangayId);
  }, [project, scopeHydrated, setSelectedBarangay]);

  if (!project) {
    return (
      <div className={styles.directoryEmpty}>
        <FolderKanban size={28} />
        <h1>Project not found</h1>
        <p>The requested project is not in the public directory.</p>
        <button type="button" onClick={() => router.push("/public/projects")}>
          Return to projects
        </button>
      </div>
    );
  }

  return (
    <div className={styles.projectDetailPage}>
      <Link className={styles.backLink} href="/public/projects">
        <ArrowLeft size={15} /> Public projects
      </Link>
      <section className={styles.projectDetailHeader}>
        <div>
          <div className={styles.projectDetailLabels}>
            <span>{project.category}</span>
            <strong className={statusClass(project.status)}>{project.status}</strong>
            <em>FY {project.fiscalYear}</em>
          </div>
          <h1>{project.title}</h1>
          <p>
            <MapPin size={14} /> Brgy. {barangayName(project.barangayId)}, Matnog, Sorsogon
          </p>
          <div className={styles.profileActions}>
            <Link className={styles.primaryButton} href={`/public/feedback?project=${project.id}`}>
              Give project feedback <MessageSquareText size={15} />
            </Link>
            <Link className={styles.secondaryButton} href="/public/transparency">
              View related disclosures
            </Link>
          </div>
        </div>
        <aside className={styles.projectCompletionCard}>
          <span>Physical accomplishment</span>
          <strong>{project.completion}%</strong>
          <div>
            <i style={{ width: `${project.completion}%` }} />
          </div>
          <small>Latest validated public update</small>
        </aside>
      </section>

      <section className={styles.projectDetailMetrics}>
        <div>
          <CircleDollarSign size={18} />
          <span>
            <small>Approved budget</small>
            <strong>{currency.format(project.budget)}</strong>
          </span>
        </div>
        <div>
          <Building2 size={18} />
          <span>
            <small>Contractor / implementer</small>
            <strong>{project.contractor}</strong>
          </span>
        </div>
        <div>
          <Users size={18} />
          <span>
            <small>Estimated beneficiaries</small>
            <strong>{number.format(project.beneficiaries)}</strong>
          </span>
        </div>
        <div>
          <CalendarDays size={18} />
          <span>
            <small>Target completion</small>
            <strong>{formatDate(project.targetDate)}</strong>
          </span>
        </div>
      </section>

      <section className={styles.projectDetailGrid}>
        <div className={styles.projectMainColumn}>
          <article className={styles.projectDetailPanel}>
            <div className={styles.detailPanelHeading}>
              <div>
                <FolderKanban size={18} />
                <span>
                  <h2>Project overview</h2>
                  <p>Public scope and delivery information</p>
                </span>
              </div>
            </div>
            <p className={styles.projectDescription}>{project.description}</p>
            <dl className={styles.projectFactsList}>
              <div>
                <dt>Project reference</dt>
                <dd>{project.id}</dd>
              </div>
              <div>
                <dt>Funding source</dt>
                <dd>{project.fundSource}</dd>
              </div>
              <div>
                <dt>Start date</dt>
                <dd>{formatDate(project.startDate)}</dd>
              </div>
              <div>
                <dt>Target date</dt>
                <dd>{formatDate(project.targetDate)}</dd>
              </div>
            </dl>
          </article>

          <article className={styles.projectDetailPanel}>
            <div className={styles.detailPanelHeading}>
              <div>
                <Camera size={18} />
                <span>
                  <h2>Approved public photos</h2>
                  <p>Validated progress evidence cleared for publication</p>
                </span>
              </div>
              <em>{project.photos.length} photos</em>
            </div>
            {project.photos.length ? (
              <div className={styles.projectPhotoGrid}>
                {project.photos.map((photo, index) => (
                  <div className={styles.projectPhoto} key={photo.id}>
                    <div>
                      <Camera size={26} />
                      <span>Project photo {index + 1}</span>
                    </div>
                    <strong>{photo.caption}</strong>
                    <small>Captured {formatDate(photo.capturedAt)}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.projectPhotoEmpty}>
                <Camera size={22} />
                <strong>Progress photos will appear after field validation</strong>
                <p>No approved public photos are available at this stage.</p>
              </div>
            )}
          </article>
        </div>

        <aside className={styles.projectTimelinePanel}>
          <div className={styles.detailPanelHeading}>
            <div>
              <Clock3 size={18} />
              <span>
                <h2>Public updates</h2>
                <p>Validated project milestones</p>
              </span>
            </div>
          </div>
          <div className={styles.projectTimeline}>
            {[...project.updates].reverse().map((update) => (
              <div key={`${update.date}-${update.title}`}>
                <span>
                  <CheckCircle2 size={13} />
                </span>
                <div>
                  <small>
                    {formatDate(update.date)} · {update.completion}% complete
                  </small>
                  <strong>{update.title}</strong>
                  <p>{update.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.projectAccountability}>
            <Landmark size={18} />
            <div>
              <strong>Public accountability</strong>
              <p>
                Questions and observations may be submitted through the feedback channel and linked to this project
                reference.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
