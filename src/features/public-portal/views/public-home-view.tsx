"use client";

import Link from "next/link";

import {
  ArrowRight,
  BadgeCheck,
  Building,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  FileText,
  FolderSearch2,
  Landmark,
  MapPinned,
  MessageSquareText,
  SearchCheck,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "../components/public-portal.module.css";
import { barangayName, publicContentForScope } from "../data/public-data";

const quickServices = [
  {
    title: "Barangays",
    description: "Browse the profiles and public information of Matnog's 40 barangays.",
    href: "/public/barangays",
    icon: MapPinned,
  },
  {
    title: "Officials",
    description: "View municipal and barangay officials serving the selected community.",
    href: "/public/officials",
    icon: UsersRound,
  },
  {
    title: "Transparency",
    description: "Access budgets, financial reports, procurement notices, and utilization summaries.",
    href: "/public/transparency",
    icon: Landmark,
  },
  {
    title: "Projects",
    description: "Follow public projects, budgets, implementation status, and completion progress.",
    href: "/public/projects",
    icon: Building,
  },
  {
    title: "Verify a document",
    description: "Check the status of an official document using its QR code or reference number.",
    href: "/public/verify",
    icon: SearchCheck,
  },
  {
    title: "Feedback",
    description: "Send a concern or suggestion and receive a tracking reference.",
    href: "/public/feedback",
    icon: MessageSquareText,
  },
] as const;

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const date = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" });

export function PublicHomeView() {
  const { selectedBarangay, selectedBarangayName } = useBarangayScope();
  const { projects, notices } = publicContentForScope(selectedBarangay);
  const activeProjects = projects.filter((project) => project.status !== "Completed");
  const publishedValue = projects.reduce((sum, project) => sum + project.budget, 0);
  const featuredProjects = projects.filter((project) => project.status !== "Completed").slice(0, 3);
  const latestNotices = [...notices]
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
    .slice(0, 4);
  const isMunicipal = selectedBarangay === "all";

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>
            <ShieldCheck size={16} aria-hidden="true" /> Official public information
          </span>
          <h1>
            {isMunicipal
              ? "Transparent local governance for every Matnog community"
              : `${selectedBarangayName} Public Information Portal`}
          </h1>
          <p>
            {isMunicipal
              ? "Explore barangay information, public officials, financial disclosures, projects, document verification, and citizen feedback in one place."
              : `View published officials, disclosures, projects, notices, and public services for ${selectedBarangayName}.`}
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/public/projects">
              Explore public projects <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link className={styles.secondaryButton} href="/public/verify">
              <FileCheck2 size={16} aria-hidden="true" /> Verify a document
            </Link>
          </div>
          <div className={styles.trustRow}>
            <span>
              <CheckCircle2 size={15} /> Public records only
            </span>
            <span>
              <CheckCircle2 size={15} /> Updated by authorized offices
            </span>
            <span>
              <CheckCircle2 size={15} /> No resident data displayed
            </span>
          </div>
        </div>

        <aside className={styles.heroPanel} aria-label="Current public information summary">
          <div className={styles.panelHeader}>
            <div>
              <span>Current scope</span>
              <strong>{selectedBarangayName}</strong>
            </div>
            <BadgeCheck size={23} aria-hidden="true" />
          </div>
          <div className={styles.heroStats}>
            <div>
              <strong>{isMunicipal ? MATNOG_BARANGAYS.length : 1}</strong>
              <span>{isMunicipal ? "Barangays covered" : "Selected barangay"}</span>
            </div>
            <div>
              <strong>{activeProjects.length}</strong>
              <span>Active projects</span>
            </div>
            <div>
              <strong>{notices.length}</strong>
              <span>Published notices</span>
            </div>
            <div>
              <strong>{currency.format(publishedValue)}</strong>
              <span>Published project value</span>
            </div>
          </div>
          <Link href="/public/transparency">
            Open transparency center <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </aside>
      </section>

      <section className={styles.publicSection} aria-labelledby="public-services-title">
        <div className={styles.sectionHeading}>
          <div>
            <span>Public services</span>
            <h2 id="public-services-title">What would you like to find?</h2>
          </div>
          <p>Information shown below follows your selected barangay.</p>
        </div>
        <div className={styles.serviceGrid}>
          {quickServices.map((service) => {
            const Icon = service.icon;
            return (
              <Link className={styles.serviceCard} href={service.href} key={service.href}>
                <span className={styles.serviceIcon}>
                  <Icon size={21} aria-hidden="true" />
                </span>
                <div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
                <ArrowRight className={styles.cardArrow} size={17} aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className={`${styles.publicSection} ${styles.activitySection}`}>
        <div className={styles.sectionHeading}>
          <div>
            <span>Latest from {selectedBarangayName}</span>
            <h2>Notices and active projects</h2>
          </div>
          <p>Recently published updates intended for public viewing.</p>
        </div>

        <div className={styles.activityGrid}>
          <article className={styles.contentPanel}>
            <div className={styles.contentPanelHeader}>
              <div>
                <FileText size={18} />
                <h3>Latest notices</h3>
              </div>
              <Link href="/public/transparency">View all</Link>
            </div>
            <div className={styles.noticeList}>
              {latestNotices.map((notice) => (
                <Link href="/public/transparency" key={notice.id}>
                  <span className={styles.noticeIcon}>
                    <FileText size={17} />
                  </span>
                  <span>
                    <small>{notice.type}</small>
                    <strong>{notice.title}</strong>
                    <em>
                      <CalendarDays size={13} /> {date.format(new Date(`${notice.publishedAt}T00:00:00`))}
                    </em>
                  </span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </article>

          <article className={styles.contentPanel}>
            <div className={styles.contentPanelHeader}>
              <div>
                <FolderSearch2 size={18} />
                <h3>Active public projects</h3>
              </div>
              <Link href="/public/projects">View all</Link>
            </div>
            <div className={styles.projectList}>
              {featuredProjects.map((project) => (
                <Link href={`/public/projects/${project.id}`} key={project.id}>
                  <div className={styles.projectTopline}>
                    <span>{project.category}</span>
                    <strong>{project.status}</strong>
                  </div>
                  <h4>{project.title}</h4>
                  <p>
                    {barangayName(project.barangayId)} · {currency.format(project.budget)}
                  </p>
                  <div className={styles.progressRow}>
                    <span>
                      <i style={{ width: `${project.completion}%` }} />
                    </span>
                    <small>{project.completion}% complete</small>
                  </div>
                </Link>
              ))}
              {featuredProjects.length === 0 ? (
                <div className={styles.emptyState}>
                  <CircleDollarSign size={22} />
                  <strong>No active projects published</strong>
                  <p>Published project updates will appear here.</p>
                </div>
              ) : null}
            </div>
          </article>
        </div>
      </section>

      <section className={styles.helpBand}>
        <div>
          <MessageSquareText size={24} aria-hidden="true" />
          <div>
            <h2>Help improve public services</h2>
            <p>Send feedback for {selectedBarangayName} and receive a reference for follow-up.</p>
          </div>
        </div>
        <Link href="/public/feedback">
          Send public feedback <ArrowRight size={16} />
        </Link>
      </section>
    </>
  );
}
