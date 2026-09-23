"use client";

import { type ReactNode, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Building2, ChevronDown, ExternalLink, Menu, X } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "./public-portal.module.css";

const publicNavigation = [
  { label: "Home", href: "/" },
  { label: "Barangays", href: "/public/barangays" },
  { label: "Officials", href: "/public/officials" },
  { label: "Transparency", href: "/public/transparency" },
  { label: "Projects", href: "/public/projects" },
  { label: "Document Verification", href: "/public/verify" },
  { label: "Feedback", href: "/public/feedback" },
] as const;

export function PublicPortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { selectedBarangay, selectedBarangayName, setSelectedBarangay } = useBarangayScope();

  return (
    <div className={styles.publicShell}>
      <div className={styles.noticeBar}>
        <span>Official public information portal of the Municipality of Matnog</span>
        <Link href="/public/transparency">View latest disclosures</Link>
      </div>

      <header className={styles.publicHeader}>
        <div className={styles.headerInner}>
          <Link className={styles.publicBrand} href="/" aria-label="MATNOG BRGYS public portal home">
            <span className={styles.brandMark} aria-hidden="true">
              <Building2 size={23} strokeWidth={1.8} />
            </span>
            <span>
              <strong>MATNOG BRGYS</strong>
              <small>{selectedBarangay === "all" ? "Public Information Portal" : selectedBarangayName}</small>
            </span>
          </Link>

          <nav className={styles.desktopNav} aria-label="Public navigation">
            {publicNavigation.map((item) => (
              <Link
                key={item.href}
                className={pathname === item.href ? styles.activeNav : undefined}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.headerActions}>
            <Link className={styles.staffLink} href="/barangay-affairs">
              Staff Portal <ExternalLink size={14} aria-hidden="true" />
            </Link>
            <button
              className={styles.menuButton}
              type="button"
              aria-label={menuOpen ? "Close public navigation" : "Open public navigation"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav className={styles.mobileNav} aria-label="Mobile public navigation">
            {publicNavigation.map((item) => (
              <Link
                key={item.href}
                className={pathname === item.href ? styles.activeNav : undefined}
                href={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/barangay-affairs" onClick={() => setMenuOpen(false)}>
              Open Staff Portal
            </Link>
          </nav>
        ) : null}
      </header>

      <div className={styles.scopeBar}>
        <div>
          <span>Viewing public information for</span>
          <strong>{selectedBarangayName}</strong>
        </div>
        <Select value={selectedBarangay} onValueChange={setSelectedBarangay}>
          <SelectTrigger className={styles.scopeTrigger} aria-label="Select public portal barangay">
            <SelectValue />
            <ChevronDown className={styles.scopeChevron} size={15} aria-hidden="true" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Barangays</SelectItem>
            {MATNOG_BARANGAYS.map((barangay) => (
              <SelectItem key={barangay.code} value={barangay.code}>
                {barangay.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <main>{children}</main>

      <footer className={styles.publicFooter}>
        <div className={styles.footerGrid}>
          <div>
            <div className={styles.footerBrand}>
              <Building2 size={20} aria-hidden="true" />
              <strong>MATNOG BRGYS</strong>
            </div>
            <p>Public information from the Municipality of Matnog and its 40 barangays.</p>
          </div>
          <div>
            <strong>Public information</strong>
            <Link href="/public/transparency">Transparency</Link>
            <Link href="/public/projects">Projects</Link>
            <Link href="/public/verify">Verify a document</Link>
          </div>
          <div>
            <strong>Municipal office</strong>
            <span>Matnog Municipal Hall, Sorsogon</span>
            <span>Monday–Friday, 8:00 AM–5:00 PM</span>
            <Link href="/public/feedback">Send feedback</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 Municipality of Matnog</span>
          <span>This portal publishes public records only.</span>
        </div>
      </footer>
    </div>
  );
}
