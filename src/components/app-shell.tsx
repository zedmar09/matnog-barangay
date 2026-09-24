"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  LogOut,
  MapPin,
  Menu,
  Search,
  Settings,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "./app-shell.module.css";
import { CURRENT_NAV_USER, HOME_ITEM, hasNavAccess, NAV_SECTIONS } from "./navigation";

function pathIsActive(pathname: string, path: string) {
  return pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));
}

export function AppShell({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const profileRef = useRef<HTMLDivElement>(null);
  const { selectedBarangayName, selectedBarangays, isAllSelected, toggleBarangay, selectAll } = useBarangayScope();
  const [barangayDropdownOpen, setBarangayDropdownOpen] = useState(false);
  const barangayDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (item.children?.some((child) => pathIsActive(pathname, child.path))) {
          setOpenModules((current) => new Set(current).add(item.label));
          return;
        }
      }
    }
  }, [pathname]);

  useEffect(() => {
    function closeProfile(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
      if (barangayDropdownRef.current && !barangayDropdownRef.current.contains(event.target as Node))
        setBarangayDropdownOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setBarangayDropdownOpen(false);
        setSidebarOpen(false);
      }
    }

    document.addEventListener("mousedown", closeProfile);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeProfile);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  if (pathname === "/" || pathname.startsWith("/verify/")) return <>{children}</>;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brandArea}>
          <button
            className={styles.mobileMenu}
            type="button"
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={21} aria-hidden="true" />
          </button>
          <a className={styles.brand} href="/" aria-label="MATNOG BRGYS home">
            <span className={styles.brandMark} aria-hidden="true">
              <Building2 size={20} strokeWidth={1.8} />
            </span>
            <strong>MATNOG BRGYS</strong>
          </a>
        </div>

        <div className={styles.headerFilters}>
          <div className={styles.barangayMultiSelect} ref={barangayDropdownRef}>
            <button
              className={styles.barangayTrigger}
              type="button"
              aria-label="Select barangays"
              aria-expanded={barangayDropdownOpen}
              onClick={() => setBarangayDropdownOpen((v) => !v)}
            >
              <MapPin size={16} strokeWidth={1.8} aria-hidden="true" />
              <span>{selectedBarangayName}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            {barangayDropdownOpen && (
              <div className={styles.barangayDropdown}>
                <button
                  className={`${styles.barangayOption} ${isAllSelected ? styles.barangayOptionActive : ""}`}
                  type="button"
                  onClick={selectAll}
                >
                  <span className={styles.barangayCheck}>{isAllSelected && <Check size={14} />}</span>
                  All Barangays
                </button>
                {MATNOG_BARANGAYS.map((barangay) => {
                  const selected = selectedBarangays.includes(barangay.code);
                  return (
                    <button
                      key={barangay.code}
                      className={`${styles.barangayOption} ${selected ? styles.barangayOptionActive : ""}`}
                      type="button"
                      onClick={() => toggleBarangay(barangay.code)}
                    >
                      <span className={styles.barangayCheck}>{selected && <Check size={14} />}</span>
                      {barangay.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className={styles.headerActions}>
          <Link className={styles.iconButton} href="/barangay-affairs/residents/search" aria-label="Advanced Search" title="Advanced Search">
            <Search size={18} aria-hidden="true" />
          </Link>
          <button className={styles.iconButton} type="button" aria-label="Settings" title="Settings">
            <Settings size={18} aria-hidden="true" />
          </button>

          <div className={styles.profile} ref={profileRef}>
            <button
              className={styles.profileTrigger}
              type="button"
              aria-label="Open profile menu"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((value) => !value)}
            >
              <span className={styles.avatar} aria-hidden="true">
                <UserRound size={18} strokeWidth={1.8} />
              </span>
              <span className={styles.profileCopy}>
                <strong>Barangay Admin</strong>
                <small>Staff account</small>
              </span>
              <ChevronDown size={15} aria-hidden="true" />
            </button>

            {profileOpen ? (
              <div className={styles.profileMenu} role="menu">
                <div className={styles.profileMenuHeader}>
                  <span className={styles.avatar} aria-hidden="true">
                    <UserRound size={18} strokeWidth={1.8} />
                  </span>
                  <div>
                    <strong>Barangay Admin</strong>
                    <small>Municipality of Matnog</small>
                  </div>
                </div>
                <div className={styles.menuDivider} />
                <button type="button" role="menuitem">
                  <CircleUserRound size={16} aria-hidden="true" /> Profile
                </button>
                <button type="button" role="menuitem">
                  <SlidersHorizontal size={16} aria-hidden="true" /> Account settings
                </button>
                <div className={styles.menuDivider} />
                <button type="button" role="menuitem">
                  <LogOut size={16} aria-hidden="true" /> Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {sidebarOpen ? (
        <button
          className={styles.scrim}
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`} aria-label="Main navigation">
        <button
          className={styles.closeSidebar}
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={19} aria-hidden="true" />
        </button>
        <div className={styles.sidebarTitle} title={selectedBarangayName}>
          {selectedBarangayName}
        </div>
        <nav>
          <Link
            className={`${styles.navButton} ${pathname === HOME_ITEM.path ? styles.navActive : ""}`}
            href={HOME_ITEM.path ?? "/barangay-affairs"}
            aria-label={HOME_ITEM.label}
            aria-current={pathname === HOME_ITEM.path ? "page" : undefined}
            title={HOME_ITEM.label}
            onClick={() => setSidebarOpen(false)}
          >
            <HOME_ITEM.icon size={19} strokeWidth={1.9} aria-hidden="true" />
            <span>{HOME_ITEM.label}</span>
          </Link>

          {NAV_SECTIONS.filter((section) => hasNavAccess(section, CURRENT_NAV_USER)).map((section) => {
            const visibleItems = section.items.filter((item) => hasNavAccess(item, CURRENT_NAV_USER));
            if (visibleItems.length === 0) return null;
            const activeDirectPath = visibleItems
              .filter((item) => item.path && pathIsActive(pathname, item.path))
              .sort((left, right) => (right.path?.length ?? 0) - (left.path?.length ?? 0))[0]?.path;
            return (
              <section className={styles.navSection} key={section.label}>
                {section.hideLabel ? null : <h2>{section.label}</h2>}
                <div className={styles.sectionItems}>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const visibleChildren = item.children?.filter((child) => hasNavAccess(child, CURRENT_NAV_USER));
                    const parentActive = visibleChildren?.some((child) => pathIsActive(pathname, child.path)) ?? false;
                    const activeChildPath = visibleChildren
                      ?.filter((child) => pathIsActive(pathname, child.path))
                      .sort((left, right) => right.path.length - left.path.length)[0]?.path;
                    const expanded = openModules.has(item.label);

                    if (visibleChildren?.length) {
                      return (
                        <div className={styles.navModule} key={item.label}>
                          <button
                            className={`${styles.navButton} ${parentActive ? styles.navParentActive : ""}`}
                            type="button"
                            aria-label={item.label}
                            aria-expanded={expanded}
                            title={item.label}
                            onClick={() =>
                              setOpenModules((current) => {
                                const next = new Set(current);
                                if (next.has(item.label)) next.delete(item.label);
                                else next.add(item.label);
                                return next;
                              })
                            }
                          >
                            <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
                            <span>{item.label}</span>
                            <ChevronRight className={styles.moduleChevron} size={15} aria-hidden="true" />
                          </button>
                          {expanded ? (
                            <div className={styles.navChildren}>
                              {visibleChildren.map((child) => {
                                const active = child.path === activeChildPath;
                                return (
                                  <Link
                                    key={child.path}
                                    href={child.path}
                                    className={active ? styles.childActive : ""}
                                    aria-current={active ? "page" : undefined}
                                    onClick={() => setSidebarOpen(false)}
                                  >
                                    {child.label}
                                  </Link>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    }

                    const active = item.path === activeDirectPath;
                    return (
                      <Link
                        key={item.label}
                        href={item.path ?? "/"}
                        className={`${styles.navButton} ${active ? styles.navActive : ""}`}
                        aria-label={item.label}
                        aria-current={active ? "page" : undefined}
                        title={item.label}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </nav>
      </aside>

      <main className={styles.workspace} aria-label="Workspace">
        {children}
      </main>
    </div>
  );
}
